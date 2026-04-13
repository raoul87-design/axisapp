import twilio from "twilio"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  "https://zdqrrprjkddlxszmtcmx.supabase.co",
  process.env.SUPABASE_SERVICE_KEY || "sb_publishable__cdXODEiCbsHvycy6uuB_g_SIIgI6YH"
)

const MORNING_MESSAGE = "Goedemorgen! 🌅 Wat ga jij vandaag committen? Stuur je commitment en ik houd je scherp."

export async function GET(request) {
  // Vercel cron verificatie
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 })
  }

  console.log("=== [MORNING CRON] START ===")

  try {
    // Haal alle users op met een gekoppeld WhatsApp nummer
    const { data: users, error } = await supabase
      .from("users")
      .select("id, whatsapp_number, auth_user_id")
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
        // Stuur WhatsApp check-in
        const message = await client.messages.create({
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
          to: user.whatsapp_number,
          body: MORNING_MESSAGE,
        })

        console.log(`Verstuurd naar ${user.whatsapp_number} — SID: ${message.sid}`)

        // Sla check-in op in check_ins tabel
        await supabase.from("check_ins").insert({
          user_id: user.id,
          sent_at: today,
          type: "morning",
        })

        results.push({ whatsapp: user.whatsapp_number, status: "ok" })
      } catch (err) {
        console.error(`Fout voor ${user.whatsapp_number}:`, err.message)
        results.push({ whatsapp: user.whatsapp_number, status: "error", error: err.message })
      }
    }

    console.log("=== [MORNING CRON] KLAAR ===")
    return new Response(JSON.stringify({ sent: results.length, results }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Cron error:", error.message)
    return new Response("Internal error", { status: 500 })
  }
}
