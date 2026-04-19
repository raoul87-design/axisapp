import twilio from "twilio"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  "https://zdqrrprjkddlxszmtcmx.supabase.co",
  process.env.SUPABASE_SERVICE_KEY || "sb_publishable__cdXODEiCbsHvycy6uuB_g_SIIgI6YH"
)

function firstName(name) {
  if (!name || !name.trim()) return null
  return name.trim().split(/\s+/)[0]
}

function eveningMessage(name) {
  const fn = firstName(name)
  const greeting = fn ? `Hey ${fn}, hoe ging je dag?` : `Hey, hoe ging je dag?`
  return `${greeting} 💪 Heb je je commitments gehaald?\n\nAntwoord met *Ja* of *Nee*.`
}

export async function GET(request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 })
  }

  console.log("=== [EVENING CRON] START ===")

  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("id, whatsapp_number, name")
      .not("whatsapp_number", "is", null)

    if (error) {
      console.error("Fout bij ophalen users:", error.message)
      return new Response("DB error", { status: 500 })
    }

    console.log(`${users.length} users gevonden`)

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    const today = new Date().toISOString()
    const results = []

    for (const user of users) {
      try {
        // Stuur avond check-in
        const message = await client.messages.create({
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
          to: user.whatsapp_number,
          body: eveningMessage(user.name),
        })

        console.log(`Verstuurd naar ${user.whatsapp_number} — SID: ${message.sid}`)

        // Zet awaiting_reflection vlag op true
        await supabase
          .from("users")
          .update({ awaiting_reflection: true })
          .eq("id", user.id)

        // Log in check_ins
        await supabase.from("check_ins").insert({
          user_id: user.id,
          sent_at: today,
          type: "evening",
        })

        results.push({ whatsapp: user.whatsapp_number, status: "ok" })
      } catch (err) {
        console.error(`Fout voor ${user.whatsapp_number}:`, err.message)
        results.push({ whatsapp: user.whatsapp_number, status: "error", error: err.message })
      }
    }

    console.log("=== [EVENING CRON] KLAAR ===")
    return new Response(JSON.stringify({ sent: results.length, results }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Cron error:", error.message)
    return new Response("Internal error", { status: 500 })
  }
}
