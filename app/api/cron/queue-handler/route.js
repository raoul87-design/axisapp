/**
 * Staggered cron handler — processes a subset of users per call.
 *
 * Usage:
 *   GET /api/cron/queue-handler?batch=morning&offset=0&total=5
 *   GET /api/cron/queue-handler?batch=evening&offset=0&total=5
 *   GET /api/cron/queue-handler?batch=midnight&offset=0&total=5
 *
 * cron.org setup (example for morning, 5 batches over 5 minutes):
 *   08:00  →  ?batch=morning&offset=0&total=5
 *   08:01  →  ?batch=morning&offset=1&total=5
 *   08:02  →  ?batch=morning&offset=2&total=5
 *   08:03  →  ?batch=morning&offset=3&total=5
 *   08:04  →  ?batch=morning&offset=4&total=5
 *
 * Offset logic: users.filter((_, i) => i % total === offset)
 * → Stateless, no DB queue table needed, scales by increasing `total`.
 */

import twilio from "twilio"
import { supabaseAdmin as supabase } from "../../../../lib/supabase"

const WA_FROM = () => `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`

function getTwilio() {
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
}

function getNLDate(daysAgo = 0) {
  const todayNL = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" })
  if (daysAgo === 0) return todayNL
  const d = new Date(todayNL + "T12:00:00")
  d.setDate(d.getDate() - daysAgo)
  return d.toLocaleDateString("en-CA")
}

function firstName(name) {
  if (!name?.trim()) return null
  return name.trim().split(/\s+/)[0]
}

// ── Morning ───────────────────────────────────────────────────────────────────

function buildMorningMessage(name, kcalDoel, eiwittenDoel, workout) {
  const fn = firstName(name)
  const lines = [`${fn ? `Goedemorgen ${fn}! 🌅` : "Goedemorgen! 🌅"} Stuur je check-in voor vandaag.`]
  if (kcalDoel) {
    lines.push("", "Jouw doelen vandaag:", `- Kcal: ${kcalDoel}`)
    if (eiwittenDoel) lines.push(`- Eiwitten: ${eiwittenDoel}g`)
  }
  if (workout?.naam) {
    lines.push("", `💪 Workout vandaag: ${workout.naam}`)
    const exercises = (workout.workout_oefeningen ?? []).sort((a, b) => (a.volgorde || 0) - (b.volgorde || 0))
    for (const wo of exercises) {
      if (wo.oefening) lines.push(`- ${wo.oefening.naam}: ${wo.sets}×${wo.reps}`)
    }
  }
  lines.push("", "Commitment, gewicht en voeding zijn optioneel — stuur wat voor jou werkt.")
  return lines.join("\n")
}

async function processMorning(users, today, client) {
  // One query: workout planning for all users in this batch
  const authIds = users.map(u => u.auth_user_id).filter(Boolean)
  const planByUid = {}
  if (authIds.length) {
    const { data: planRows } = await supabase
      .from("workout_planning")
      .select("user_id, workout:workout_id ( naam, workout_oefeningen ( sets, reps, volgorde, oefening:oefening_id ( naam, youtube_url ) ) )")
      .in("user_id", authIds)
      .eq("datum", today)
    for (const row of planRows ?? []) planByUid[row.user_id] = row.workout
  }

  // Create workout commitments for users in this batch
  for (const user of users) {
    const workout = planByUid[user.auth_user_id]
    if (!workout?.naam) continue
    const tekst = `💪 ${workout.naam}`
    const { data: dup } = await supabase
      .from("commitments").select("id")
      .eq("user_id", user.auth_user_id).eq("date", today).eq("text", tekst).maybeSingle()
    if (!dup) {
      await supabase.from("commitments").insert({
        user_id: user.auth_user_id, date: today, text: tekst, category: "beweging", done: false,
      })
    }
  }

  // Send WhatsApp + insert check_in record
  const results = []
  for (const user of users) {
    try {
      const msg = await client.messages.create({
        from: WA_FROM(),
        to: user.whatsapp_number,
        body: buildMorningMessage(user.name, user.kcal_doel, user.eiwitten_doel, planByUid[user.auth_user_id]),
      })
      await supabase.from("check_ins").insert({ user_id: user.id, sent_at: today, type: "morning" })
      results.push({ whatsapp: user.whatsapp_number, status: "ok", sid: msg.sid })
    } catch (err) {
      console.error(`[morning] ${user.whatsapp_number}:`, err.message)
      results.push({ whatsapp: user.whatsapp_number, status: "error", error: err.message })
    }
  }
  return results
}

// ── Evening ───────────────────────────────────────────────────────────────────

async function processEvening(users, today, client) {
  // One query for all commitment counts — avoids N separate COUNT queries
  const authIds = users.map(u => u.auth_user_id).filter(Boolean)
  const withCommitments = new Set()
  if (authIds.length) {
    const { data: commitRows } = await supabase
      .from("commitments").select("user_id")
      .in("user_id", authIds).eq("date", today)
    for (const row of commitRows ?? []) withCommitments.add(row.user_id)
  }

  const now = new Date().toISOString()
  const results = []
  for (const user of users) {
    try {
      const hasCommitments = withCommitments.has(user.auth_user_id)
      const fn = firstName(user.name)
      const body = hasCommitments
        ? `${fn ? `Hey ${fn}, hoe ging je dag?` : "Hey, hoe ging je dag?"} 💪 Heb je je commitments gehaald?\n\nAntwoord met *Ja* of *Nee*.`
        : `${fn ? `Hey ${fn}` : "Hey"} 💪 Je hebt vandaag nog geen commitment gestuurd. Wat heb je vandaag gedaan? Stuur het even door — elke dag telt.`

      const msg = await client.messages.create({ from: WA_FROM(), to: user.whatsapp_number, body })
      await supabase.from("users").update({ awaiting_reflection: true }).eq("id", user.id)
      await supabase.from("check_ins").insert({ user_id: user.id, sent_at: now, type: "evening" })
      results.push({ whatsapp: user.whatsapp_number, status: "ok", hasCommitments, sid: msg.sid })
    } catch (err) {
      console.error(`[evening] ${user.whatsapp_number}:`, err.message)
      results.push({ whatsapp: user.whatsapp_number, status: "error", error: err.message })
    }
  }
  return results
}

// ── Midnight ──────────────────────────────────────────────────────────────────

async function processMidnight(users, client) {
  const results = []
  for (const user of users) {
    const newMissedDays = (user.missed_days ?? 0) + 1
    await supabase.from("users")
      .update({ streak: 0, missed_days: newMissedDays, awaiting_reflection: false })
      .eq("id", user.id)

    if (user.whatsapp_number) {
      try {
        const fn = firstName(user.name)
        const body = `${fn ? `Hey ${fn}` : "Hey"}, geen check-out gisteren — streak gereset. Vandaag opnieuw beginnen. Kleine stappen tellen.`
        const msg = await client.messages.create({ from: WA_FROM(), to: user.whatsapp_number, body })
        results.push({ whatsapp: user.whatsapp_number, status: "ok", sid: msg.sid })
      } catch (err) {
        console.error(`[midnight] ${user.whatsapp_number}:`, err.message)
        results.push({ whatsapp: user.whatsapp_number, status: "error", error: err.message })
      }
    }
  }
  return results
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function GET(request) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = request.headers.get("x-cron-secret")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && cronSecret !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const batch  = searchParams.get("batch")   // morning | evening | midnight
  const offset = parseInt(searchParams.get("offset") ?? "0")
  const total  = parseInt(searchParams.get("total")  ?? "1")

  if (!["morning", "evening", "midnight"].includes(batch)) {
    return new Response(JSON.stringify({ error: "batch must be morning | evening | midnight" }), { status: 400 })
  }

  console.log(`=== [QUEUE-HANDLER] batch=${batch} offset=${offset} total=${total} ===`)

  const today = getNLDate()
  const client = getTwilio()

  try {
    let allUsers, batchUsers, results

    if (batch === "midnight") {
      // Midnight only cares about users who haven't responded
      const { data, error } = await supabase
        .from("users")
        .select("id, streak, missed_days, awaiting_reflection, whatsapp_number, name")
        .eq("awaiting_reflection", true)
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
      allUsers  = data ?? []
      batchUsers = total > 1 ? allUsers.filter((_, i) => i % total === offset) : allUsers
      results   = await processMidnight(batchUsers, client)
    } else {
      const { data, error } = await supabase
        .from("users")
        .select("id, auth_user_id, whatsapp_number, name, kcal_doel, eiwitten_doel, fitness_level")
        .not("whatsapp_number", "is", null)
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
      allUsers   = data ?? []
      batchUsers = total > 1 ? allUsers.filter((_, i) => i % total === offset) : allUsers

      results = batch === "morning"
        ? await processMorning(batchUsers, today, client)
        : await processEvening(batchUsers, today, client)
    }

    console.log(`=== [QUEUE-HANDLER] KLAAR — ${results.length}/${allUsers.length} users verwerkt ===`)
    return new Response(
      JSON.stringify({ batch, offset, total, processed: results.length, total_users: allUsers.length, results }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (err) {
    console.error("[QUEUE-HANDLER] error:", err.message)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
