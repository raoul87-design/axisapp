import twilio from "twilio"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Je bent een persoonlijke discipline coach. Je bent motiverend maar direct. Maximaal 2 zinnen per antwoord. Spreek de gebruiker aan met jij/je.`

export async function POST(request) {
  try {
    const formData = await request.formData()

    const from = formData.get("From")
    const body = formData.get("Body")

    // 1) Binnenkomend bericht ontvangen
    console.log("=== [1] BERICHT ONTVANGEN ===")
    console.log("Van:", from)
    console.log("Tekst:", body)

    // 2) Voor Anthropic API call
    console.log("=== [2] ANTHROPIC API CALL STARTEN ===")
    console.log("Model: claude-haiku-4-5-20251001")
    console.log("API key aanwezig:", !!process.env.ANTHROPIC_API_KEY)

    const aiResponse = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: body }],
    })

    // 3) Na Anthropic API call
    console.log("=== [3] ANTHROPIC RESPONSE ONTVANGEN ===")
    console.log("Stop reason:", aiResponse.stop_reason)
    const reply = aiResponse.content[0].text
    console.log("Antwoord:", reply)

    // 4) Bericht actief versturen via Twilio client
    console.log("=== [4] BERICHT VERSTUREN VIA TWILIO CLIENT ===")
    console.log("Naar:", from)
    console.log("TWILIO_ACCOUNT_SID aanwezig:", !!process.env.TWILIO_ACCOUNT_SID)
    console.log("TWILIO_AUTH_TOKEN aanwezig:", !!process.env.TWILIO_AUTH_TOKEN)
    console.log("TWILIO_WHATSAPP_NUMBER:", process.env.TWILIO_WHATSAPP_NUMBER)

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

    const message = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: from,
      body: reply,
    })

    console.log("Twilio SID:", message.sid)
    console.log("Status:", message.status)

    return new Response("OK", { status: 200 })
  } catch (error) {
    console.error("=== [ERROR] ===")
    console.error("Naam:", error.name)
    console.error("Bericht:", error.message)
    console.error("Stack:", error.stack)

    return new Response("Internal Server Error", { status: 500 })
  }
}
