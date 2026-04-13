import twilio from "twilio"

export async function POST(request) {
  const formData = await request.formData()

  const from = formData.get("From")
  const body = formData.get("Body")

  console.log("WhatsApp bericht ontvangen")
  console.log("Van:", from)
  console.log("Tekst:", body)

  const twiml = new twilio.twiml.MessagingResponse()
  twiml.message("Goedemorgen! Wat commit jij vandaag?")

  return new Response(twiml.toString(), {
    headers: { "Content-Type": "text/xml" },
  })
}
