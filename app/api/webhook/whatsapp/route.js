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
  return raw.replace(/^(whatsapp:)0/, "$1+31")
}

function getNLDate() {
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

// Splits het bericht in onderdelen en classificeert elk apart.
// Returnt een array van items, bv:
// [{ categorie: "METRIC", metric_type: "gewicht", waarde: "76kg" },
//  { categorie: "COMMITMENT", tekst: "45 min fietsen" }]
async function parseCheckin(body) {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Analyseer dit WhatsApp bericht van een fitness/discipline app gebruiker.
Splits het op in losse onderdelen en classificeer elk onderdeel.

Geef terug als JSON array. Elk object heeft:
- "categorie": "COMMITMENT" | "METRIC" | "VRAAG" | "REFLECTIE" | "OVERIG"
- Voor METRIC ook: "metric_type" (kies uit: gewicht/voeding/stappen/slaap/anders) en "waarde" (de waarde als string, bijv. "76kg" of "2000 kcal")
- Voor alle andere categorieën ook: "tekst" (de originele tekst van dit onderdeel)

Richtlijnen:
- gewicht: alles met kg of een getal + gewichtsindicatie
- voeding: calorieën, kcal, gegeten, voeding
- stappen: stappen, steps, gelopen km
- slaap: slaap, geslapen, uur geslapen
- COMMITMENT: een belofte of plan voor vandaag (sporten, mediteren, taken, etc.)
- VRAAG: een vraagzin
- REFLECTIE: alleen een "ja" of "nee" als antwoord

Voorbeelden:
- "76kg" → [{"categorie":"METRIC","metric_type":"gewicht","waarde":"76kg"}]
- "2000 kcal, 45 min fietsen" → [{"categorie":"METRIC","metric_type":"voeding","waarde":"2000 kcal"},{"categorie":"COMMITMENT","tekst":"45 min fietsen"}]
- "Hoeveel water?" → [{"categorie":"VRAAG","tekst":"Hoeveel water?"}]

Bericht: "${body.replace(/"/g, "'")}"

Antwoord ALLEEN met de JSON array, geen andere tekst.`,
      },
    ],
  })

  const raw = response.content[0].text.trim()
  console.log("Claude parseCheckin raw:", raw)

  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) return parsed
  } catch (e) {
    console.error("JSON parse fout:", e.message, "| raw:", raw)
  }

  // Fallback: behandel als OVERIG
  return [{ categorie: "OVERIG", tekst: body }]
}

// Bouw het overzichtsbericht op basis van opgeslagen items
function buildConfirmation(savedItems) {
  const METRIC_ICONS = {
    gewicht: "⚖️",
    voeding: "🍽️",
    stappen: "👟",
    slaap: "😴",
    anders: "📊",
  }
  const METRIC_LABELS = {
    gewicht: "Gewicht",
    voeding: "Voeding",
    stappen: "Stappen",
    slaap: "Slaap",
    anders: "Meting",
  }

  const lines = savedItems
    .map((item) => {
      if (item.categorie === "METRIC") {
        const type = item.metric_type || "anders"
        const icon = METRIC_ICONS[type] || "📊"
        const label = METRIC_LABELS[type] || type
        return `${icon} ${label}: ${item.waarde}`
      }
      if (item.categorie === "COMMITMENT") {
        return `💪 ${item.tekst}`
      }
      return null
    })
    .filter(Boolean)

  if (lines.length === 0) return null
  return `✅ Check-in ontvangen:\n${lines.join("\n")}\n\nGo! 🔥`
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
  await sendWhatsApp(
    from,
    `Hmm, ik weet niet goed wat ik daarmee moet. Stuur me een commitment voor vandaag, een meting, of stel een vraag!`
  )
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

    // Reflectie heeft prioriteit: als de flag gezet is altijd reflectie-flow
    if (awaitingReflection) {
      await handleReflection(from, body, userData)
      return
    }

    // Parse het bericht — returnt altijd een array van onderdelen
    console.log("=== [3] BERICHT PARSEN ===")
    const items = await parseCheckin(body)
    console.log("Gevonden items:", JSON.stringify(items))

    const metrics     = items.filter((i) => i.categorie === "METRIC")
    const commitments = items.filter((i) => i.categorie === "COMMITMENT")
    const vragen      = items.filter((i) => i.categorie === "VRAAG")

    // Enkelvoudige speciale gevallen
    if (items.length === 1) {
      if (vragen.length === 1) {
        await handleVraag(from, body)
        return
      }
      if (items[0].categorie === "REFLECTIE" || items[0].categorie === "OVERIG") {
        await handleOverig(from)
        return
      }
      // Enkel commitment → AI coach reply (bestaand gedrag)
      if (commitments.length === 1 && metrics.length === 0) {
        console.log("=== [4] ENKEL COMMITMENT — AI COACH REPLY ===")
        const userId = userData?.auth_user_id || userData?.id
        const today  = getNLDate()
        const { error } = await supabase
          .from("commitments")
          .insert({ user_id: userId, text: commitments[0].tekst, date: today, done: false })
        if (error) console.error("Commitment opslaan mislukt:", error.message)
        else console.log("Commitment opgeslagen:", commitments[0].tekst)

        const aiResponse = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 256,
          system: SYSTEM_PROMPTS[tone],
          messages: [{ role: "user", content: body }],
        })
        await sendWhatsApp(from, aiResponse.content[0].text)
        return
      }
    }

    // Multi-part of bevat metrics → alles opslaan + bevestiging sturen
    console.log("=== [4] MULTI-PART CHECK-IN VERWERKEN ===")
    const userId = userData?.auth_user_id || userData?.id
    const today  = getNLDate()
    const savedItems = []

    for (const item of metrics) {
      const { error } = await supabase.from("metrics").insert({
        user_id: userId,
        type:    item.metric_type || "anders",
        waarde:  item.waarde,
        datum:   today,
      })
      if (error) {
        console.error("Metric opslaan mislukt:", error.message)
      } else {
        console.log("Metric opgeslagen | type:", item.metric_type, "| waarde:", item.waarde)
        savedItems.push(item)
      }
    }

    for (const item of commitments) {
      const { error } = await supabase.from("commitments").insert({
        user_id: userId,
        text:    item.tekst,
        date:    today,
        done:    false,
      })
      if (error) {
        console.error("Commitment opslaan mislukt:", error.message)
      } else {
        console.log("Commitment opgeslagen:", item.tekst)
        savedItems.push(item)
      }
    }

    const confirmation = buildConfirmation(savedItems)
    if (confirmation) {
      await sendWhatsApp(from, confirmation)
    } else {
      await handleOverig(from)
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
