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

function morningMessage(name, kcalDoel, eiwittenDoel) {
  const fn = firstName(name)
  const greeting = fn ? `Goedemorgen ${fn}! 🌅` : `Goedemorgen! 🌅`

  if (kcalDoel) {
    const doelLines = [`- Kcal: ${kcalDoel}`]
    if (eiwittenDoel) doelLines.push(`- Eiwitten: ${eiwittenDoel}g`)
    return `${greeting} Stuur je check-in voor vandaag.

Jouw doel vandaag:
${doelLines.join("\n")}

Commitment, gewicht en voeding zijn optioneel — stuur wat voor jou werkt.`
  }

  return `${greeting} Stuur je check-in voor vandaag.

Bijvoorbeeld:
- Commitment: 45 min sporten
- Gewicht: 76kg
- Voeding: 2000 kcal

Alles is optioneel — stuur wat voor jou werkt.`
}

export async function GET(request) {
  // Vercel cron verificatie
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 })
  }

  console.log("=== [MORNING CRON] START ===")
  console.log("TWILIO_ACCOUNT_SID aanwezig:", !!process.env.TWILIO_ACCOUNT_SID)
  console.log("TWILIO_AUTH_TOKEN aanwezig:", !!process.env.TWILIO_AUTH_TOKEN)
  console.log("TWILIO_WHATSAPP_NUMBER:", process.env.TWILIO_WHATSAPP_NUMBER)

  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("id, whatsapp_number, auth_user_id, name, kcal_doel, eiwitten_doel")
      .not("whatsapp_number", "is", null)

    if (error) {
      console.error("Fout bij ophalen users:", error.message)
      return new Response("DB error", { status: 500 })
    }

    console.log(`${users.length} users gevonden:`, users.map(u => u.whatsapp_number))

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    const today = new Date().toISOString()
    const results = []

    for (const user of users) {
      const from = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`
      console.log(`[${user.whatsapp_number}] Sturen van ${from}...`)
      try {
        const message = await client.messages.create({
          from,
          to: user.whatsapp_number,
          body: morningMessage(user.name, user.kcal_doel, user.eiwitten_doel),
        })

        console.log(`[${user.whatsapp_number}] SID: ${message.sid}`)
        console.log(`[${user.whatsapp_number}] Status: ${message.status}`)
        console.log(`[${user.whatsapp_number}] ErrorCode: ${message.errorCode}`)
        console.log(`[${user.whatsapp_number}] ErrorMessage: ${message.errorMessage}`)

        await supabase.from("check_ins").insert({
          user_id: user.id,
          sent_at: today,
          type: "morning",
        })

        results.push({ whatsapp: user.whatsapp_number, status: "ok", sid: message.sid, twilioStatus: message.status })
      } catch (err) {
        console.error(`[${user.whatsapp_number}] ERROR:`, err.message)
        console.error(`[${user.whatsapp_number}] Code:`, err.code)
        console.error(`[${user.whatsapp_number}] Status:`, err.status)
        console.error(`[${user.whatsapp_number}] MoreInfo:`, err.moreInfo)
        results.push({ whatsapp: user.whatsapp_number, status: "error", error: err.message, code: err.code })
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
