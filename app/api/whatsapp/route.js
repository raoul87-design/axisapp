const VERIFY_TOKEN = "axis-cron-2024-xk9p"

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const mode      = searchParams.get("hub.mode")
  const token     = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("WhatsApp webhook verified")
    return new Response(challenge, { status: 200 })
  }

  return new Response("Forbidden", { status: 403 })
}

export async function POST(request) {
  const body = await request.json()
  console.log("WhatsApp incoming message:", JSON.stringify(body))
  return new Response(null, { status: 200 })
}
