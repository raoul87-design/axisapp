import twilio from "twilio"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  "https://zdqrrprjkddlxszmtcmx.supabase.co",
  process.env.SUPABASE_SERVICE_KEY || "sb_publishable__cdXODEiCbsHvycy6uuB_g_SIIgI6YH"
)

function getNLTime() {
  const now = new Date()
  const hour = now.toLocaleString("nl-NL", { timeZone: "Europe/Amsterdam", hour: "2-digit", minute: "2-digit", hour12: false })
  const date = now.toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" })
  return { hour, date }
}

export async function GET(request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } })
  }

  const { hour: currentTime, date: currentDate } = getNLTime()
  console.log(`=== [REMINDERS CRON] START === Tijd (NL): ${currentTime} | Datum: ${currentDate}`)
  console.log("TWILIO_ACCOUNT_SID aanwezig:", !!process.env.TWILIO_ACCOUNT_SID)
  console.log("TWILIO_AUTH_TOKEN aanwezig:", !!process.env.TWILIO_AUTH_TOKEN)
  console.log("CRON_SECRET aanwezig:", !!process.env.CRON_SECRET)

  try {
    // Fetch all active reminders matching current time — filter eenmalig in JS to avoid complex PostgREST OR
    const { data: allReminders, error } = await supabase
      .from("reminders")
      .select("id, tekst, tijd, eenmalig, datum, user_id, users(whatsapp_number, name)")
      .eq("actief", true)
      .eq("tijd", currentTime)

    if (error) {
      console.error("Fout bij ophalen reminders:", error.message)
      return new Response(JSON.stringify({ error: "DB error", detail: error.message }), { status: 500, headers: { "Content-Type": "application/json" } })
    }

    // Keep daily reminders (eenmalig falsy) + one-time reminders scheduled for today
    const reminders = (allReminders ?? []).filter(r => !r.eenmalig || r.datum === currentDate)
    console.log(`${allReminders.length} gevonden, ${reminders.length} geldig voor ${currentTime} op ${currentDate}`)

    const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    const results = []

    for (const reminder of reminders) {
      const user = reminder.users
      if (!user?.whatsapp_number) {
        console.warn(`[reminder ${reminder.id}] Geen WhatsApp nummer — overgeslagen`)
        continue
      }

      const firstName = user.name?.trim().split(/\s+/)[0] ?? null
      const greeting  = firstName ? `Hey ${firstName}` : "Hey"
      const message   = `${greeting} — ${reminder.tekst} 💊`

      try {
        const msg = await twilioClient.messages.create({
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
          to: user.whatsapp_number,
          body: message,
        })
        console.log(`[${user.whatsapp_number}] Reminder verstuurd | SID: ${msg.sid} | eenmalig: ${!!reminder.eenmalig}`)

        // Deactivate one-time reminders after sending
        if (reminder.eenmalig) {
          const { error: deactivateError } = await supabase
            .from("reminders")
            .update({ actief: false })
            .eq("id", reminder.id)
          if (deactivateError) console.error(`[${reminder.id}] Deactiveren mislukt:`, deactivateError.message)
          else console.log(`[${reminder.id}] Eenmalige reminder gedeactiveerd`)
        }

        results.push({ whatsapp: user.whatsapp_number, status: "ok", sid: msg.sid })
      } catch (err) {
        console.error(`[${user.whatsapp_number}] ERROR:`, err.message)
        results.push({ whatsapp: user.whatsapp_number, status: "error", error: err.message })
      }
    }

    console.log("=== [REMINDERS CRON] KLAAR ===")
    return new Response(JSON.stringify({ time: currentTime, date: currentDate, sent: results.length, results }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Cron error:", error.message)
    return new Response(JSON.stringify({ error: "Internal error", detail: error.message }), { status: 500, headers: { "Content-Type": "application/json" } })
  }
}
