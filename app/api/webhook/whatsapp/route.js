import { waitUntil } from "@vercel/functions"
import twilio from "twilio"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Je bent een persoonlijke discipline coach. Je bent motiverend maar direct. Maximaal 2 zinnen per antwoord. Spreek de gebruiker aan met jij/je.`

async function handleMessage(from, body) {
  try {
    console.log("=== [2] ANTHROPIC API CALL STARTEN ===")
    console.log("API key aanwezig:", !!process.env.ANTHROPIC_API_KEY)

    const aiResponse = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: body }],
    })

    console.log("=== [3] ANTHROPIC RESPONSE ONTVANGEN ===")
    console.log("Stop reason:", aiResponse.stop_reason)
    const reply = aiResponse.content[0].text
    console.log("Antwoord:", reply)

    console.log("=== [4] BERICHT VERSTUREN VIA TWILIO CLIENT ===")
    console.log("Naar:", from)
    console.log("TWILIO_ACCOUNT_SID aanwezig:", !!process.env.TWILIO_ACCOUNT_SID)
    console.log("TWILIO_AUTH_TOKEN aanwezig:", !!process.env.TWILIO_AUTH_TOKEN)

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
    console.error("Stack:", error.stack)
  }
}

export async function POST(request) {
  const formData = await request.formData()

  const from = formData.get("From")
  const body = formData.get("Body")

  console.log("=== [1] BERICHT ONTVANGEN ===")
  console.log("Van:", from)
  console.log("Tekst:", body)

  // Stuur direct 200 terug aan Twilio, verwerk asynchroon
  waitUntil(handleMessage(from, body))

  return new Response(null, { status: 200 })
}
