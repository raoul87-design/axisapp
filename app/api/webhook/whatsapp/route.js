import { waitUntil } from "@vercel/functions"
import twilio from "twilio"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@supabase/supabase-js"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const supabase = createClient(
  "https://zdqrrprjkddlxszmtcmx.supabase.co",
  process.env.SUPABASE_SERVICE_KEY || "sb_publishable__cdXODEiCbsHvycy6uuB_g_SIIgI6YH"
)

const SYSTEM_PROMPTS = {
  brutal: `Je bent een harde discipline coach. Je bent direct, confronterend en zonder medelijden.
Je spreekt de waarheid, ook als het pijn doet. Maximaal 2 zinnen. Spreek de gebruiker aan met jij/je.`,

  hard: `Je bent een strenge discipline coach. Je bent eerlijk en direct, maar respectvol.
Je houdt de gebruiker scherp. Maximaal 2 zinnen. Spreek de gebruiker aan met jij/je.`,

  medium: `Je bent een begeleidende discipline coach. Je bent motiverend en direct.
Je helpt de gebruiker focussen. Maximaal 2 zinnen. Spreek de gebruiker aan met jij/je.`,

  soft: `Je bent een warme discipline coach. Je bent bemoedigend en positief.
Je viert voortgang en houdt het momentum vast. Maximaal 2 zinnen. Spreek de gebruiker aan met jij/je.`,
}

function getTone(streak, missedDays) {
  if (missedDays >= 4) return "brutal"
  if (missedDays >= 2) return "hard"
  if (streak >= 7) return "soft"
  if (streak >= 3) return "medium"
  return "medium"
}

function normalizeNumber(raw) {
  // "whatsapp:0613002594" → "whatsapp:+31613002594"
  return raw.replace(/^(whatsapp:)0/, "$1+31")
}

function getNLDate() {
  // Gebruik Nederlandse tijd (Europe/Amsterdam) zodat na 22:00 UTC niet als morgen telt
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" })
}

async function getUserData(whatsappNumber) {
  const { data, error } = await supabase
    .from("users")
    .select("id, auth_user_id, streak, missed_days, awaiting_reflection")
    .eq("whatsapp_number", whatsappNumber)
    .single()

  if (error) {
    console.log("Geen gebruiker gevonden voor:", whatsappNumber)
    return null
  }

  return data
}

async function saveWhatsappNumber(whatsappNumber) {
  const { error } = await supabase
    .from("users")
    .upsert({ whatsapp_number: whatsappNumber }, { onConflict: "whatsapp_number" })

  if (error) {
    console.error("Fout bij opslaan WhatsApp nummer:", error.message)
  } else {
    console.log("WhatsApp nummer opgeslagen:", whatsappNumber)
  }
}

async function sendWhatsApp(to, body) {
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  const message = await client.messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
    to,
    body,
  })
  console.log("Twilio SID:", message.sid, "| Status:", message.status)
}

// Classificeer het bericht via Claude
async function classifyIntent(body) {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 20,
    messages: [
      {
        role: "user",
        content: `Classificeer dit bericht in één van deze categorieën:
- COMMITMENT: de user maakt een belofte voor vandaag
- METRIC: de user deelt een meting (gewicht, stappen, etc)
- VRAAG: de user stelt een vraag
- REFLECTIE: de user antwoordt ja/nee op een check-out
- OVERIG: alles wat niet past

Bericht: "${body}"

Antwoord alleen met de categorie in hoofdletters.`,
      },
    ],
  })
  const raw = response.content[0].text.trim().toUpperCase()
  const valid = ["COMMITMENT", "METRIC", "VRAAG", "REFLECTIE", "OVERIG"]
  const intent = valid.find((v) => raw.includes(v)) ?? "OVERIG"
  console.log("Claude intent raw:", raw, "→ genormaliseerd:", intent)
  return intent
}

// Detecteer metriek-type op basis van sleutelwoorden
function extractMetricType(body) {
  const lower = body.toLowerCase()
  if (lower.includes("kg") || lower.includes("gewicht") || lower.includes("weeg")) return "gewicht"
  if (lower.includes("stap") || lower.includes("step") || lower.includes("gelopen")) return "stappen"
  if (lower.includes("slaap") || lower.includes("geslapen")) return "slaap"
  if (lower.includes("calorie") || lower.includes("kcal")) return "calorie"
  return "anders"
}

async function handleReflection(from, body, userData) {
  console.log("=== [3] REFLECTIE VERWERKEN ===")
  const { streak, missed_days: missedDays, auth_user_id: authUserId, id } = userData
  const normalized = body.trim().toLowerCase()
  const completed = normalized === "ja" || normalized === "yes"

  if (authUserId) {
    await supabase.from("reflections").insert({
      user_id: authUserId,
      completed,
      answer: body,
    })
    console.log("Reflectie opgeslagen:", completed)
  }

  const newStreak = completed ? streak + 1 : 0
  const newMissedDays = completed ? 0 : missedDays + 1
  await supabase
    .from("users")
    .update({ streak: newStreak, missed_days: newMissedDays, awaiting_reflection: false })
    .eq("id", id)

  console.log("Streak bijgewerkt:", newStreak, "| MissedDays:", newMissedDays)

  const reply = completed
    ? `Geweldig! 🔥 Streak staat nu op ${newStreak} ${newStreak === 1 ? "dag" : "dagen"}. Morgen weer!`
    : `Oké, eerlijk is eerlijk. Morgen is een nieuwe kans — wat ga jij anders doen?`

  await sendWhatsApp(from, reply)
  console.log("Reflectie reply verstuurd")
}

async function handleCommitment(from, body, userData, tone) {
  console.log("=== [3] COMMITMENT OPSLAAN ===")
  const commitUserId = userData?.auth_user_id || userData?.id
  const today = getNLDate()
  const { error: commitError } = await supabase
    .from("commitments")
    .insert({ user_id: commitUserId, text: body, date: today, done: false })
  if (commitError) {
    console.error("Fout bij opslaan commitment:", commitError.message)
  } else {
    console.log("Commitment opgeslagen voor user:", commitUserId, "| datum:", today)
  }

  console.log("=== [4] AI REPLY (COMMITMENT) ===")
  const aiResponse = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 256,
    system: SYSTEM_PROMPTS[tone],
    messages: [{ role: "user", content: body }],
  })
  await sendWhatsApp(from, aiResponse.content[0].text)
}

async function handleMetric(from, body, userData) {
  console.log("=== [3] METRIC OPSLAAN ===")
  const userId = userData?.auth_user_id || userData?.id
  const type = extractMetricType(body)
  const today = getNLDate()

  const { error } = await supabase.from("metrics").insert({
    user_id: userId,
    type,
    waarde: body,
    datum: today,
  })
  if (error) {
    console.error("Fout bij opslaan metric:", error.message)
  } else {
    console.log("Metric opgeslagen | type:", type, "| user:", userId)
  }

  const reply = `Opgeslagen! Je ${type === "anders" ? "meting" : type} is genoteerd. 📊`
  await sendWhatsApp(from, reply)
}

async function handleVraag(from, body) {
  console.log("=== [3] VRAAG BEANTWOORDEN ===")
  const aiResponse = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 512,
    system: `Je bent een behulpzame AXIS coach assistent. Beantwoord de vraag van de gebruiker kort en duidelijk. Maximaal 3 zinnen. Spreek de gebruiker aan met jij/je.`,
    messages: [{ role: "user", content: body }],
  })
  await sendWhatsApp(from, aiResponse.content[0].text)
}

async function handleOverig(from) {
  console.log("=== [3] OVERIG — VRIENDELIJK ANTWOORD ===")
  const reply = `Hmm, ik weet niet goed wat ik daarmee moet. Stuur me een commitment voor vandaag, een meting, of stel een vraag!`
  await sendWhatsApp(from, reply)
}

async function handleMessage(from, body) {
  try {
    console.log("=== [2] GEBRUIKER OPHALEN / OPSLAAN ===")
    await saveWhatsappNumber(from)

    const userData = await getUserData(from)
    const streak = userData?.streak ?? 0
    const missedDays = userData?.missed_days ?? 0
    const tone = getTone(streak, missedDays)
    const awaitingReflection = userData?.awaiting_reflection ?? false

    console.log("Streak:", streak, "| MissedDays:", missedDays, "| Toon:", tone)
    console.log("Awaiting reflection:", awaitingReflection)

    // Reflectie heeft prioriteit: als de flag gezet is, altijd reflectie-flow
    if (awaitingReflection) {
      await handleReflection(from, body, userData)
      return
    }

    // Classificeer intent via Claude
    console.log("=== [3] INTENT CLASSIFICEREN ===")
    const intent = await classifyIntent(body)

    switch (intent) {
      case "COMMITMENT":
        await handleCommitment(from, body, userData, tone)
        break
      case "METRIC":
        await handleMetric(from, body, userData)
        break
      case "VRAAG":
        await handleVraag(from, body)
        break
      case "REFLECTIE":
        // Reflectie zonder actieve flag → behandel als OVERIG (niemand vroeg erom)
        await handleOverig(from)
        break
      case "OVERIG":
      default:
        await handleOverig(from)
        break
    }
  } catch (error) {
    console.error("=== [ERROR] ===")
    console.error("Naam:", error.name)
    console.error("Bericht:", error.message)
    console.error("Status:", error.status)
    console.error("Volledige error:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
  }
}

export async function POST(request) {
  const formData = await request.formData()

  const from = normalizeNumber(formData.get("From"))
  const body = formData.get("Body")

  console.log("=== [1] BERICHT ONTVANGEN ===")
  console.log("Van:", from)
  console.log("Tekst:", body)

  waitUntil(handleMessage(from, body))

  return new Response(null, { status: 200 })
}
