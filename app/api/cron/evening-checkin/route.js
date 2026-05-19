import twilio from "twilio"
import { supabaseAdmin as supabase } from "../../../../lib/supabase"

function getNLDate() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" })
}

function firstName(name) {
  if (!name || !name.trim()) return null
  return name.trim().split(/\s+/)[0]
}

function messageWithCommitments(name) {
  const fn = firstName(name)
  const greeting = fn ? `Hey ${fn}, hoe ging je dag?` : `Hey, hoe ging je dag?`
  return `${greeting} 💪 Heb je je commitments gehaald?\n\nAntwoord met *Ja* of *Nee*.`
}

function messageAllSkipped(name) {
  const fn = firstName(name)
  const greeting = fn ? `Hey ${fn}` : `Hey`
  return `${greeting} 💛 Je hebt vandaag bewust een stap teruggedaan. Hoe ging het vandaag ondanks de omstandigheden?\n\nAntwoord met *Ja* of *Nee*.`
}

function messageWithoutCommitments(name) {
  const fn = firstName(name)
  const greeting = fn ? `Hey ${fn}` : `Hey`
  return `${greeting} 💪 Je hebt vandaag nog geen commitment gestuurd. Wat heb je vandaag gedaan? Stuur het even door — elke dag telt.`
}

export async function GET(request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 })
  }

  console.log("=== [EVENING CRON] START ===")

  const today = getNLDate()
  console.log("Datum (NL):", today)

  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("id, auth_user_id, whatsapp_number, name")
      .not("whatsapp_number", "is", null)

    if (error) {
      console.error("Fout bij ophalen users:", error.message)
      return new Response("DB error", { status: 500 })
    }

    console.log(`${users.length} users gevonden`)

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    const now = new Date().toISOString()
    const results = []

    for (const user of users) {
      try {
        // Check of user vandaag commitments heeft
        let hasCommitments = false
        let allSkipped = false
        if (user.auth_user_id) {
          const { data: todayCommits } = await supabase
            .from("commitments")
            .select("id, is_skipped")
            .eq("user_id", user.auth_user_id)
            .eq("date", today)
          hasCommitments = (todayCommits?.length ?? 0) > 0
          allSkipped = hasCommitments && todayCommits.every(c => c.is_skipped)
        }

        console.log(`[${user.whatsapp_number}] Commitments vandaag: ${hasCommitments}, allSkipped: ${allSkipped}`)

        const body = !hasCommitments
          ? messageWithoutCommitments(user.name)
          : allSkipped
            ? messageAllSkipped(user.name)
            : messageWithCommitments(user.name)

        const message = await client.messages.create({
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
          to: user.whatsapp_number,
          body,
        })

        console.log(`[${user.whatsapp_number}] Verstuurd — SID: ${message.sid}`)

        await supabase
          .from("users")
          .update({ awaiting_reflection: true })
          .eq("id", user.id)

        await supabase.from("check_ins").insert({
          user_id: user.id,
          sent_at: now,
          type: "evening",
        })

        results.push({ whatsapp: user.whatsapp_number, status: "ok", hasCommitments })
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
