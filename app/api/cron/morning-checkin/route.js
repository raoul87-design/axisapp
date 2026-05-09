import twilio from "twilio"
import { supabaseAdmin as supabase } from "../../../../lib/supabase"

function firstName(name) {
  if (!name || !name.trim()) return null
  return name.trim().split(/\s+/)[0]
}

function getNLDate(daysAgo = 0) {
  const d = new Date()
  if (daysAgo) d.setDate(d.getDate() - daysAgo)
  return d.toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" })
}

function morningMessage(name, kcalDoel, eiwittenDoel, workoutNaam, workoutOefeningen, fitnessLevel) {
  const fn = firstName(name)
  const greeting = fn ? `Goedemorgen ${fn}! 🌅` : `Goedemorgen! 🌅`

  const lines = []

  if (kcalDoel) {
    lines.push(`Jouw doelen vandaag:`)
    lines.push(`- Kcal: ${kcalDoel}`)
    if (eiwittenDoel) lines.push(`- Eiwitten: ${eiwittenDoel}g`)
  }

  if (workoutNaam) {
    lines.push(``)
    lines.push(`💪 Workout vandaag: ${workoutNaam}`)
    if (workoutOefeningen?.length) {
      const isBeginner = !fitnessLevel || fitnessLevel.toLowerCase() === "beginner"
      for (const wo of workoutOefeningen) {
        const oe = wo.oefening
        if (!oe) continue
        let line = `- ${oe.naam}: ${wo.sets}×${wo.reps}`
        if (isBeginner && oe.youtube_url) line += ` → ${oe.youtube_url}`
        lines.push(line)
      }
    }
  }

  lines.push(``)
  lines.push(`Commitment, gewicht en voeding zijn optioneel — stuur wat voor jou werkt.`)

  return `${greeting} Stuur je check-in voor vandaag.\n\n${lines.join("\n")}`
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
    const today = getNLDate()

    const { data: users, error } = await supabase
      .from("users")
      .select("id, auth_user_id, whatsapp_number, name, kcal_doel, eiwitten_doel, fitness_level")
      .not("whatsapp_number", "is", null)

    // Haal workout planning op voor vandaag (één query voor alle users)
    const authIds = (users || []).map(u => u.auth_user_id).filter(Boolean)
    const planningByUid = {}
    if (authIds.length) {
      const { data: planRows } = await supabase
        .from("workout_planning")
        .select(`user_id, workout:workout_id ( naam, workout_oefeningen ( sets, reps, volgorde, oefening:oefening_id ( naam, youtube_url ) ) )`)
        .in("user_id", authIds)
        .eq("datum", today)
      for (const row of planRows || []) {
        planningByUid[row.user_id] = row.workout
      }
    }

    if (error) {
      console.error("Fout bij ophalen users:", error.message)
      return new Response("DB error", { status: 500 })
    }

    // Commitments aanmaken voor ALLE users met workout gepland voor vandaag
    const { data: allPlanRows } = await supabase
      .from("workout_planning")
      .select("user_id, workout:workout_id ( naam )")
      .eq("datum", today)

    const commitsMade = []
    for (const row of allPlanRows || []) {
      const workoutNaam = row.workout?.naam
      if (!workoutNaam) continue
      const tekst = `💪 ${workoutNaam}`
      const { data: dup } = await supabase
        .from("commitments").select("id")
        .eq("user_id", row.user_id).eq("date", today).eq("text", tekst).maybeSingle()
      if (!dup) {
        await supabase.from("commitments").insert({
          user_id: row.user_id, date: today, text: tekst, category: "beweging", done: false,
        })
        commitsMade.push(row.user_id)
      }
    }
    console.log(`[MORNING CRON] ${commitsMade.length}/${(allPlanRows || []).length} commitments aangemaakt`)

    console.log(`${users.length} users gevonden:`, users.map(u => u.whatsapp_number))

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    const results = []

    for (const user of users) {
      const workout = user.auth_user_id ? planningByUid[user.auth_user_id] : null
      const exercises = workout?.workout_oefeningen
        ? [...workout.workout_oefeningen].sort((a, b) => (a.volgorde || 0) - (b.volgorde || 0))
        : null
      const from = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`

      // Deduplication: skip if morning message already sent today
      const { data: alreadySent } = await supabase
        .from("check_ins").select("id")
        .eq("user_id", user.id).eq("type", "morning").eq("sent_at", today)
        .maybeSingle()
      if (alreadySent) {
        console.log(`[${user.whatsapp_number}] Al verstuurd vandaag — overgeslagen`)
        results.push({ whatsapp: user.whatsapp_number, status: "skipped" })
        continue
      }

      console.log(`[${user.whatsapp_number}] Sturen van ${from}...`)
      try {
        const message = await client.messages.create({
          from,
          to: user.whatsapp_number,
          body: morningMessage(user.name, user.kcal_doel, user.eiwitten_doel, workout?.naam, exercises, user.fitness_level),
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
