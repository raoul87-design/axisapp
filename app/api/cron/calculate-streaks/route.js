import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  "https://zdqrrprjkddlxszmtcmx.supabase.co",
  process.env.SUPABASE_SERVICE_KEY || "sb_publishable__cdXODEiCbsHvycy6uuB_g_SIIgI6YH"
)

function getNLDate(daysAgo = 0) {
  // Get NL "today" as a string first, then subtract — avoids UTC/NL date mismatch
  // (e.g. 00:30 NL = 22:30 UTC previous day, so UTC date arithmetic gives wrong answer)
  const todayNL = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" })
  if (daysAgo === 0) return todayNL
  const d = new Date(todayNL + "T12:00:00")  // noon on NL today — safe across DST
  d.setDate(d.getDate() - daysAgo)
  return d.toLocaleDateString("en-CA")
}

// Pure: compute streak from rows sorted newest-first, already deduplicated per date.
// A day counts only when its highest score >= 100 (fully completed).
function computeStreak(rows) {
  if (!rows || rows.length === 0) return 0
  if (Number(rows[0].score) < 100) return 0
  let count = 0
  for (let i = 0; i < rows.length; i++) {
    if (Number(rows[i].score) >= 100) {
      if (i > 0) {
        const prevDate = new Date(rows[i - 1].date + "T12:00:00")
        prevDate.setDate(prevDate.getDate() - 1)
        if (prevDate.toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" }) !== rows[i].date) break
      }
      count++
    } else {
      break
    }
  }
  return count
}

export async function GET(request) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = request.headers.get("x-cron-secret")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && cronSecret !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 })
  }

  console.log("=== [CALCULATE-STREAKS] START ===")

  const cutoff = getNLDate(90)
  const today  = getNLDate(0)

  // Read 1: all users with an auth account
  const { data: users, error: uErr } = await supabase
    .from("users")
    .select("id, auth_user_id, streak")
    .not("auth_user_id", "is", null)

  if (uErr) {
    console.error("Users fetch error:", uErr.message)
    return new Response(JSON.stringify({ error: uErr.message }), { status: 500 })
  }

  // Read 2: daily_results strictly BEFORE today — lt() is safer than lte(yesterday)
  // because it never depends on correct yesterday arithmetic
  const { data: allResults, error: rErr } = await supabase
    .from("daily_results")
    .select("user_id, date, score")
    .gte("date", cutoff)
    .lt("date", today)
    .order("date", { ascending: false })

  if (rErr) {
    console.error("daily_results fetch error:", rErr.message)
    return new Response(JSON.stringify({ error: rErr.message }), { status: 500 })
  }

  // Group by auth user_id; per day keep the highest score (handles multiple rows per day)
  const byUser = {}
  for (const row of allResults || []) {
    const day = row.date.split("T")[0]
    if (!byUser[row.user_id]) byUser[row.user_id] = {}
    const prev = byUser[row.user_id][day]
    if (prev === undefined || Number(row.score) > Number(prev)) {
      byUser[row.user_id][day] = row.score
    }
  }

  // Compute new streak per user and collect only those that changed
  const toUpdate = []
  for (const user of users) {
    const dayMap  = byUser[user.auth_user_id] || {}
    const sorted  = Object.entries(dayMap)
      .map(([date, score]) => ({ date, score: Number(score) }))
      .sort((a, b) => (a.date < b.date ? 1 : -1))     // newest first
    const newStreak = computeStreak(sorted)
    if (newStreak !== (user.streak ?? 0)) {
      toUpdate.push({ id: user.id, streak: newStreak })
    }
  }

  // Write only changed rows
  let updated = 0
  for (const { id, streak } of toUpdate) {
    const { error } = await supabase.from("users").update({ streak }).eq("id", id)
    if (error) {
      console.error(`Update failed for user ${id}:`, error.message)
    } else {
      updated++
    }
  }

  console.log(`=== [CALCULATE-STREAKS] KLAAR — ${updated}/${users.length} bijgewerkt ===`)
  return new Response(
    JSON.stringify({ success: true, updated, total: users.length }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  )
}
