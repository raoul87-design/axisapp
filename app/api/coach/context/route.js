import { supabaseAdmin } from "../../../../lib/supabase"

function getNLDate() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" })
}

function getMondayNL() {
  const now  = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Amsterdam" }))
  const diff = now.getDay() === 0 ? -6 : 1 - now.getDay()
  const mon  = new Date(now)
  mon.setDate(now.getDate() + diff)
  return mon.toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" })
}

const USER_SELECT = "id, auth_user_id, name, goal, goal_title, goal_deadline, streak, missed_days, kcal_doel, eiwitten_doel, koolhydraten_doel, vetten_doel, target_weight"

async function resolveUser(request) {
  const rawToken = request.headers.get("authorization")?.replace("Bearer ", "").trim()
  const token = rawToken && rawToken !== "null" && rawToken !== "undefined" ? rawToken : null

  // Lees publicUserId uit query string (GET request heeft geen body)
  const url = new URL(request.url)
  const publicUserId = url.searchParams.get("publicUserId") || null

  let profile = null

  if (token) {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    if (!error && user) {
      const { data } = await supabaseAdmin.from("users").select(USER_SELECT).eq("auth_user_id", user.id).single()
      profile = data || null
    }
  }

  if (!profile && publicUserId) {
    console.log("[context] publicUserId fallback:", publicUserId)
    const { data } = await supabaseAdmin.from("users").select(USER_SELECT).eq("id", publicUserId).maybeSingle()
    profile = data || null
    console.log("[context] publicUserId fallback profiel gevonden:", profile ? "ja" : "nee")
  }

  return profile
}

export async function GET(request) {
  try {
    const profile = await resolveUser(request)
    if (!profile) return Response.json({ error: "Niet geautoriseerd" }, { status: 401 })

    const today  = getNLDate()
    const monday = getMondayNL()
    const authUid = profile.auth_user_id
    const pubUid  = profile.id

    // Last 7 calendar days for week stats
    const weekAgoDate = new Date()
    weekAgoDate.setDate(weekAgoDate.getDate() - 6)
    const weekAgo = weekAgoDate.toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" })

    // Last 30 days for succesratio
    const monthAgoDate = new Date()
    monthAgoDate.setDate(monthAgoDate.getDate() - 29)
    const monthAgo = monthAgoDate.toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" })

    const [
      { data: commitments },
      { data: foodLogs },
      { data: weightMetrics },
      { data: kcalMetrics },
      { data: weekCommits },
      { data: monthCommits },
      { data: reflections },
      mealPlanResult,
      { data: workoutPlanning },
      { data: workoutsDezeWeek },
      { data: gewichtTrend },
      { data: actiefDezeWeek },
      { data: records },
    ] = await Promise.all([
      supabaseAdmin.from("commitments").select("id, text, done").eq("user_id", pubUid).eq("date", today),
      supabaseAdmin.from("food_logs").select("kcal, eiwitten, done").eq("user_id", pubUid).eq("date", today),
      supabaseAdmin.from("metrics").select("waarde, created_at").eq("user_id", pubUid).in("type", ["gewicht", "weight"]).order("created_at", { ascending: false }).limit(1),
      supabaseAdmin.from("metrics").select("waarde, created_at").eq("user_id", pubUid).in("type", ["voeding", "calorie", "kcal"]).order("created_at", { ascending: false }).limit(1),
      supabaseAdmin.from("commitments").select("date, done").eq("user_id", pubUid).gte("date", weekAgo).lte("date", today),
      supabaseAdmin.from("commitments").select("date, done").eq("user_id", pubUid).gte("date", monthAgo).lte("date", today),
      supabaseAdmin.from("reflections").select("completed, answer, created_at").eq("user_id", pubUid).order("created_at", { ascending: false }).limit(3),
      supabaseAdmin.from("meal_plans").select("plan").eq("user_id", pubUid).lte("week_start", today).order("week_start", { ascending: false }).limit(1).maybeSingle(),
      supabaseAdmin.from("workout_planning").select("workout:workout_id(naam)").eq("user_id", pubUid).eq("datum", today).maybeSingle(),
      supabaseAdmin.from("workout_planning").select("datum, gedaan, workout:workout_id(naam)").eq("user_id", pubUid).gte("datum", monday).order("datum", { ascending: true }),
      supabaseAdmin.from("metrics").select("waarde, created_at").eq("user_id", pubUid).in("type", ["gewicht", "weight"]).order("created_at", { ascending: false }).limit(7),
      supabaseAdmin.from("daily_results").select("date, score").eq("user_id", pubUid).gte("date", monday),
      supabaseAdmin.from("workout_sets").select("gewicht, reps, oefening:oefening_id(naam)").eq("user_id", pubUid).not("gewicht", "is", null).order("gewicht", { ascending: false }).limit(10),
    ])

    // Nutrition: prefer food_logs sum (all entries today), fallback to kcal metric
    const foodLogKcal  = (foodLogs || []).reduce((s, f) => s + (Number(f.kcal)      || 0), 0)
    const foodLogEiwit = (foodLogs || []).reduce((s, f) => s + (Number(f.eiwitten)  || 0), 0)
    const kcal_gegeten = foodLogKcal > 0
      ? Math.round(foodLogKcal)
      : (kcalMetrics?.[0] ? Number(kcalMetrics[0].waarde) : 0)
    const eiwit_gegeten = Math.round(foodLogEiwit)

    const gewicht_vandaag = weightMetrics?.[0] ? Number(weightMetrics[0].waarde) : null

    // Gewicht trend: stijgend / dalend / stabiel
    const gewichtLijst = (gewichtTrend || []).map(m => Number(m.waarde)).filter(v => !isNaN(v))
    let gewicht_trend_label = "onbekend"
    if (gewichtLijst.length >= 2) {
      const diff = gewichtLijst[0] - gewichtLijst[gewichtLijst.length - 1]
      if (diff > 0.3) gewicht_trend_label = "stijgend"
      else if (diff < -0.3) gewicht_trend_label = "dalend"
      else gewicht_trend_label = "stabiel"
    }
    const gewicht_trend_lijst = (gewichtTrend || []).map(m => `${m.created_at?.slice(0, 10)}: ${m.waarde} kg`).join(", ")

    // Actieve dagen deze week
    const actieve_dagen_week = (actiefDezeWeek || []).filter(d => Number(d.score) > 0).length

    // Records: deduplicate per oefening naam, keep highest gewicht
    const recordMap = {}
    for (const s of (records || [])) {
      const naam = s.oefening?.naam
      if (!naam) continue
      if (!recordMap[naam] || s.gewicht > recordMap[naam].gewicht) {
        recordMap[naam] = { naam, gewicht: s.gewicht, reps: s.reps }
      }
    }
    const top_records = Object.values(recordMap).slice(0, 5)

    console.log(`[context] gewicht: ${gewicht_vandaag ?? "niet gevonden"} kg | trend: ${gewicht_trend_label}`)
    console.log(`[context] food_logs vandaag: ${(foodLogs || []).length} rijen | kcal: ${kcal_gegeten} | eiwit: ${eiwit_gegeten}`)
    console.log(`[context] actief deze week: ${actieve_dagen_week} | workouts: ${(workoutsDezeWeek || []).length}`)
    console.log(`[context] system prompt context => gewicht_vandaag: ${gewicht_vandaag}, gewicht_doel: ${profile.target_weight ?? "—"}, kcal_gegeten: ${kcal_gegeten}/${profile.kcal_doel ?? "—"}, eiwit: ${eiwit_gegeten}/${profile.eiwitten_doel ?? "—"}`)

    // Week stats: a day is "active" if at least one commitment was done
    const weekDaysDone  = new Set((weekCommits  || []).filter(c => c.done).map(c => c.date))
    const weekDaysTotal = new Set((weekCommits  || []).map(c => c.date))
    const actieve_dagen = weekDaysDone.size
    const gemiste_dagen = weekDaysTotal.size - weekDaysDone.size
    const deze_week     = weekDaysTotal.size

    // Succesratio over last 30 days
    const monthDaysDone  = new Set((monthCommits || []).filter(c => c.done).map(c => c.date))
    const monthDaysTotal = new Set((monthCommits || []).map(c => c.date))
    const succesratio = monthDaysTotal.size > 0
      ? Math.round(monthDaysDone.size / monthDaysTotal.size * 100)
      : 0

    // Days to deadline
    let dagen_te_gaan = null
    if (profile.goal_deadline) {
      const deadline = new Date(profile.goal_deadline)
      const nowLocal = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Amsterdam" }))
      dagen_te_gaan = Math.max(0, Math.ceil((deadline - nowLocal) / 86400000))
    }

    // Workout
    const workout_gedaan = (commitments || []).some(
      c => c.done && /sport|gym|train|loop|fiets|yoga|zwem|wandel|krachttraining|hardloop/i.test(c.text)
    )
    const workout_naam = workoutPlanning?.workout?.naam ?? null

    // Weekmenu for today (NL day name)
    const DAYS_NL  = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"]
    const todayKey = DAYS_NL[new Date().getDay()]
    const plan     = mealPlanResult?.data
    const todayMenu = plan?.plan?.[todayKey] ?? null
    const weekmenu_vandaag = todayMenu ? {
      ontbijt: todayMenu.ontbijt?.[0]?.naam ?? null,
      lunch:   todayMenu.lunch?.[0]?.naam   ?? null,
      diner:   todayMenu.diner?.[0]?.naam   ?? null,
    } : null

    return Response.json({
      profiel: {
        naam:          profile.name?.split(" ")[0] || null,
        doel:          profile.goal_title || profile.goal,
        deadline:      profile.goal_deadline,
        dagen_te_gaan,
        streak:        profile.streak     ?? 0,
        succesratio,
      },
      vandaag: {
        commitments:    (commitments || []).map(c => ({ tekst: c.text, done: c.done })),
        kcal_gegeten,
        kcal_doel:      profile.kcal_doel,
        eiwit_gegeten,
        eiwit_doel:     profile.eiwitten_doel,
        gewicht_vandaag,
        gewicht_doel:   profile.target_weight,
        workout_gedaan,
        workout_naam,
      },
      week: { actieve_dagen, gemiste_dagen, deze_week },
      recente_reflecties: (reflections || []).map(r => ({ completed: r.completed, answer: r.answer })),
      weekmenu_vandaag,
      workouts_deze_week: (workoutsDezeWeek || []).map(w => ({ datum: w.datum, gedaan: w.gedaan, naam: w.workout?.naam ?? null })),
      gewicht_trend: { label: gewicht_trend_label, metingen: gewicht_trend_lijst },
      actieve_dagen_week,
      top_records,
    })
  } catch (err) {
    console.error("[coach/context] error:", err.message)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
