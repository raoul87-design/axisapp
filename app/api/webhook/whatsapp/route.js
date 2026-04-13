import twilio from "twilio"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Je bent een persoonlijke discipline coach. Je bent motiverend maar direct. Maximaal 2 zinnen per antwoord. Spreek de gebruiker aan met jij/je.`

export async function POST(request) {
  const formData = await request.formData()

  const from = formData.get("From")
  const body = formData.get("Body")

  console.log("WhatsApp bericht ontvangen")
  console.log("Van:", from)
  console.log("Tekst:", body)

  const aiResponse = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: body }],
  })

  const reply = aiResponse.content[0].text

  console.log("AI antwoord:", reply)

  const twiml = new twilio.twiml.MessagingResponse()
  twiml.message(reply)

  return new Response(twiml.toString(), {
    headers: { "Content-Type": "text/xml" },
  })
}
