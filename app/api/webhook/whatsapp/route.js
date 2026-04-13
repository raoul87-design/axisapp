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

async function getUserData(whatsappNumber) {
  const { data, error } = await supabase
    .from("users")
    .select("id, auth_user_id, streak, missed_days")
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

async function handleMessage(from, body) {
  try {
    // Stap 1: WhatsApp nummer opslaan als het nog niet bestaat
    console.log("=== [2] GEBRUIKER OPHALEN / OPSLAAN ===")
    await saveWhatsappNumber(from)

    const userData = await getUserData(from)
    const streak = userData?.streak ?? 0
    const missedDays = userData?.missed_days ?? 0
    const tone = getTone(streak, missedDays)

    console.log("Streak:", streak, "| MissedDays:", missedDays, "| Toon:", tone)

    // Stap 2: Commitment opslaan met auth_user_id
    console.log("=== [3] COMMITMENT OPSLAAN ===")
    const authUserId = userData?.auth_user_id
    if (authUserId) {
      const today = new Date().toISOString().split("T")[0]
      const { error: commitError } = await supabase
        .from("commitments")
        .insert({
          user_id: authUserId,
          text: body,
          date: today,
          done: false,
        })
      if (commitError) {
        console.error("Fout bij opslaan commitment:", commitError.message)
      } else {
        console.log("Commitment opgeslagen voor auth_user_id:", authUserId)
      }
    } else {
      console.log("Geen auth_user_id gekoppeld aan dit WhatsApp nummer — commitment niet opgeslagen")
    }

    // Stap 3: AI reply
    console.log("=== [4] ANTHROPIC API CALL ===")
    console.log("Toon:", tone)
    console.log("API key aanwezig:", !!process.env.ANTHROPIC_API_KEY)

    const aiResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 256,
      system: SYSTEM_PROMPTS[tone],
      messages: [{ role: "user", content: body }],
    })
    const reply = aiResponse.content[0].text

    console.log("Antwoord:", reply)

    // Stap 3: Versturen via Twilio
    console.log("=== [5] BERICHT VERSTUREN ===")
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

    const message = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: from,
      body: reply,
    })

    console.log("Twilio SID:", message.sid)
    console.log("Status:", message.status)
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

  const from = formData.get("From")
  const body = formData.get("Body")

  console.log("=== [1] BERICHT ONTVANGEN ===")
  console.log("Van:", from)
  console.log("Tekst:", body)

  waitUntil(handleMessage(from, body))

  return new Response(null, { status: 200 })
}
