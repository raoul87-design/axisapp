import twilio from "twilio"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  "https://zdqrrprjkddlxszmtcmx.supabase.co",
  process.env.SUPABASE_SERVICE_KEY || "sb_publishable__cdXODEiCbsHvycy6uuB_g_SIIgI6YH"
)

export async function GET(request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 })
  }

  console.log("=== [MIDNIGHT CHECK] START ===")

  try {
    // Haal users op die de avond check-in NIET hebben beantwoord
    const { data: users, error } = await supabase
      .from("users")
      .select("id, streak, missed_days, awaiting_reflection, whatsapp_number, name")
      .eq("awaiting_reflection", true)

    if (error) {
      console.error("Fout bij ophalen users:", error.message)
      return new Response("DB error", { status: 500 })
    }

    console.log(`${users.length} users hebben niet gereageerd op avond check-in`)

    for (const user of users) {
      const newMissedDays = (user.missed_days ?? 0) + 1
      const newStreak = 0 // geen reactie = dag gemist = streak reset

      await supabase
        .from("users")
        .update({
          streak: newStreak,
          missed_days: newMissedDays,
          awaiting_reflection: false,
        })
        .eq("id", user.id)

      console.log(`User ${user.id}: streak → ${newStreak}, missed_days → ${newMissedDays}`)

      // Stuur motiverend WhatsApp bericht bij streak reset
      if (user.whatsapp_number) {
        try {
          const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
          const fn = user.name?.trim().split(/\s+/)[0]
          const greeting = fn ? `Hey ${fn}` : "Hey"
          await twilioClient.messages.create({
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            to: user.whatsapp_number,
            body: `${greeting}, geen check-out gisteren — streak gereset. Vandaag opnieuw beginnen. Kleine stappen tellen.`,
          })
          console.log(`Streak reset bericht verstuurd naar ${user.whatsapp_number}`)
        } catch (err) {
          console.error(`WhatsApp fout voor ${user.whatsapp_number}:`, err.message)
        }
      }
    }

    console.log("=== [MIDNIGHT CHECK] KLAAR ===")
    return new Response(
      JSON.stringify({ processed: users.length }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Cron error:", error.message)
    return new Response("Internal error", { status: 500 })
  }
}
