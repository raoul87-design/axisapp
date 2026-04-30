"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts"

const GREEN = "#22c55e"
const TAB_H = 56

export default function Home() {

const [user,            setUser]           = useState(null)
const [text,            setText]           = useState("")
const [commitments,     setCommitments]    = useState([])
const [history,         setHistory]        = useState([])
const [progress,        setProgress]       = useState(0)
const [streak,          setStreak]         = useState(0)
const [missedDays,      setMissedDays]     = useState(0)
const [showOnboarding,  setShowOnboarding] = useState(false)
const [onboardingStep,  setOnboardingStep] = useState(1)
const [interactionMode, setInteractionMode] = useState("")
const [completed,       setCompleted]      = useState(null)
const [answer,          setAnswer]         = useState("")
const [showAll,         setShowAll]        = useState(false)
const [whatsappInput,   setWhatsappInput]  = useState("")
const [whatsappLinked,  setWhatsappLinked] = useState(false)
const [showSettings,    setShowSettings]   = useState(false)
const [weekCheckIns,    setWeekCheckIns]   = useState(new Set())
const [weekCommits,     setWeekCommits]    = useState(new Set())
const [theme,           setTheme]          = useState("dark")
const [activeTab,       setActiveTab]      = useState("vandaag")
const [selectedGoal,    setSelectedGoal]   = useState("")
const [onboardingName,  setOnboardingName]  = useState("")
const [currentWeightInput, setCurrentWeightInput] = useState("")
const [targetWeightInput,  setTargetWeightInput]  = useState("")
const [trainingLocation,   setTrainingLocation]   = useState("")
const [sportFrequentie,    setSportFrequentie]    = useState(0)
const [fitnessLevel,       setFitnessLevel]       = useState("")
const [chatMessages,    setChatMessages]   = useState([])
const [chatInput,       setChatInput]      = useState("")
const [chatLoading,     setChatLoading]    = useState(false)

const [publicUserId,    setPublicUserId]    = useState(null)
const [reminders,       setReminders]       = useState([])
const [showAddReminder, setShowAddReminder] = useState(false)
const [reminderForm,    setReminderForm]    = useState({ tekst: "", tijd: "", eenmalig: false, datum: "" })
const [savingReminder,  setSavingReminder]  = useState(false)

const [showNutritionModal, setShowNutritionModal] = useState(false)
const [kcalDoel,           setKcalDoel]           = useState("")
const [eiwittenDoel,       setEiwittenDoel]        = useState("")
const [koolhydratenDoel,   setKoolhydratenDoel]    = useState("")
const [vettenDoel,         setVettenDoel]          = useState("")
const [doelenDoorCoach,    setDoelenDoorCoach]     = useState(false)
const [savingGoals,        setSavingGoals]         = useState(false)

// ── Voortgang state ───────────────────────────────────────────
const [metricsWeight,    setMetricsWeight]    = useState([])
const [metricsKcal,      setMetricsKcal]      = useState([])
const [progressHistory,  setProgressHistory]  = useState([])
const [longestStreak,    setLongestStreak]    = useState(0)
const [totalActiveDays,  setTotalActiveDays]  = useState(0)
const [weightPeriod,     setWeightPeriod]     = useState("30d")
const [kcalPeriod,       setKcalPeriod]       = useState("7d")
const [doelGewicht,      setDoelGewicht]      = useState(null)

// ── Workout state ─────────────────────────────────────────────
const [workoutScreen,    setWorkoutScreen]    = useState("overview")
const [todayWorkout,     setTodayWorkout]     = useState(null)
const [weekWorkouts,     setWeekWorkouts]     = useState([])
const [setLogs,          setSetLogs]          = useState({})
const [prevWeights,      setPrevWeights]      = useState({})
const [workoutLoading,   setWorkoutLoading]   = useState(false)
const [workoutLibrary,   setWorkoutLibrary]   = useState([])
const [pickerSelected,   setPickerSelected]   = useState(null)
const [openSections,     setOpenSections]     = useState({})

const chatBottomRef = useRef(null)
const router = useRouter()
const FORCE_ONBOARDING = false

// ── Kleurenpalet ──────────────────────────────────────────────
const C = theme === "dark" ? {
  bg:          "#0f0f0f",
  card:        "#1a1a1a",
  cardAlt:     "#111",
  border:      "#2a2a2a",
  borderSub:   "#1e1e1e",
  text:        "#ffffff",
  textSub:     "#cccccc",
  textMuted:   "#888888",
  textDim:     "#666666",
  inputBg:     "#1a1a1a",
  inputBorder: "#333",
} : {
  bg:          "#f8f9f8",
  card:        "#fff",
  cardAlt:     "#f0f2f0",
  border:      "#e8e8e8",
  borderSub:   "#ebebeb",
  text:        "#111111",
  textSub:     "#555",
  textMuted:   "#777",
  textDim:     "#999",
  inputBg:     "#fff",
  inputBorder: "#ddd",
}

// ── Theme ─────────────────────────────────────────────────────
useEffect(() => {
  const saved = localStorage.getItem("axis-theme")
  if (saved) setTheme(saved)
}, [])

function toggleTheme(val) {
  setTheme(val)
  localStorage.setItem("axis-theme", val)
}

// ── Helpers ───────────────────────────────────────────────────
function getNLDate() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" })
}
function getMondayNL() {
  const today = new Date(getNLDate())
  const day = today.getDay()
  const offset = day === 0 ? -6 : 1 - day
  today.setDate(today.getDate() + offset)
  return today.toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" })
}
function fmtShortDate(d) {
  if (!d) return ""
  const p = d.split("-")
  return p.length === 3 ? `${p[2]}/${p[1]}` : d
}
function fmtTime(tijd) {
  if (!tijd) return ""
  return tijd.slice(0, 5)
}
function fmtReminderDate(datum) {
  if (!datum) return ""
  const d = new Date(datum + "T12:00:00")
  const dag = ["Zondag","Maandag","Dinsdag","Woensdag","Donderdag","Vrijdag","Zaterdag"][d.getDay()]
  const maand = ["jan","feb","mrt","apr","mei","jun","jul","aug","sep","okt","nov","dec"][d.getMonth()]
  return `${dag} ${d.getDate()} ${maand}`
}
function parseMetricValue(raw) {
  if (!raw) return null
  const match = raw.match(/(\d+(?:[.,]\d+)?)/)
  return match ? parseFloat(match[1].replace(",", ".")) : null
}

const GOALS = ["Afvallen", "Aankomen", "Spiermassa", "Fitter worden"]

const GOAL_SUGGESTIONS = {
  "Afvallen":      ["30 min wandelen of fietsen", "Onder 1800 kcal blijven vandaag", "1,5 liter water drinken"],
  "Aankomen":      ["45 min krachttraining", "Minstens 150g eiwit eten vandaag", "Extra maaltijd voor het slapengaan"],
  "Spiermassa":    ["1 uur gym — compound oefeningen", "160g eiwit halen vandaag", "8 uur slapen"],
  "Fitter worden": ["20 min bewegen — wandelen telt ook", "Geen snacks na 20:00", "Vroeg naar bed — voor 23:00"],
}

const CATEGORY_ICON = { beweging: "🏃", voeding: "🥗" }

function classifyCommitment(text) {
  const t = (text || "").toLowerCase()
  if (/sport|loop|lopen|fiets|gym|zwem|wandel|yoga|train|hardloop|stap|krachttraining|padel|voetbal|basket|tennis|dans|rennen|beweging|fitness/.test(t)) return "beweging"
  if (/eet|kcal|calorie|voeding|kook|groente|proteïne|eiwit|water|drinken|maaltijd|ontbijt|lunch|dieet|macro/.test(t)) return "voeding"
  return "overig"
}

function renderMarkdown(text) {
  if (!text) return ""
  const escaped = text.replace(/</g, "&lt;").replace(/>/g, "&gt;")
  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
}

// ── Reflectie opslaan ─────────────────────────────────────────
const handleSubmit = async () => {
  if (!answer) { alert("Please add a reflection"); return }
  const { error } = await supabase.from("reflections").insert([{ user_id: user.id, completed, answer }])
  if (error) alert("Error saving")
  else { setAnswer(""); setCompleted(null) }
}

// ── Auth ──────────────────────────────────────────────────────
useEffect(() => {
  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const currentUser = session?.user ?? null
    setUser(currentUser)
    if (!currentUser) router.replace("/login")
  }
  init()
  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    const currentUser = session?.user ?? null
    setUser(currentUser)
    if (!currentUser) router.replace("/login")
  })
  return () => { listener.subscription.unsubscribe() }
}, [])

// ── Data laden ────────────────────────────────────────────────
useEffect(() => {
  if (!user) return
  const init = async () => {
    await checkFirstUse()
    await loadCommitments()
    await loadHistory()
    await loadWeekData()
    await loadProgressData()
    await loadWorkoutData()
  }
  init()
}, [user])

useEffect(() => {
  if (activeTab === "workout" && user) loadWorkoutData()
}, [activeTab])

async function loadCommitments() {
  const today = getNLDate()
  const { data } = await supabase
    .from("commitments").select("*")
    .eq("user_id", user.id).eq("date", today)
    .order("created_at", { ascending: false })
  if (data) { setCommitments(data); calculateProgress(data) }
}

async function checkFirstUse() {
  console.log("[checkFirstUse] auth user.id:", user.id)
  const { data } = await supabase.from("users").select("goal, training_location, fitness_level, sport_frequentie, kcal_doel, eiwitten_doel, koolhydraten_doel, vetten_doel, doelen_door_coach, target_weight").eq("auth_user_id", user.id).maybeSingle()
  console.log("[checkFirstUse] goal:", data?.goal ?? "NULL", "| data:", data)
  if (data?.training_location) setTrainingLocation(data.training_location)
  if (data?.fitness_level)     setFitnessLevel(data.fitness_level)
  if (data?.sport_frequentie)  setSportFrequentie(data.sport_frequentie)
  if (data?.kcal_doel)         setKcalDoel(String(data.kcal_doel))
  if (data?.eiwitten_doel)     setEiwittenDoel(String(data.eiwitten_doel))
  if (data?.koolhydraten_doel) setKoolhydratenDoel(String(data.koolhydraten_doel))
  if (data?.vetten_doel)       setVettenDoel(String(data.vetten_doel))
  if (data?.doelen_door_coach) setDoelenDoorCoach(!!data.doelen_door_coach)
  if (data?.target_weight)     setDoelGewicht(data.target_weight)
  if (FORCE_ONBOARDING || !data || !data.goal) setShowOnboarding(true)
}

async function saveNutritionGoals() {
  if (!kcalDoel || savingGoals) return
  setSavingGoals(true)
  await supabase.from("users").update({
    kcal_doel:          parseInt(kcalDoel) || null,
    eiwitten_doel:      eiwittenDoel      ? parseInt(eiwittenDoel)      : null,
    koolhydraten_doel:  koolhydratenDoel  ? parseInt(koolhydratenDoel)  : null,
    vetten_doel:        vettenDoel        ? parseInt(vettenDoel)        : null,
  }).eq("auth_user_id", user.id)
  setSavingGoals(false)
  setShowNutritionModal(false)
}

async function saveGoalData(goal, cw, tw) {
  console.log("[saveGoalData] auth user.id:", user.id, "| goal:", goal)
  const { data: existing } = await supabase.from("users").select("id").eq("auth_user_id", user.id).maybeSingle()
  console.log("[saveGoalData] existing row:", existing)
  const payload = { goal, current_weight: cw ? parseFloat(cw) : null, target_weight: tw ? parseFloat(tw) : null }
  if (existing) {
    const { error } = await supabase.from("users").update(payload).eq("auth_user_id", user.id)
    console.log("[saveGoalData] update error:", error)
  } else {
    const { error } = await supabase.from("users").insert({ ...payload, auth_user_id: user.id })
    console.log("[saveGoalData] insert error:", error)
  }
}

async function loadReminders(pid) {
  const { data } = await supabase
    .from("reminders")
    .select("id, tekst, tijd, actief, eenmalig, datum")
    .eq("user_id", pid)
    .order("tijd", { ascending: true })
  setReminders(data || [])
}

async function toggleReminder(id, current) {
  await supabase.from("reminders").update({ actief: !current }).eq("id", id)
  setReminders(prev => prev.map(r => r.id === id ? { ...r, actief: !r.actief } : r))
}

async function deleteReminder(id) {
  await supabase.from("reminders").delete().eq("id", id)
  setReminders(prev => prev.filter(r => r.id !== id))
}

async function addReminder() {
  const formOk = reminderForm.tekst.trim() && reminderForm.tijd && (!reminderForm.eenmalig || reminderForm.datum)
  if (!formOk || !publicUserId || savingReminder) return
  setSavingReminder(true)
  await supabase.from("reminders").insert({
    user_id: publicUserId,
    tekst: reminderForm.tekst.trim(),
    tijd: reminderForm.tijd,
    actief: true,
    eenmalig: reminderForm.eenmalig,
    datum: reminderForm.eenmalig ? reminderForm.datum : null,
  })
  await loadReminders(publicUserId)
  setShowAddReminder(false)
  setReminderForm({ tekst: "", tijd: "", eenmalig: false, datum: "" })
  setSavingReminder(false)
}

async function loadHistory() {
  const { data } = await supabase
    .from("daily_results").select("date,score")
    .eq("user_id", user.id).order("date", { ascending: false })
  if (!data) return
  const uniqueDays = Object.values(
    data.reduce((acc, item) => {
      const day = item.date.split("T")[0]
      acc[day] = { ...item, date: day }
      return acc
    }, {})
  )
  const sortedDays = uniqueDays.sort((a, b) => new Date(b.date) - new Date(a.date))
  setHistory(sortedDays.slice(0, 7))
  calculateStreak(sortedDays)
}

async function loadWeekData() {
  const monday = getMondayNL()
  const today  = getNLDate()
  const { data: userData } = await supabase
    .from("users").select("id, missed_days").eq("auth_user_id", user.id).single()
  if (userData?.missed_days != null) setMissedDays(userData.missed_days)
  const pid = userData?.id
  setPublicUserId(pid)
  if (pid) loadReminders(pid)
  const publicUserId = pid
  const [{ data: checkIns }, { data: commits }] = await Promise.all([
    publicUserId
      ? supabase.from("check_ins").select("sent_at")
          .eq("user_id", publicUserId).eq("type", "evening")
          .gte("sent_at", `${monday}T00:00:00`)
      : Promise.resolve({ data: [] }),
    supabase.from("commitments").select("date")
      .eq("user_id", user.id).gte("date", monday).lte("date", today),
  ])
  setWeekCheckIns(new Set((checkIns || []).map(c => c.sent_at.split("T")[0])))
  setWeekCommits(new Set((commits || []).map(c => c.date)))
}

async function loadProgressData() {
  const [
    { data: weightData },
    { data: kcalData },
    { data: allDaily },
  ] = await Promise.all([
    supabase.from("metrics").select("waarde, datum")
      .eq("user_id", user.id).eq("type", "gewicht")
      .order("datum", { ascending: true }).limit(200),
    supabase.from("metrics").select("waarde, datum")
      .eq("user_id", user.id).in("type", ["voeding", "calorie", "kcal"])
      .order("datum", { ascending: true }).limit(200),
    supabase.from("daily_results").select("date, score")
      .eq("user_id", user.id).order("date", { ascending: false }),
  ])

  setMetricsWeight(weightData || [])
  setMetricsKcal(kcalData || [])

  if (allDaily) {
    setProgressHistory(allDaily)
    setTotalActiveDays(allDaily.filter(d => Number(d.score) > 0).length)
    const sorted = [...allDaily].sort((a, b) => new Date(a.date) - new Date(b.date))
    let longest = 0, cur = 0
    for (const d of sorted) {
      if (Number(d.score) > 0) { cur++; longest = Math.max(longest, cur) }
      else cur = 0
    }
    setLongestStreak(longest)
  }
}

async function loadWorkoutData() {
  if (!user) return
  setWorkoutLoading(true)
  try {
    const today = getNLDate()
    const monday = getMondayNL()
    const sundayDate = new Date(monday + "T12:00:00")
    sundayDate.setDate(sundayDate.getDate() + 6)
    const sunday = sundayDate.toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" })

    const PLANNING_SELECT = `id, datum, gedaan, workout:workout_id ( id, naam, dag_type, workout_oefeningen ( id, sets, reps, volgorde, oefening:oefening_id ( id, naam, spiergroep, youtube_url, instructies, fouten ) ) )`

    const [{ data: planning, error: planErr }, { data: weekPlan }, { data: libraryData, error: libErr }] = await Promise.all([
      supabase.from("workout_planning")
        .select(PLANNING_SELECT)
        .eq("user_id", user.id).eq("datum", today).maybeSingle(),
      supabase.from("workout_planning")
        .select(`id, datum, gedaan, workout:workout_id ( naam, dag_type )`)
        .eq("user_id", user.id).gte("datum", monday).lte("datum", sunday)
        .order("datum", { ascending: true }),
      supabase.from("workouts")
        .select(`id, naam, niveau, dag_type, schema_type, workout_oefeningen ( id )`)
        .eq("is_template", true)
        .order("naam", { ascending: true }),
    ])

    console.log("[loadWorkoutData] user.id:", user?.id)
    console.log("[loadWorkoutData] planning:", planning, "err:", planErr)
    console.log("[loadWorkoutData] libraryData count:", libraryData?.length, "err:", libErr)

    setTodayWorkout(planning || null)
    setWeekWorkouts(weekPlan || [])
    setWorkoutLibrary(libraryData || [])
    if (planning?.gedaan) setWorkoutScreen("done")

    if (planning?.workout?.workout_oefeningen?.length) {
      const ids = planning.workout.workout_oefeningen.map(wo => wo.oefening?.id).filter(Boolean)
      const { data: prev } = await supabase
        .from("workout_sets").select("oefening_id, gewicht, datum")
        .eq("user_id", user.id)
        .in("oefening_id", ids).not("gewicht", "is", null)
        .order("datum", { ascending: false })
      const map = {}
      for (const s of prev || []) {
        if (!map[s.oefening_id]) map[s.oefening_id] = s.gewicht
      }
      setPrevWeights(map)
    }
  } catch (err) {
    console.error("[loadWorkoutData] error:", err)
  } finally {
    setWorkoutLoading(false)
  }
}

function startWorkoutFromPlanning(planning) {
  console.log("[startWorkout] planning:", JSON.stringify(planning, null, 2))
  console.log("[startWorkout] workout_oefeningen:", planning?.workout?.workout_oefeningen)
  if (!planning?.workout?.workout_oefeningen) {
    console.warn("[startWorkout] geblokkeerd: geen workout_oefeningen")
    return
  }
  const exercises = [...planning.workout.workout_oefeningen]
    .sort((a, b) => (a.volgorde || 0) - (b.volgorde || 0))
  const logs = {}
  for (const wo of exercises) {
    if (!wo.oefening?.id) continue
    logs[wo.oefening.id] = Array.from({ length: wo.sets || 3 }, () => ({
      reps: wo.reps ? String(wo.reps) : "", gewicht: prevWeights[wo.oefening.id] ? String(prevWeights[wo.oefening.id]) : "", done: false,
    }))
  }
  setSetLogs(logs)
  setWorkoutScreen("active")
}

function startWorkout() {
  startWorkoutFromPlanning(todayWorkout)
}

async function chooseSelfWorkout(workoutId) {
  if (!user || !workoutId) return

  // Profiel check: goal moet ingevuld zijn (onboarding gedaan)
  const { data: profile } = await supabase
    .from("users").select("goal").eq("auth_user_id", user.id).maybeSingle()
  if (!profile?.goal) {
    alert("Maak eerst je profiel compleet via de onboarding.")
    setActiveTab("vandaag")
    setShowOnboarding(true)
    return
  }

  setWorkoutLoading(true)
  const today = getNLDate()
  const PLANNING_SELECT = `id, datum, gedaan, workout:workout_id ( id, naam, dag_type, workout_oefeningen ( id, sets, reps, volgorde, oefening:oefening_id ( id, naam, spiergroep, youtube_url, instructies, fouten ) ) )`

  // Stap 1: check of er al een planning bestaat voor vandaag
  const { data: existing } = await supabase
    .from("workout_planning").select(PLANNING_SELECT)
    .eq("user_id", user.id).eq("datum", today).maybeSingle()

  if (existing) {
    // Rij bestaat al → gebruik direct
    setTodayWorkout(existing)
    setWorkoutLoading(false)
    autoWorkoutCommitment(existing.workout?.naam, today)
    startWorkoutFromPlanning(existing)
    return
  }

  // Stap 2: geen rij → probeer INSERT
  const { error: insertErr } = await supabase.from("workout_planning")
    .insert({ user_id: user.id, workout_id: workoutId, datum: today, gedaan: false })

  if (insertErr) {
    // INSERT faalde (bv. 409) → verwijder bestaande rij en probeer opnieuw
    await supabase.from("workout_planning")
      .delete().eq("user_id", user.id).eq("datum", today)
    await supabase.from("workout_planning")
      .insert({ user_id: user.id, workout_id: workoutId, datum: today, gedaan: false })
  }

  // Haal de nieuwe rij op met volledige workout data
  const { data: fresh } = await supabase
    .from("workout_planning").select(PLANNING_SELECT)
    .eq("user_id", user.id).eq("datum", today).maybeSingle()

  if (fresh) {
    setTodayWorkout(fresh)
    setWorkoutLoading(false)
    autoWorkoutCommitment(fresh.workout?.naam, today)
    startWorkoutFromPlanning(fresh)
  } else {
    setWorkoutLoading(false)
  }
}

async function autoWorkoutCommitment(workoutNaam, forDate) {
  if (!workoutNaam || !user) return
  const tekst = `💪 ${workoutNaam}`
  const { data: dup } = await supabase.from("commitments").select("id")
    .eq("user_id", user.id).eq("date", forDate).eq("text", tekst).maybeSingle()
  if (!dup) {
    await supabase.from("commitments")
      .insert({ user_id: user.id, date: forDate, text: tekst, category: "beweging", done: false })
    loadCommitments()
  }
}

async function cancelWorkout() {
  if (!todayWorkout || !user) return
  const workoutNaam = todayWorkout.workout?.naam
  await supabase.from("workout_planning").delete().eq("id", todayWorkout.id)
  if (workoutNaam) {
    await supabase.from("commitments").delete()
      .eq("user_id", user.id).eq("date", getNLDate()).eq("text", `💪 ${workoutNaam}`)
  }
  setTodayWorkout(null)
  setSetLogs({})
  setWorkoutScreen("overview")
  loadCommitments()
}

async function finishWorkout() {
  if (!todayWorkout || !user) return
  const today = getNLDate()
  const exercises = [...(todayWorkout.workout?.workout_oefeningen || [])]
    .sort((a, b) => (a.volgorde || 0) - (b.volgorde || 0))
  const rows = []
  for (const wo of exercises) {
    if (!wo.oefening?.id) continue
    ;(setLogs[wo.oefening.id] || []).forEach((s, i) => {
      if (s.done) rows.push({
        user_id: user.id, workout_id: todayWorkout.workout.id,
        oefening_id: wo.oefening.id, datum: today, set_nummer: i + 1,
        reps_gedaan: s.reps ? parseInt(s.reps) : null,
        gewicht: s.gewicht ? parseFloat(s.gewicht) : null,
      })
    })
  }
  console.log("[finishWorkout] rows to save:", rows)
  if (rows.length) {
    await supabase.from("workout_sets").delete().eq("user_id", user.id).eq("datum", today)
    const { error: setsErr } = await supabase.from("workout_sets").insert(rows)
    console.log("[finishWorkout] insert error:", setsErr)
  } else {
    console.warn("[finishWorkout] geen sets om op te slaan (rows leeg)")
  }
  await supabase.from("workout_planning").update({ gedaan: true }).eq("id", todayWorkout.id)
  setTodayWorkout(prev => ({ ...prev, gedaan: true }))
  setWorkoutScreen("done")
}

function calculateProgress(list) {
  if (list.length === 0) { setProgress(0); return }
  const pct = Math.round(list.filter(c => c.done).length / list.length * 100)
  setProgress(pct)
  saveDailyScore(pct)
}

function calculateStreak(data) {
  if (!data || data.length === 0) { setStreak(0); return }
  let count = 0
  for (let i = 0; i < data.length; i++) {
    if (i === 0 && Number(data[i].score) === 0) continue
    if (Number(data[i].score) > 0) count++
    else break
  }
  setStreak(count)
}

async function saveDailyScore(score) {
  if (!user) return
  await supabase.from("daily_results").upsert({ user_id: user.id, date: getNLDate(), score })
}

async function addCommitment(customText) {
  const t = customText || text
  if (!t || !user) return
  await supabase.from("commitments").insert({ text: t, user_id: user.id, date: getNLDate(), done: false, category: classifyCommitment(t) })
  if (!customText) setText("")
  loadCommitments()
}

async function toggleDone(id, current) {
  await supabase.from("commitments").update({ done: !current }).eq("id", id)
  loadCommitments()
}

async function linkWhatsapp(number) {
  if (!number || !user) return false
  const formatted = number.startsWith("whatsapp:") ? number : `whatsapp:${number}`
  const { error } = await supabase.from("users")
    .update({ whatsapp_number: formatted })
    .eq("auth_user_id", user.id)
  if (error) { alert("Fout bij koppelen: " + error.message); return false }
  setWhatsappLinked(true)
  return true
}

async function logout() {
  await supabase.auth.signOut()
  location.reload()
}

// ── Chat ──────────────────────────────────────────────────────
const todayCommitment = commitments[0]?.text || ""

async function sendChat(messageText) {
  const msg = (messageText || chatInput).trim()
  if (!msg || chatLoading) return
  setChatInput("")
  const newMessages = [...chatMessages, { role: "user", content: msg }]
  setChatMessages(newMessages)
  setChatLoading(true)
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newMessages, streak, missedDays, commitment: todayCommitment, trainingLocation, fitnessLevel }),
    })
    const data = await res.json()
    setChatMessages(prev => [...prev, { role: "assistant", content: data.content }])
  } catch {
    setChatMessages(prev => [...prev, { role: "assistant", content: "Er ging iets mis. Probeer opnieuw." }])
  }
  setChatLoading(false)
}

useEffect(() => {
  chatBottomRef.current?.scrollIntoView({ behavior: "smooth" })
}, [chatMessages])

const suggestions = ["Hoe houd ik mijn streak vol?", "Tips voor vandaag", "Ik struggle"]

// ── Voortgang chart data ───────────────────────────────────────
function periodStartDate(period) {
  const d = new Date()
  d.setDate(d.getDate() - (period === "7d" ? 7 : period === "30d" ? 30 : 90))
  return d.toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" })
}

function linearTrend(data) {
  const n = data.length
  if (n < 2) return data.map(d => ({ ...d, trend: d.value }))
  const sumX = (n * (n - 1)) / 2
  const sumY = data.reduce((s, d) => s + d.value, 0)
  const sumXY = data.reduce((s, d, i) => s + i * d.value, 0)
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6
  const denom = n * sumX2 - sumX * sumX
  if (denom === 0) return data.map(d => ({ ...d, trend: d.value }))
  const sl = (n * sumXY - sumX * sumY) / denom
  const ic = (sumY - sl * sumX) / n
  return data.map((d, i) => ({ ...d, trend: Math.round((sl * i + ic) * 10) / 10 }))
}

const wStart = periodStartDate(weightPeriod)
const kStart = periodStartDate(kcalPeriod)

const weightFiltered = metricsWeight
  .filter(m => m.datum >= wStart)
  .map(m => ({ label: fmtShortDate(m.datum), value: parseMetricValue(m.waarde) }))
  .filter(d => d.value !== null)

const weightChartData = linearTrend(weightFiltered)

const weightTrendDelta = weightFiltered.length >= 2
  ? Math.round((weightFiltered[weightFiltered.length - 1].value - weightFiltered[0].value) * 10) / 10
  : null

const kcalChartData = metricsKcal
  .filter(m => m.datum >= kStart)
  .map(m => ({ label: fmtShortDate(m.datum), value: parseMetricValue(m.waarde) }))
  .filter(d => d.value !== null)

const avgKcal = kcalChartData.length === 0 ? 0
  : Math.round(kcalChartData.reduce((s, d) => s + d.value, 0) / kcalChartData.length)

const successRatio = progressHistory.length === 0 ? 0
  : Math.round(totalActiveDays / progressHistory.length * 100)

const latestWeight = metricsWeight.length > 0 ? metricsWeight[metricsWeight.length - 1] : null

// ── Onboarding ────────────────────────────────────────────────
if (showOnboarding) {
  const totalSteps = 8
  const inputStyle = { width: "100%", padding: "13px 14px", borderRadius: 8, border: `1px solid ${C.inputBorder}`, background: C.inputBg, color: C.text, fontSize: 15, boxSizing: "border-box", outline: "none" }
  const btnPrimary = { width: "100%", padding: "14px", background: GREEN, border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer", fontSize: 15, color: "#000" }
  const btnGhost   = { width: "100%", padding: "12px", background: "transparent", border: "none", color: C.textSub, cursor: "pointer", fontSize: 13 }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: 420, background: C.card, padding: 40, borderRadius: 12 }}>
        <p style={{ color: C.textMuted, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 32 }}>
          Stap {onboardingStep} van {totalSteps}
        </p>

        {/* Stap 1 — Doel kiezen */}
        {onboardingStep === 1 && (
          <>
            <h2 style={{ marginBottom: 8, fontSize: 22, color: C.text }}>Wat is je doel?</h2>
            <p style={{ color: C.textSub, fontSize: 14, marginBottom: 24 }}>Kies het doel waar je nu op focust.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {GOALS.map(g => (
                <button key={g} onClick={() => setSelectedGoal(g)} style={{
                  padding: "14px", borderRadius: 8, border: `2px solid ${selectedGoal === g ? GREEN : C.inputBorder}`,
                  background: selectedGoal === g ? "#0a1a0f" : C.inputBg,
                  color: selectedGoal === g ? GREEN : C.text,
                  fontSize: 15, cursor: "pointer", textAlign: "left", fontWeight: selectedGoal === g ? "bold" : "normal",
                }}>
                  {g}
                </button>
              ))}
            </div>
            <button onClick={() => selectedGoal && setOnboardingStep(2)} style={{ ...btnPrimary, opacity: selectedGoal ? 1 : 0.4, cursor: selectedGoal ? "pointer" : "default" }}>
              Volgende →
            </button>
          </>
        )}

        {/* Stap 2 — Naam */}
        {onboardingStep === 2 && (
          <>
            <h2 style={{ marginBottom: 8, fontSize: 22, color: C.text }}>Wat is je naam?</h2>
            <p style={{ color: C.textSub, fontSize: 14, marginBottom: 24 }}>Zo kan je coach je persoonlijk aanspreken.</p>
            <input
              autoFocus
              value={onboardingName}
              onChange={e => setOnboardingName(e.target.value)}
              onKeyDown={async e => {
                if (e.key === "Enter" && onboardingName.trim()) {
                  await supabase.from("users").update({ name: onboardingName.trim() }).eq("auth_user_id", user.id)
                  setOnboardingStep(3)
                }
              }}
              placeholder="bijv. Thomas"
              style={{ ...inputStyle, marginBottom: 24 }}
            />
            <button onClick={async () => {
              if (!onboardingName.trim()) return
              await supabase.from("users").update({ name: onboardingName.trim() }).eq("auth_user_id", user.id)
              setOnboardingStep(3)
            }} style={{ ...btnPrimary, opacity: onboardingName.trim() ? 1 : 0.4, cursor: onboardingName.trim() ? "pointer" : "default" }}>
              Volgende →
            </button>
          </>
        )}

        {/* Stap 3 — Gewicht (optioneel) */}
        {onboardingStep === 3 && (
          <>
            <h2 style={{ marginBottom: 8, fontSize: 22, color: C.text }}>Jouw gewicht</h2>
            <p style={{ color: C.textSub, fontSize: 14, marginBottom: 24 }}>Optioneel — helpt AXIS je voortgang bij te houden.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              <div>
                <p style={{ color: C.textMuted, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Huidig gewicht (kg)</p>
                <input type="number" value={currentWeightInput} onChange={e => setCurrentWeightInput(e.target.value)}
                  placeholder="bijv. 78" style={inputStyle} />
              </div>
              <div>
                <p style={{ color: C.textMuted, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Doelgewicht (kg)</p>
                <input type="number" value={targetWeightInput} onChange={e => setTargetWeightInput(e.target.value)}
                  placeholder="bijv. 72" style={inputStyle} />
              </div>
            </div>
            <button onClick={async () => { await saveGoalData(selectedGoal, currentWeightInput, targetWeightInput); setOnboardingStep(4) }} style={btnPrimary}>
              Volgende →
            </button>
            <button onClick={async () => { await saveGoalData(selectedGoal, null, null); setOnboardingStep(4) }} style={btnGhost}>
              Sla over
            </button>
          </>
        )}

        {/* Stap 4 — Trainingslocatie */}
        {onboardingStep === 4 && (
          <>
            <h2 style={{ marginBottom: 8, fontSize: 22, color: C.text }}>Waar train je?</h2>
            <p style={{ color: C.textSub, fontSize: 14, marginBottom: 24 }}>AXIS past de coaching aan op jouw situatie.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {["Gym", "Thuis", "Buiten", "Wisselend"].map(loc => (
                <button key={loc} onClick={() => setTrainingLocation(loc)} style={{
                  padding: "14px", borderRadius: 8, border: `2px solid ${trainingLocation === loc ? GREEN : C.inputBorder}`,
                  background: trainingLocation === loc ? "#0a1a0f" : C.inputBg,
                  color: trainingLocation === loc ? GREEN : C.text,
                  fontSize: 15, cursor: "pointer", textAlign: "left", fontWeight: trainingLocation === loc ? "bold" : "normal",
                }}>
                  {loc}
                </button>
              ))}
            </div>
            <button onClick={async () => {
              if (!trainingLocation) return
              await supabase.from("users").update({ training_location: trainingLocation }).eq("auth_user_id", user.id)
              setOnboardingStep(5)
            }} style={{ ...btnPrimary, opacity: trainingLocation ? 1 : 0.4, cursor: trainingLocation ? "pointer" : "default" }}>
              Volgende →
            </button>
          </>
        )}

        {/* Stap 5 — Sportfrequentie */}
        {onboardingStep === 5 && (
          <>
            <h2 style={{ marginBottom: 8, fontSize: 22, color: C.text }}>Hoe vaak wil je sporten?</h2>
            <p style={{ color: C.textSub, fontSize: 14, marginBottom: 24 }}>AXIS stelt een trainingsschema in dat bij je past.</p>
            <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setSportFrequentie(n)} style={{
                  flex: 1, minWidth: 56, padding: "16px 8px", borderRadius: 8,
                  border: `2px solid ${sportFrequentie === n ? GREEN : C.inputBorder}`,
                  background: sportFrequentie === n ? "#0a1a0f" : C.inputBg,
                  color: sportFrequentie === n ? GREEN : C.text,
                  fontSize: 18, fontWeight: "bold", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                }}>
                  {n}x
                  <span style={{ fontSize: 10, color: sportFrequentie === n ? GREEN : C.textMuted, fontWeight: "normal" }}>
                    {n === 1 ? "p.w." : n === 5 ? "p.w." : "p.w."}
                  </span>
                </button>
              ))}
            </div>
            <button onClick={async () => {
              if (!sportFrequentie) return
              await supabase.from("users").update({ sport_frequentie: sportFrequentie }).eq("auth_user_id", user.id)
              setOnboardingStep(6)
            }} style={{ ...btnPrimary, opacity: sportFrequentie ? 1 : 0.4, cursor: sportFrequentie ? "pointer" : "default" }}>
              Volgende →
            </button>
          </>
        )}

        {/* Stap 6 — Fitnessniveau */}
        {onboardingStep === 6 && (
          <>
            <h2 style={{ marginBottom: 8, fontSize: 22, color: C.text }}>Wat is je niveau?</h2>
            <p style={{ color: C.textSub, fontSize: 14, marginBottom: 24 }}>Zodat de coach je uitdaagt op jouw niveau.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {["Beginner", "Gemiddeld", "Gevorderd"].map(lvl => (
                <button key={lvl} onClick={() => setFitnessLevel(lvl)} style={{
                  padding: "14px", borderRadius: 8, border: `2px solid ${fitnessLevel === lvl ? GREEN : C.inputBorder}`,
                  background: fitnessLevel === lvl ? "#0a1a0f" : C.inputBg,
                  color: fitnessLevel === lvl ? GREEN : C.text,
                  fontSize: 15, cursor: "pointer", textAlign: "left", fontWeight: fitnessLevel === lvl ? "bold" : "normal",
                }}>
                  {lvl}
                </button>
              ))}
            </div>
            <button onClick={async () => {
              if (!fitnessLevel) return
              await supabase.from("users").update({ fitness_level: fitnessLevel }).eq("auth_user_id", user.id)
              setOnboardingStep(7)
            }} style={{ ...btnPrimary, opacity: fitnessLevel ? 1 : 0.4, cursor: fitnessLevel ? "pointer" : "default" }}>
              Volgende →
            </button>
          </>
        )}

        {/* Stap 7 — Eerste commitment kiezen */}
        {onboardingStep === 7 && (
          <>
            <h2 style={{ marginBottom: 8, fontSize: 22, color: C.text }}>Wat ga jij vandaag doen?</h2>
            <p style={{ color: C.textSub, fontSize: 14, marginBottom: 20 }}>Kies een suggestie of typ je eigen commitment.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {(GOAL_SUGGESTIONS[selectedGoal] || []).map(s => (
                <button key={s} onClick={async () => { await addCommitment(s); setOnboardingStep(8) }} style={{
                  padding: "13px 14px", borderRadius: 8, border: `1px solid ${C.inputBorder}`,
                  background: C.inputBg, color: C.text, fontSize: 14, cursor: "pointer", textAlign: "left",
                }}>
                  {s}
                </button>
              ))}
            </div>
            <p style={{ color: C.textMuted, fontSize: 12, marginBottom: 8 }}>Of typ zelf:</p>
            <input autoFocus value={text} onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && text && addCommitment().then(() => setOnboardingStep(8))}
              placeholder="bijv. 30 minuten sporten"
              style={{ ...inputStyle, marginBottom: 12 }}
            />
            <button onClick={async () => { if (!text) return; await addCommitment(); setOnboardingStep(8) }}
              style={{ ...btnPrimary, opacity: text ? 1 : 0.4, cursor: text ? "pointer" : "default" }}>
              Dit is mijn commitment →
            </button>
          </>
        )}

        {/* Stap 8 — WhatsApp koppelen */}
        {onboardingStep === 8 && (
          <>
            <h2 style={{ marginBottom: 8, fontSize: 22, color: C.text }}>Blijf op koers via WhatsApp</h2>
            <p style={{ color: C.textSub, fontSize: 14, marginBottom: 24 }}>AXIS stuurt je dagelijks een check-in.<br/>Geen app nodig — gewoon reageren.</p>
            <input autoFocus value={whatsappInput} onChange={e => setWhatsappInput(e.target.value)}
              placeholder="+31612345678"
              style={{ ...inputStyle, marginBottom: 12 }}
            />
            <button onClick={async () => { if (!whatsappInput) return; const ok = await linkWhatsapp(whatsappInput); if (ok) { setInteractionMode("whatsapp"); setShowOnboarding(false) } }}
              style={{ ...btnPrimary, marginBottom: 10 }}>
              Koppel WhatsApp (aanbevolen)
            </button>
            <button onClick={() => { setInteractionMode("app"); setShowOnboarding(false) }} style={btnGhost}>
              Sla over, ik gebruik de app
            </button>
          </>
        )}

      </div>
    </div>
  )
}

// ── Voedingsdoelen modal ──────────────────────────────────────
if (showNutritionModal) {
  const readonly = doelenDoorCoach
  const inp = { width: "100%", padding: "11px 13px", borderRadius: 8, border: `1px solid ${C.inputBorder}`, background: readonly ? C.cardAlt : C.inputBg, color: readonly ? C.textMuted : C.text, fontSize: 14, boxSizing: "border-box", outline: "none" }
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: 400, background: C.card, padding: 36, borderRadius: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, color: C.text, margin: 0 }}>Voedingsdoelen</h2>
          <button onClick={() => setShowNutritionModal(false)} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 20 }}>×</button>
        </div>
        {readonly && (
          <div style={{ background: "#0a1a0f", border: `1px solid #1a4d2a`, borderRadius: 8, padding: "10px 14px", marginBottom: 20 }}>
            <p style={{ color: GREEN, fontSize: 13, margin: 0 }}>✓ Ingesteld door je coach</p>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { label: "Dagelijks kcal doel", val: kcalDoel, set: setKcalDoel, placeholder: "bijv. 2000", required: true },
            { label: "Eiwitten (g)", val: eiwittenDoel, set: setEiwittenDoel, placeholder: "bijv. 150" },
            { label: "Koolhydraten (g)", val: koolhydratenDoel, set: setKoolhydratenDoel, placeholder: "bijv. 200" },
            { label: "Vetten (g)", val: vettenDoel, set: setVettenDoel, placeholder: "bijv. 70" },
          ].map(({ label, val, set, placeholder, required }) => (
            <div key={label}>
              <p style={{ color: C.textMuted, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 7 }}>{label}{required && " *"}</p>
              <input type="number" value={val} onChange={e => !readonly && set(e.target.value)} readOnly={readonly}
                placeholder={placeholder} style={inp} />
            </div>
          ))}
        </div>
        {!readonly && (
          <button onClick={saveNutritionGoals} disabled={!kcalDoel || savingGoals}
            style={{ width: "100%", marginTop: 20, padding: "13px", background: (!kcalDoel || savingGoals) ? C.cardAlt : GREEN, border: "none", borderRadius: 8, color: (!kcalDoel || savingGoals) ? C.textMuted : "#000", fontWeight: "bold", fontSize: 15, cursor: (!kcalDoel || savingGoals) ? "default" : "pointer" }}>
            {savingGoals ? "Opslaan..." : "Opslaan"}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Hoofdapp ──────────────────────────────────────────────────
const done = commitments.filter(c => c.done).length
const total = commitments.length
const circumference = 2 * Math.PI * 36
const todayState = total === 0 ? 1 : done === 0 ? 2 : done < total ? 3 : 4

// Period selector
const PeriodSelector = ({ options, value, onChange }) => (
  <div style={{ display: "flex", gap: 4 }}>
    {options.map(opt => (
      <button key={opt} onClick={() => onChange(opt)} style={{
        padding: "3px 9px", borderRadius: 5,
        border: `1px solid ${value === opt ? GREEN : C.border}`,
        background: value === opt ? GREEN + "22" : "transparent",
        color: value === opt ? GREEN : C.textMuted,
        fontSize: 10, fontWeight: value === opt ? "bold" : "normal",
        cursor: "pointer", letterSpacing: 0.5,
      }}>{opt}</button>
    ))}
  </div>
)

// Recharts custom tooltip
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const main = payload.find(p => p.dataKey === "value") || payload[0]
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
      <p style={{ color: C.textMuted, margin: "0 0 4px" }}>{label}</p>
      <p style={{ color: GREEN, margin: 0, fontWeight: "bold" }}>{main.value}</p>
    </div>
  )
}

return (
<div style={{ maxWidth: 420, margin: "auto", fontFamily: "sans-serif", background: C.bg, minHeight: "100vh", color: C.text, position: "relative" }}>

  {/* HEADER */}
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 20px 12px" }}>
    <div>
      <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "0.15em", color: C.text, fontFamily: "sans-serif" }}>AXIS</span>
      <p style={{ color: C.textMuted, fontSize: 10, letterSpacing: 1.5, marginTop: 4, textTransform: "uppercase" }}>
        Commit. Execute. Reflect. Recover.
      </p>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {streak > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: GREEN }} />
          <span style={{ color: GREEN, fontSize: 12 }}>{streak} {streak === 1 ? "dag" : "dagen"}</span>
        </div>
      )}
      <div style={{ position: "relative" }}>
        <button onClick={() => setShowSettings(!showSettings)}
          style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 20, padding: "4px 8px" }}>
          ···
        </button>
        {showSettings && (
          <div style={{ position: "absolute", right: 0, top: 36, background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "6px 0", minWidth: 216, zIndex: 100, boxShadow: "0 8px 28px rgba(0,0,0,0.28)", overflow: "hidden" }}>
            <style>{`.ax-menu-btn { transition: background 0.12s; } .ax-menu-btn:hover { background: ${theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"} !important; }`}</style>

            {/* Email */}
            <div style={{ padding: "8px 14px 10px" }}>
              <p style={{ color: C.textDim, fontSize: 11, margin: 0, letterSpacing: 0.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</p>
            </div>

            <div style={{ height: 1, background: C.borderSub }} />

            {/* Thema */}
            {[{ val: "dark", label: "Dark", icon: "🌙" }, { val: "light", label: "Light", icon: "☀️" }].map(({ val, label, icon }) => (
              <button key={val} onClick={() => { toggleTheme(val); setShowSettings(false) }}
                className="ax-menu-btn"
                style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "9px 14px", background: "none", border: "none", color: C.text, cursor: "pointer", fontSize: 13, boxSizing: "border-box" }}>
                <span style={{ fontSize: 14, width: 18, textAlign: "center" }}>{icon}</span>
                <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
                {theme === val && <div style={{ width: 6, height: 6, borderRadius: "50%", background: GREEN, flexShrink: 0 }} />}
              </button>
            ))}

            <div style={{ height: 1, background: C.borderSub, margin: "4px 0" }} />

            {/* Acties */}
            {[
              { icon: "🔑", label: "Wachtwoord instellen", onClick: async () => { setShowSettings(false); const pw = prompt("Nieuw wachtwoord (min. 6 tekens):"); if (!pw || pw.length < 6) return; const { error } = await supabase.auth.updateUser({ password: pw }); if (error) alert("Fout: " + error.message); else alert("Wachtwoord opgeslagen!") } },
              { icon: "💬", label: "Koppel WhatsApp",      onClick: async () => { setShowSettings(false); const number = prompt("Jouw WhatsApp nummer (+31...):"); if (!number) return; const ok = await linkWhatsapp(number); if (ok) alert("WhatsApp gekoppeld!") } },
              { icon: "🥗", label: "Voedingsdoelen",       onClick: () => { setShowSettings(false); setShowNutritionModal(true) } },
            ].map(({ icon, label, onClick }) => (
              <button key={label} onClick={onClick}
                className="ax-menu-btn"
                style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "9px 14px", background: "none", border: "none", color: C.text, cursor: "pointer", fontSize: 13, boxSizing: "border-box" }}>
                <span style={{ fontSize: 14, width: 18, textAlign: "center" }}>{icon}</span>
                <span style={{ textAlign: "left" }}>{label}</span>
              </button>
            ))}

            <div style={{ height: 1, background: C.borderSub, margin: "4px 0" }} />

            {/* Uitloggen */}
            <button onClick={logout}
              className="ax-menu-btn"
              style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "9px 14px", background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 13, boxSizing: "border-box" }}>
              <span style={{ fontSize: 13, width: 18, textAlign: "center" }}>⏻</span>
              <span style={{ textAlign: "left" }}>Uitloggen</span>
            </button>
          </div>
        )}
      </div>
    </div>
  </div>

  {/* ── TAB: VANDAAG ─────────────────────────────────────────── */}
  {activeTab === "vandaag" && (
    <div style={{ padding: "0 20px", paddingBottom: TAB_H + 80 }}>

      {/* ── VOORTGANG CIRKEL ── */}
      <div style={{ marginTop: 24, marginBottom: 32 }}>
        <p style={{ fontSize: 10, letterSpacing: 2, color: C.textMuted, textTransform: "uppercase", marginBottom: 16 }}>Vandaag</p>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <svg width={88} height={88} style={{ flexShrink: 0, opacity: todayState === 1 ? 0.3 : 1, transition: "opacity 0.4s ease" }}>
            <circle cx={44} cy={44} r={36} fill="none" stroke={C.borderSub} strokeWidth={6} />
            <circle cx={44} cy={44} r={36} fill="none" stroke={GREEN} strokeWidth={6}
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (circumference * progress / 100)}
              strokeLinecap="round" transform="rotate(-90 44 44)"
              style={{ transition: "stroke-dashoffset 0.5s ease" }}
            />
            <text x={44} y={44} textAnchor="middle" dominantBaseline="middle" fill={C.text} fontSize={14} fontWeight="bold">
              {progress}%
            </text>
          </svg>
          <div>
            <p style={{ fontSize: 28, fontWeight: "bold", margin: 0, color: C.text }}>
              {done} <span style={{ color: C.textMuted, fontSize: 18 }}>/ {total}</span>
            </p>
            <p style={{ color: C.textSub, fontSize: 13, marginTop: 4 }}>
              {todayState === 4 ? "Perfecte dag 🎯" : todayState === 3 ? "Bezig..." : todayState === 2 ? "Nog niets afgevinkt" : "Nog niets gepland"}
            </p>
          </div>
        </div>
      </div>

      {/* ── COMMITMENTS ── */}
      <div style={{ marginBottom: todayState === 4 ? 12 : 32, transition: "margin-bottom 0.4s ease" }}>
        <p style={{ fontSize: 10, letterSpacing: 2, color: C.textMuted, textTransform: "uppercase", marginBottom: 16 }}>Commitments</p>

        {todayState === 1 && (
          <p style={{ color: C.textMuted, fontSize: 13 }}>Wat ga je vandaag doen?</p>
        )}

        {todayState === 4 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0 8px" }}>
            <span style={{ color: GREEN, fontSize: 14 }}>✓</span>
            <span style={{ color: C.textMuted, fontSize: 13 }}>{done} / {total} voltooid</span>
          </div>
        ) : (
          <>
            {commitments.slice(0, showAll ? commitments.length : 5).map(c => (
              <div key={c.id} onClick={() => toggleDone(c.id, c.done)}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: `1px solid ${C.borderSub}`, cursor: "pointer" }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, border: c.done ? "none" : `2px solid ${C.border}`, background: c.done ? GREEN : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {c.done && <span style={{ color: "#000", fontSize: 13, fontWeight: "bold" }}>✓</span>}
                </div>
                {(CATEGORY_ICON[c.category] || CATEGORY_ICON[classifyCommitment(c.text)]) && (
                  <span style={{ fontSize: 14, flexShrink: 0 }}>
                    {CATEGORY_ICON[c.category] || CATEGORY_ICON[classifyCommitment(c.text)]}
                  </span>
                )}
                <span style={{ fontSize: 15, color: c.done ? C.textMuted : C.text, textDecoration: c.done ? "line-through" : "none" }}>
                  {c.text}
                </span>
              </div>
            ))}
            {commitments.length > 5 && (
              <button onClick={() => setShowAll(!showAll)}
                style={{ background: "none", border: "none", color: C.textSub, fontSize: 13, cursor: "pointer", marginTop: 8, padding: 0 }}>
                {showAll ? "Minder tonen" : `+${commitments.length - 5} meer`}
              </button>
            )}
          </>
        )}
      </div>

      {/* ── REFLECTIE ── */}
      {todayState > 1 && (
        <div style={{ marginBottom: 32, opacity: todayState === 2 ? 0.45 : todayState === 3 ? 0.75 : 1, transition: "opacity 0.4s ease" }}>
          {todayState === 4 && <div style={{ height: 1, background: C.borderSub, marginBottom: 24 }} />}
          <p style={{ fontSize: 10, letterSpacing: 2, color: C.textMuted, textTransform: "uppercase", marginBottom: 16 }}>Reflectie</p>
          <div style={{
            background: todayState === 4 ? "#0d1a10" : C.card,
            borderRadius: 12,
            padding: 20,
            border: todayState === 4
              ? `1px solid #1a4d2a`
              : todayState === 2
              ? `1px dashed ${C.border}`
              : `1px solid ${C.border}`,
            animation: todayState === 4 ? "pulseGlow 2.5s ease-in-out infinite" : "none",
            transition: "background 0.4s ease, border-color 0.4s ease",
          }}>
            {todayState === 4 && (
              <p style={{ color: GREEN, fontSize: 12, margin: "0 0 12px", letterSpacing: 0.5 }}>🎯 Alle commitments voltooid</p>
            )}
            <p style={{ fontSize: 15, marginBottom: todayState === 4 ? 16 : 0, color: todayState < 4 ? C.textMuted : C.text }}>
              {todayState < 4 ? "Klaar voor vandaag? Vink af en reflecteer." : "Heb je je commitments gehaald?"}
            </p>
            {todayState === 4 && (
              <>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setCompleted(true)} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", cursor: "pointer", background: completed === true ? "#166534" : C.cardAlt, color: completed === true ? GREEN : C.textSub, fontWeight: completed === true ? "bold" : "normal", fontSize: 14, transition: "background 0.2s" }}>Ja</button>
                  <button onClick={() => setCompleted(false)} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", cursor: "pointer", background: completed === false ? "#2a1a1a" : C.cardAlt, color: completed === false ? "#ef4444" : C.textSub, fontWeight: completed === false ? "bold" : "normal", fontSize: 14, transition: "background 0.2s" }}>Nee</button>
                </div>
                {completed !== null && (
                  <div style={{ marginTop: 16 }}>
                    <p style={{ color: C.textSub, fontSize: 13, marginBottom: 8 }}>
                      {completed ? "Wat hielp je om consistent te blijven?" : "Wat stond je in de weg?"}
                    </p>
                    <textarea value={answer} onChange={e => setAnswer(e.target.value)}
                      placeholder="Schrijf je reflectie..." rows={3}
                      style={{ width: "100%", padding: 12, borderRadius: 8, background: C.inputBg, color: C.text, border: `1px solid ${C.inputBorder}`, fontSize: 14, resize: "none", boxSizing: "border-box" }}
                    />
                    <button onClick={handleSubmit}
                      style={{ marginTop: 10, background: GREEN, color: "#000", padding: "10px 20px", borderRadius: 8, border: "none", fontWeight: "bold", cursor: "pointer", fontSize: 14 }}>
                      Opslaan
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 32 }}>
        <style>{`
          @keyframes pulseGlow {
            0%, 100% { box-shadow: 0 0 8px #22c55e55, 0 0 16px #22c55e22; }
            50%       { box-shadow: 0 0 12px #22c55e88, 0 0 24px #22c55e44; }
          }
        `}</style>
        <p style={{ fontSize: 10, letterSpacing: 2, color: C.textMuted, textTransform: "uppercase", marginBottom: 16 }}>Deze week</p>
        {(() => {
          const dagNamen = ["ma", "di", "wo", "do", "vr", "za", "zo"]
          const today    = getNLDate()
          const base     = new Date(today)
          const dow      = base.getDay()
          const monday   = new Date(base)
          monday.setDate(base.getDate() + (dow === 0 ? -6 : 1 - dow))
          const weekDagen = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday)
            d.setDate(monday.getDate() + i)
            return d.toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" })
          })
          const scoreMap = {}
          history.forEach(d => { scoreMap[d.date] = Number(d.score) })
          const actiefDagen = weekDagen.filter(d => weekCheckIns.has(d) && (scoreMap[d] ?? 0) > 0).length
          return (
            <>
              <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
                {weekDagen.map((datum, i) => {
                  const isToekomst   = datum > today
                  const isVandaag    = datum === today
                  const heeftCheckIn = weekCheckIns.has(datum)
                  const heeftCommit  = weekCommits.has(datum)
                  const score        = scoreMap[datum] ?? null
                  const isGreen  = !isToekomst && !isVandaag && heeftCheckIn && score > 0
                  const isOranje = !isToekomst && !isVandaag && heeftCommit && !heeftCheckIn
                  const isRood   = !isToekomst && !isVandaag && !heeftCommit && !heeftCheckIn
                  let boxStyle = {}, content = null
                  let labelColor = C.textDim, labelWeight = "normal"
                  if (isToekomst)      { boxStyle = { background: C.cardAlt, border: `1px dashed ${C.border}` } }
                  else if (isVandaag)  { boxStyle = { background: "#0a1a0f", border: "1px solid #1a4d2a", animation: "pulseGlow 2.5s ease-in-out infinite" }; labelColor = GREEN; labelWeight = "bold"; content = (<div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${GREEN}`, display: "flex", alignItems: "center", justifyContent: "center" }}>{heeftCheckIn && score > 0 && <span style={{ color: GREEN, fontSize: 11, fontWeight: "bold" }}>✓</span>}</div>) }
                  else if (isGreen)    { boxStyle = { background: "#0a1a0f", border: "1px solid #1a4d2a", boxShadow: "0 0 8px #22c55e66, 0 0 16px #22c55e22" }; content = (<div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${GREEN}`, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: GREEN, fontSize: 11, fontWeight: "bold" }}>✓</span></div>) }
                  else if (isOranje)   { boxStyle = { background: "#1a1500", border: "1px solid #3d3000" }; content = <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid #3d3000", borderTopColor: "#c8900a" }} /> }
                  else if (isRood)     { boxStyle = { background: "#1f0f0f", border: "1px solid #3d1a1a" }; content = <span style={{ color: "#7a2020", fontSize: 16, fontWeight: "bold" }}>×</span> }
                  else                 { boxStyle = { background: C.cardAlt, border: `1px solid ${C.border}` } }
                  return (
                    <div key={datum} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, ...boxStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>{content}</div>
                      <span style={{ fontSize: 10, color: labelColor, fontWeight: labelWeight }}>{dagNamen[i]}</span>
                    </div>
                  )
                })}
              </div>
              <p style={{ color: C.textMuted, fontSize: 12, marginTop: 14 }}>{actiefDagen} van 7 dagen actief deze week</p>
            </>
          )
        })()}
      </div>

      {/* ── REMINDERS ──────────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <p style={{ fontSize: 10, letterSpacing: 2, color: C.textMuted, textTransform: "uppercase", margin: 0 }}>Reminders</p>
          <button
            onClick={() => { setShowAddReminder(v => !v); setReminderForm({ tekst: "", tijd: "", eenmalig: false, datum: "" }) }}
            style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${showAddReminder ? C.border : GREEN}`, background: showAddReminder ? "transparent" : "#0a1a0f", color: showAddReminder ? C.textMuted : GREEN, fontSize: 12, cursor: "pointer" }}
          >
            {showAddReminder ? "Annuleren" : "+ Toevoegen"}
          </button>
        </div>

        {showAddReminder && (
          <div style={{ background: C.card, borderRadius: 10, padding: 16, marginBottom: 12, border: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                value={reminderForm.tekst}
                onChange={e => setReminderForm(f => ({ ...f, tekst: e.target.value }))}
                placeholder="Bijv. creatine innemen"
                style={{ padding: "10px 13px", borderRadius: 8, border: `1px solid ${C.inputBorder}`, background: C.inputBg, color: C.text, fontSize: 14, outline: "none" }}
              />

              {/* Type toggle */}
              <div style={{ display: "flex", gap: 8 }}>
                {[{ val: false, label: "Dagelijks" }, { val: true, label: "Eenmalig" }].map(({ val, label }) => (
                  <button key={label} onClick={() => setReminderForm(f => ({ ...f, eenmalig: val, datum: "" }))}
                    style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `1px solid ${reminderForm.eenmalig === val ? GREEN : C.inputBorder}`, background: reminderForm.eenmalig === val ? "#0a1a0f" : C.inputBg, color: reminderForm.eenmalig === val ? GREEN : C.textSub, fontSize: 13, fontWeight: reminderForm.eenmalig === val ? "bold" : "normal", cursor: "pointer" }}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Tijd + optioneel datum */}
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="time"
                  value={reminderForm.tijd}
                  onChange={e => setReminderForm(f => ({ ...f, tijd: e.target.value }))}
                  style={{ flex: 1, padding: "10px 13px", borderRadius: 8, border: `1px solid ${C.inputBorder}`, background: C.inputBg, color: reminderForm.tijd ? C.text : C.textMuted, fontSize: 14, outline: "none" }}
                />
                {reminderForm.eenmalig && (
                  <input
                    type="date"
                    value={reminderForm.datum}
                    min={getNLDate()}
                    onChange={e => setReminderForm(f => ({ ...f, datum: e.target.value }))}
                    style={{ flex: 1, padding: "10px 13px", borderRadius: 8, border: `1px solid ${C.inputBorder}`, background: C.inputBg, color: reminderForm.datum ? C.text : C.textMuted, fontSize: 14, outline: "none" }}
                  />
                )}
              </div>

              {(() => {
                const formOk = reminderForm.tekst.trim() && reminderForm.tijd && (!reminderForm.eenmalig || reminderForm.datum)
                return (
                  <button
                    onClick={addReminder}
                    disabled={!formOk || savingReminder}
                    style={{ padding: "11px", borderRadius: 8, border: "none", background: formOk ? GREEN : C.cardAlt, color: formOk ? "#000" : C.textMuted, fontWeight: "bold", fontSize: 14, cursor: formOk ? "pointer" : "default" }}
                  >
                    {savingReminder ? "Opslaan..." : "Opslaan"}
                  </button>
                )
              })()}
            </div>
          </div>
        )}

        {reminders.length === 0 && !showAddReminder && (
          <p style={{ color: C.textMuted, fontSize: 13 }}>Geen reminders ingesteld.</p>
        )}

        {reminders.map(r => {
          const isExpired = r.eenmalig && r.datum && r.datum < getNLDate()
          const timeLabel = fmtTime(r.tijd)
          const subLabel  = r.eenmalig
            ? (isExpired ? "Verlopen" : fmtReminderDate(r.datum))
            : "Dagelijks"
          const subColor  = isExpired ? "#7a3030" : C.textDim
          return (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: `1px solid ${C.borderSub}` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, color: r.actief && !isExpired ? C.text : C.textMuted, margin: 0, textDecoration: !r.actief || isExpired ? "line-through" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.tekst}
                </p>
                <p style={{ fontSize: 11, color: subColor, margin: "3px 0 0" }}>
                  {timeLabel} · {subLabel}
                </p>
              </div>
              <button
                onClick={() => toggleReminder(r.id, r.actief)}
                disabled={isExpired}
                style={{ width: 38, height: 22, borderRadius: 11, border: "none", background: r.actief && !isExpired ? GREEN : C.cardAlt, cursor: isExpired ? "default" : "pointer", position: "relative", flexShrink: 0, transition: "background 0.2s" }}
              >
                <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: r.actief && !isExpired ? 18 : 4, transition: "left 0.2s" }} />
              </button>
              <button
                onClick={() => deleteReminder(r.id)}
                style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 16, padding: "0 4px", flexShrink: 0 }}
              >
                ×
              </button>
            </div>
          )
        })}
      </div>

    </div>
  )}

  {/* ── TAB: VOORTGANG ───────────────────────────────────────── */}
  {activeTab === "voortgang" && (
    <div style={{ padding: "0 20px", paddingBottom: TAB_H + 32 }}>

      {/* Sectie 1 — Streak stats */}
      <div style={{ marginTop: 24, marginBottom: 32 }}>
        <p style={{ fontSize: 10, letterSpacing: 2, color: C.textMuted, textTransform: "uppercase", marginBottom: 16 }}>Statistieken</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { label: "Huidige streak",   value: `🔥 ${streak}`,          sub: streak === 1 ? "dag" : "dagen" },
            { label: "Langste streak",   value: longestStreak,            sub: longestStreak === 1 ? "dag" : "dagen" },
            { label: "Totaal actief",    value: totalActiveDays,          sub: "dagen" },
            { label: "Succesratio",      value: `${successRatio}%`,       sub: "van alle dagen" },
          ].map(({ label, value, sub }) => (
            <div key={label} style={{ background: C.card, border: `1px solid ${C.borderSub}`, borderRadius: 12, padding: "16px 18px" }}>
              <p style={{ fontSize: 10, letterSpacing: 1.5, color: C.textMuted, textTransform: "uppercase", margin: "0 0 10px" }}>{label}</p>
              <p style={{ fontSize: 26, fontWeight: "bold", color: C.text, margin: 0 }}>{value}</p>
              <p style={{ fontSize: 11, color: C.textDim, margin: "4px 0 0" }}>{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sectie 2 — Gewicht trend */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <p style={{ fontSize: 10, letterSpacing: 2, color: C.textMuted, textTransform: "uppercase", margin: 0 }}>Gewicht</p>
          <PeriodSelector options={["7d", "30d", "90d"]} value={weightPeriod} onChange={setWeightPeriod} />
        </div>
        {weightChartData.length >= 2 ? (
          <div style={{ background: C.card, border: `1px solid ${C.borderSub}`, borderRadius: 12, padding: "20px 16px 12px" }}>
            {latestWeight && (
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 28, fontWeight: "bold", color: C.text }}>{parseMetricValue(latestWeight.waarde)} kg</span>
                <span style={{ fontSize: 12, color: C.textMuted, marginLeft: 10 }}>{fmtShortDate(latestWeight.datum)}</span>
              </div>
            )}
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={weightChartData} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
                <XAxis dataKey="label" tick={{ fill: C.textDim, fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis domain={["auto", "auto"]} tick={{ fill: C.textDim, fontSize: 9 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip content={<ChartTooltip />} />
                {doelGewicht && (
                  <ReferenceLine y={doelGewicht} stroke="#555" strokeDasharray="4 2"
                    label={{ value: `doel ${doelGewicht}kg`, fill: "#666", fontSize: 9, position: "insideTopRight" }} />
                )}
                <Line type="monotone" dataKey="value" stroke={GREEN} strokeWidth={2} dot={{ fill: GREEN, r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: GREEN }} />
                <Line type="monotone" dataKey="trend" stroke="#555" strokeWidth={1} strokeDasharray="4 2" dot={false} activeDot={false} />
              </LineChart>
            </ResponsiveContainer>
            {weightTrendDelta !== null && (
              <p style={{ fontSize: 11, color: C.textDim, marginTop: 12, textAlign: "right" }}>
                Trend:{" "}
                <span style={{ color: weightTrendDelta < 0 ? GREEN : weightTrendDelta > 0 ? "#ef4444" : C.textMuted, fontWeight: "bold" }}>
                  {weightTrendDelta > 0 ? "↑" : weightTrendDelta < 0 ? "↓" : "→"} {Math.abs(weightTrendDelta)}kg
                </span>
                {" "}in {weightPeriod === "7d" ? "7 dagen" : weightPeriod === "30d" ? "30 dagen" : "90 dagen"}
              </p>
            )}
          </div>
        ) : (
          <div style={{ background: C.card, border: `1px solid ${C.borderSub}`, borderRadius: 12, padding: 24, textAlign: "center" }}>
            <p style={{ color: C.textMuted, fontSize: 14, lineHeight: 1.6 }}>
              Stuur je gewicht via WhatsApp<br/>om je trend bij te houden
            </p>
            <p style={{ color: C.textDim, fontSize: 12, marginTop: 8 }}>bijv. "76kg"</p>
          </div>
        )}
      </div>

      {/* Sectie 3 — Voeding trend */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <p style={{ fontSize: 10, letterSpacing: 2, color: C.textMuted, textTransform: "uppercase", margin: 0 }}>Voeding</p>
          <PeriodSelector options={["7d", "30d"]} value={kcalPeriod} onChange={setKcalPeriod} />
        </div>
        {kcalChartData.length >= 1 ? (
          <div style={{ background: C.card, border: `1px solid ${C.borderSub}`, borderRadius: 12, padding: "20px 16px 12px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 28, fontWeight: "bold", color: C.text }}>{avgKcal}</span>
              <span style={{ fontSize: 12, color: C.textMuted }}>gem. kcal / dag</span>
              {kcalDoel && (
                <span style={{ fontSize: 12, color: C.textDim, marginLeft: 8 }}>
                  doel <span style={{ color: avgKcal >= parseInt(kcalDoel) * 0.9 ? GREEN : "#ef4444" }}>{kcalDoel}</span>
                </span>
              )}
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={kcalChartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barSize={kcalChartData.length > 15 ? 6 : 12}>
                <XAxis dataKey="label" tick={{ fill: C.textDim, fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis domain={["auto", "auto"]} tick={{ fill: C.textDim, fontSize: 9 }} axisLine={false} tickLine={false} width={36} />
                <Tooltip content={<ChartTooltip />} />
                {kcalDoel && parseInt(kcalDoel) > 0 && (
                  <ReferenceLine y={parseInt(kcalDoel)} stroke="#555" strokeDasharray="4 2"
                    label={{ value: "doel", fill: "#555", fontSize: 9, position: "insideTopRight" }} />
                )}
                <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                  {kcalChartData.map((d, i) => (
                    <Cell key={i} fill={kcalDoel && parseInt(kcalDoel) > 0
                      ? (d.value >= parseInt(kcalDoel) ? GREEN : "#ef444466")
                      : GREEN} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ background: C.card, border: `1px solid ${C.borderSub}`, borderRadius: 12, padding: 24, textAlign: "center" }}>
            <p style={{ color: C.textMuted, fontSize: 14, lineHeight: 1.6 }}>
              Stuur je dagelijkse kcal via WhatsApp<br/>om bij te houden
            </p>
            <p style={{ color: C.textDim, fontSize: 12, marginTop: 8 }}>bijv. "2000 kcal"</p>
          </div>
        )}
      </div>

      {/* Sectie 4 — Commitments 8-weken grid */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 10, letterSpacing: 2, color: C.textMuted, textTransform: "uppercase", marginBottom: 16 }}>Afgelopen 8 weken</p>
        <div style={{ background: C.card, border: `1px solid ${C.borderSub}`, borderRadius: 12, padding: "16px 14px" }}>
          {(() => {
            const scoreMap = {}
            progressHistory.forEach(d => { scoreMap[d.date.split("T")[0]] = Number(d.score) })

            const today    = getNLDate()
            const todayD   = new Date(today)
            const dow      = todayD.getDay()
            const daysToMon = dow === 0 ? 6 : dow - 1
            const thisMonday = new Date(todayD)
            thisMonday.setDate(todayD.getDate() - daysToMon)

            const startMonday = new Date(thisMonday)
            startMonday.setDate(thisMonday.getDate() - 49)

            const weeks = Array.from({ length: 8 }, (_, w) =>
              Array.from({ length: 7 }, (_, d) => {
                const date = new Date(startMonday)
                date.setDate(startMonday.getDate() + w * 7 + d)
                return date.toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" })
              })
            )

            const dagNamen = ["ma", "di", "wo", "do", "vr", "za", "zo"]
            return (
              <>
                {/* Header row */}
                <div style={{ display: "grid", gridTemplateColumns: "40px repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
                  <div />
                  {dagNamen.map(d => (
                    <div key={d} style={{ textAlign: "center", fontSize: 9, color: C.textDim, textTransform: "uppercase" }}>{d}</div>
                  ))}
                </div>
                {/* Week rows */}
                {weeks.map((week, wi) => {
                  const pastDays = week.filter(date => date <= today && scoreMap[date] !== undefined)
                  const weekScore = pastDays.length > 0
                    ? Math.round(pastDays.filter(date => scoreMap[date] > 0).length / pastDays.length * 100)
                    : null
                  const weekLabel = wi === 7 ? "nu" : `−${7 - wi}w`
                  return (
                    <div key={wi} style={{ display: "grid", gridTemplateColumns: "40px repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center", paddingRight: 6 }}>
                        <span style={{ fontSize: 9, color: C.textDim }}>{weekLabel}</span>
                        {weekScore !== null && (
                          <span style={{ fontSize: 8, marginTop: 1, color: weekScore >= 80 ? GREEN : weekScore >= 50 ? "#f97316" : "#ef4444" }}>
                            {weekScore}%
                          </span>
                        )}
                      </div>
                      {week.map(date => {
                        const isFuture = date > today
                        const score    = scoreMap[date]
                        const hasDone  = !isFuture && score !== undefined && score > 0
                        const hasMiss  = !isFuture && score !== undefined && score === 0
                        const bg = isFuture ? "transparent"
                          : hasDone ? "#0a1a0f"
                          : hasMiss ? "#1f0f0f"
                          : C.cardAlt
                        const border = isFuture ? `1px dashed ${C.borderSub}`
                          : hasDone ? `1px solid #1a4d2a`
                          : hasMiss ? `1px solid #3d1a1a`
                          : `1px solid ${C.borderSub}`
                        return (
                          <div key={date} title={date} style={{ height: 24, borderRadius: 5, background: bg, border, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {hasDone && <span style={{ color: GREEN, fontSize: 10, fontWeight: "bold" }}>✓</span>}
                            {hasMiss && <span style={{ color: "#7a2020", fontSize: 11, fontWeight: "bold" }}>×</span>}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
                <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                  {[["#0a1a0f", "#1a4d2a", "Gedaan"], ["#1f0f0f", "#3d1a1a", "Gemist"], [C.cardAlt, C.borderSub, "Geen data"]].map(([bg, bd, label]) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: bg, border: `1px solid ${bd}` }} />
                      <span style={{ fontSize: 10, color: C.textDim }}>{label}</span>
                    </div>
                  ))}
                </div>
              </>
            )
          })()}
        </div>
      </div>

    </div>
  )}

  {/* ── TAB: COACH ───────────────────────────────────────────── */}
  {activeTab === "coach" && (
    <div style={{ display: "flex", flexDirection: "column", height: `calc(100vh - 64px - ${TAB_H}px)`, padding: "0 20px" }}>
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 16 }}>
        {chatMessages.length === 0 ? (
          <div style={{ paddingTop: 24 }}>
            <p style={{ color: C.textMuted, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>Coach</p>
            <p style={{ color: C.textSub, fontSize: 15, marginBottom: 28, lineHeight: 1.6 }}>
              Hoi — ik ben je AXIS coach. Stel me een vraag of kies een onderwerp.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {suggestions.map(s => (
                <button key={s} onClick={() => sendChat(s)}
                  style={{ padding: "8px 14px", borderRadius: 20, border: `1px solid ${C.border}`, background: C.card, color: C.textSub, fontSize: 13, cursor: "pointer" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ paddingTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
            {chatMessages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                  style={{
                    maxWidth: "80%", padding: "12px 16px",
                    borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    background: msg.role === "user" ? GREEN : C.card,
                    color: msg.role === "user" ? "#000" : C.text,
                    fontSize: 14, lineHeight: 1.5,
                    border: msg.role === "assistant" ? `1px solid ${C.borderSub}` : "none",
                  }}
                />
              </div>
            ))}
            {chatLoading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ padding: "12px 16px", borderRadius: "18px 18px 18px 4px", background: C.card, border: `1px solid ${C.borderSub}`, color: C.textMuted, fontSize: 14 }}>
                  ...
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>
        )}
      </div>
    </div>
  )}

  {/* ── FLOATING INPUT: COMMITMENT ───────────────────────────── */}
  {activeTab === "vandaag" && (
    <div style={{ position: "fixed", bottom: TAB_H, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 420, padding: "12px 16px", background: C.bg, borderTop: `1px solid ${C.borderSub}`, display: "flex", gap: 10, alignItems: "center" }}>
      <input value={text} onChange={e => setText(e.target.value)}
        onKeyDown={e => e.key === "Enter" && text && addCommitment()}
        placeholder="Voeg een commitment toe..."
        style={{ flex: 1, padding: "12px 16px", borderRadius: 24, border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: 14, outline: "none" }}
      />
      <button onClick={() => addCommitment()} style={{ width: 44, height: 44, borderRadius: "50%", border: "none", background: text ? GREEN : C.card, cursor: "pointer", fontSize: 22, color: text ? "#000" : C.textMuted, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.2s" }}>
        +
      </button>
    </div>
  )}

  {/* ── FLOATING INPUT: CHAT ─────────────────────────────────── */}
  {activeTab === "coach" && (
    <div style={{ position: "fixed", bottom: TAB_H, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 420, padding: "12px 16px", background: C.bg, borderTop: `1px solid ${C.borderSub}`, display: "flex", gap: 10, alignItems: "center" }}>
      <input value={chatInput} onChange={e => setChatInput(e.target.value)}
        onKeyDown={e => e.key === "Enter" && sendChat()}
        placeholder="Stel een vraag..."
        style={{ flex: 1, padding: "12px 16px", borderRadius: 24, border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: 14, outline: "none" }}
      />
      <button onClick={() => sendChat()} disabled={chatLoading}
        style={{ width: 44, height: 44, borderRadius: "50%", border: "none", background: chatInput ? GREEN : C.card, cursor: chatInput ? "pointer" : "default", fontSize: 18, color: chatInput ? "#000" : C.textMuted, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.2s" }}>
        ↑
      </button>
    </div>
  )}

  {/* ── TAB: WORKOUT ─────────────────────────────────────────── */}
  {activeTab === "workout" && (
    <div style={{ padding: "0 20px", paddingBottom: TAB_H + 32 }}>

      {workoutLoading ? (
        <p style={{ color: C.textMuted, fontSize: 14, textAlign: "center", paddingTop: 40 }}>Laden...</p>
      ) : (
        <>
          {/* ── OVERVIEW ── */}
          {workoutScreen === "overview" && (
            <>
              {todayWorkout ? (
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 14 }}>
                    <div>
                      <p style={{ color: C.textMuted, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Vandaag</p>
                      <h3 style={{ color: C.text, fontSize: 18, fontWeight: "bold", margin: 0 }}>{todayWorkout.workout?.naam}</h3>
                      {todayWorkout.workout?.dag_type && (
                        <p style={{ color: C.textMuted, fontSize: 13, marginTop: 2 }}>{todayWorkout.workout.dag_type}</p>
                      )}
                    </div>
                    {todayWorkout.gedaan && (
                      <span style={{ background: "#0a1a0f", color: GREEN, fontSize: 12, padding: "4px 10px", borderRadius: 20, fontWeight: "bold" }}>✓ Klaar</span>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                    {[...(todayWorkout.workout?.workout_oefeningen || [])]
                      .sort((a, b) => (a.volgorde || 0) - (b.volgorde || 0))
                      .map(wo => (
                        <div key={wo.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ color: C.textSub, fontSize: 14 }}>{wo.oefening?.naam}</span>
                          <span style={{ color: C.textMuted, fontSize: 12 }}>{wo.sets}×{wo.reps}</span>
                        </div>
                      ))
                    }
                  </div>
                  {!todayWorkout.gedaan ? (
                    <>
                      <button onClick={startWorkout} style={{ width: "100%", padding: 14, background: GREEN, border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer", fontSize: 15, color: "#000" }}>
                        Start workout →
                      </button>
                      <button onClick={cancelWorkout} style={{ width: "100%", marginTop: 8, padding: 10, background: "transparent", border: "none", color: C.textDim, cursor: "pointer", fontSize: 12 }}>
                        ✕ Workout annuleren
                      </button>
                    </>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <button onClick={async () => {
                        await supabase.from("workout_planning").update({ gedaan: false }).eq("id", todayWorkout.id)
                        setTodayWorkout(prev => ({ ...prev, gedaan: false }))
                        setSetLogs({})
                        startWorkoutFromPlanning({ ...todayWorkout, gedaan: false })
                      }} style={{ width: "100%", padding: 14, background: GREEN, border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer", fontSize: 15, color: "#000" }}>
                        Opnieuw doen →
                      </button>
                      <button onClick={() => setWorkoutScreen("done")} style={{ width: "100%", padding: 12, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, color: C.textSub, cursor: "pointer", fontSize: 14 }}>
                        Bekijk samenvatting
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "32px 0 24px" }}>
                  <p style={{ color: C.textMuted, fontSize: 15, marginBottom: 6 }}>Geen workout gepland vandaag</p>
                  <p style={{ color: C.textDim, fontSize: 13, marginBottom: 20 }}>Kies zelf een workout om te beginnen</p>
                  <button onClick={() => setWorkoutScreen("picker")}
                    style={{ padding: "13px 28px", background: GREEN, border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer", fontSize: 15, color: "#000" }}>
                    Kies workout →
                  </button>
                </div>
              )}

              {weekWorkouts.length > 0 && (
                <div>
                  <p style={{ color: C.textMuted, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Deze week</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {weekWorkouts.map(wp => {
                      const isToday = wp.datum === getNLDate()
                      const dayNames = ["zo", "ma", "di", "wo", "do", "vr", "za"]
                      const dn = dayNames[new Date(wp.datum + "T12:00:00").getDay()]
                      return (
                        <div key={wp.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: isToday ? "#0a1a0f" : C.card, border: `1px solid ${isToday ? "#1a4d2a" : C.border}`, borderRadius: 8, padding: "10px 14px" }}>
                          <span style={{ color: isToday ? GREEN : C.textSub, fontSize: 13, fontWeight: isToday ? "bold" : "normal", minWidth: 60 }}>{dn} {fmtShortDate(wp.datum)}</span>
                          <span style={{ color: isToday ? GREEN : C.textMuted, fontSize: 13, flex: 1, textAlign: "right", marginRight: wp.gedaan ? 8 : 0 }}>{wp.workout?.naam || "—"}</span>
                          {wp.gedaan && <span style={{ color: GREEN, fontSize: 13 }}>✓</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── WORKOUT PICKER ── */}
          {workoutScreen === "picker" && (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button onClick={() => { setWorkoutScreen("overview"); setPickerSelected(null) }}
                    style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 13, padding: 0 }}>
                    ← Terug
                  </button>
                  <h3 style={{ color: C.text, fontSize: 18, margin: 0 }}>Kies een workout</h3>
                </div>
                {pickerSelected && (
                  <button onClick={() => chooseSelfWorkout(pickerSelected)}
                    style={{ padding: "10px 20px", background: GREEN, border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer", fontSize: 14, color: "#000" }}>
                    Start →
                  </button>
                )}
              </div>

              {workoutLibrary.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <p style={{ color: C.textMuted, fontSize: 14 }}>Geen workouts beschikbaar</p>
                  <p style={{ color: C.textDim, fontSize: 12, marginTop: 6 }}>Herlaad de pagina als dit onverwacht is</p>
                </div>
              ) : (() => {
                console.log("[WorkoutPicker] library:", workoutLibrary.length, "openSections:", openSections, "trainingLocation:", trainingLocation)
                const niveauMatchMap = { "Gym": ["gym"], "Thuis": ["homegym", "lichaamsgewicht"], "Buiten": ["lichaamsgewicht"], "Wisselend": null }
                const defaultOpen = niveauMatchMap[trainingLocation] || null
                const niveauMeta = {
                  gym:             { label: "Gym",             icon: "🏋️" },
                  homegym:         { label: "Home Gym",        icon: "🏠" },
                  lichaamsgewicht: { label: "Lichaamsgewicht", icon: "💪" },
                }
                const ORDER = ["gym", "homegym", "lichaamsgewicht"]
                const grouped = {}
                for (const w of workoutLibrary) {
                  const n = w.niveau || "overig"
                  if (!grouped[n]) grouped[n] = []
                  grouped[n].push(w)
                }
                const getSectionOpen = (niveau) => {
                  const key = `lib_${niveau}`
                  if (openSections && key in openSections) return openSections[key]
                  if (!trainingLocation) return true
                  return !defaultOpen || defaultOpen.includes(niveau)
                }
                const toggleSection = (niveau) => {
                  const key = `lib_${niveau}`
                  const current = getSectionOpen(niveau)
                  setOpenSections(prev => ({ ...(prev || {}), [key]: !current }))
                }

                const niveaux = ORDER.filter(n => grouped[n]?.length > 0)
                return niveaux.map(niveau => {
                  const meta = niveauMeta[niveau] || { label: niveau, icon: "" }
                  const open = getSectionOpen(niveau)
                  const workouts = grouped[niveau] || []
                  return (
                    <div key={niveau} style={{ marginBottom: 16 }}>
                      <button onClick={() => toggleSection(niveau)}
                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", padding: "8px 0", marginBottom: open ? 10 : 0 }}>
                        <span style={{ color: C.textMuted, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", fontWeight: "bold" }}>
                          {meta.icon} {meta.label}
                        </span>
                        <span style={{ color: C.textDim, fontSize: 12 }}>{open ? "▲" : "▼"}</span>
                      </button>
                      {open && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {workouts.map(w => {
                            const isSelected = pickerSelected === w.id
                            return (
                              <button key={w.id} onClick={() => setPickerSelected(isSelected ? null : w.id)}
                                style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: isSelected ? "#0a1a0f" : C.card, border: `2px solid ${isSelected ? GREEN : C.border}`, borderRadius: 10, cursor: "pointer", textAlign: "left" }}>
                                <div>
                                  <p style={{ color: isSelected ? GREEN : C.text, fontSize: 14, fontWeight: "bold", margin: 0 }}>{w.naam}</p>
                                  <p style={{ color: C.textMuted, fontSize: 12, marginTop: 3 }}>
                                    {(w.workout_oefeningen || []).length} oefeningen
                                  </p>
                                </div>
                                {isSelected
                                  ? <span style={{ color: GREEN, fontSize: 18 }}>✓</span>
                                  : <span style={{ color: C.textDim, fontSize: 18 }}>○</span>
                                }
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })
              })()}

              {pickerSelected && (
                <div style={{ position: "sticky", bottom: TAB_H + 12, marginTop: 16 }}>
                  <button onClick={() => chooseSelfWorkout(pickerSelected)}
                    style={{ width: "100%", padding: 14, background: GREEN, border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer", fontSize: 15, color: "#000" }}>
                    Start workout →
                  </button>
                </div>
              )}
            </>
          )}

          {/* ── ACTIVE WORKOUT ── */}
          {workoutScreen === "active" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <div style={{ display: "flex", gap: 12, marginBottom: 4 }}>
                    <button onClick={() => setWorkoutScreen("overview")} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 13, padding: 0 }}>← Terug</button>
                    <button onClick={cancelWorkout} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 13, padding: 0 }}>✕ Annuleer</button>
                  </div>
                  <h3 style={{ color: C.text, fontSize: 18, margin: 0 }}>{todayWorkout?.workout?.naam}</h3>
                </div>
                <button onClick={finishWorkout} style={{ background: GREEN, border: "none", borderRadius: 8, padding: "8px 16px", color: "#000", fontWeight: "bold", fontSize: 13, cursor: "pointer" }}>
                  Klaar
                </button>
              </div>

              {[...(todayWorkout?.workout?.workout_oefeningen || [])]
                .sort((a, b) => (a.volgorde || 0) - (b.volgorde || 0))
                .map(wo => {
                  const oe = wo.oefening
                  if (!oe) return null
                  const sets = setLogs[oe.id] || []
                  const prev = prevWeights[oe.id]
                  return (
                    <div key={wo.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 10 }}>
                        <div>
                          <h4 style={{ color: C.text, fontSize: 15, fontWeight: "bold", margin: 0 }}>{oe.naam}</h4>
                          <p style={{ color: C.textMuted, fontSize: 12, marginTop: 2, marginBottom: 0 }}>{oe.spiergroep}</p>
                        </div>
                        {oe.youtube_url && (!fitnessLevel || fitnessLevel.toLowerCase() === "beginner") && (
                          <a href={oe.youtube_url} target="_blank" rel="noopener noreferrer"
                            style={{ background: "#1a0a0a", border: "1px solid #4a1a1a", borderRadius: 6, padding: "5px 10px", color: "#ef4444", fontSize: 11, fontWeight: "bold", textDecoration: "none", whiteSpace: "nowrap" }}>
                            ▶ Video
                          </a>
                        )}
                      </div>
                      {oe.instructies?.length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                          <button onClick={() => setOpenSections(prev => ({ ...prev, [`${oe.id}_instructies`]: !prev[`${oe.id}_instructies`] }))}
                            style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, fontSize: 12, padding: 0, display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ fontSize: 10 }}>{openSections[`${oe.id}_instructies`] ? "▲" : "▼"}</span>
                            Hoe doe je dit?
                          </button>
                          {openSections[`${oe.id}_instructies`] && (
                            <ul style={{ margin: "6px 0 0 0", paddingLeft: 16 }}>
                              {oe.instructies.map((stap, i) => (
                                <li key={i} style={{ color: C.textSub, fontSize: 12, marginBottom: 3 }}>{stap}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                      {oe.fouten?.length > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          <button onClick={() => setOpenSections(prev => ({ ...prev, [`${oe.id}_fouten`]: !prev[`${oe.id}_fouten`] }))}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#f97316", fontSize: 12, padding: 0, display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ fontSize: 10 }}>{openSections[`${oe.id}_fouten`] ? "▲" : "▼"}</span>
                            Let op
                          </button>
                          {openSections[`${oe.id}_fouten`] && (
                            <ul style={{ margin: "6px 0 0 0", paddingLeft: 16 }}>
                              {oe.fouten.map((fout, i) => (
                                <li key={i} style={{ color: "#f97316", fontSize: 12, marginBottom: 3 }}>{fout}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                      {prev && (
                        <p style={{ color: C.textMuted, fontSize: 12, marginBottom: 10 }}>Vorige keer: {prev} kg</p>
                      )}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "24px 1fr 1fr 36px", gap: 6, paddingBottom: 2 }}>
                          <span style={{ color: C.textDim, fontSize: 11 }}>#</span>
                          <span style={{ color: C.textDim, fontSize: 11 }}>Reps</span>
                          <span style={{ color: C.textDim, fontSize: 11 }}>Kg</span>
                          <span></span>
                        </div>
                        {sets.map((s, si) => (
                          <div key={si} style={{ display: "grid", gridTemplateColumns: "24px 1fr 1fr 36px", gap: 6, alignItems: "center" }}>
                            <span style={{ color: s.done ? GREEN : C.textMuted, fontSize: 14, fontWeight: "bold" }}>{si + 1}</span>
                            <input type="number" value={s.reps} placeholder={wo.reps || "—"}
                              onChange={e => setSetLogs(prev => { const u = [...(prev[oe.id] || [])]; u[si] = { ...u[si], reps: e.target.value }; return { ...prev, [oe.id]: u } })}
                              style={{ padding: "7px 10px", borderRadius: 6, border: `1px solid ${s.done ? GREEN : C.inputBorder}`, background: C.inputBg, color: C.text, fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" }}
                            />
                            <input type="number" value={s.gewicht} placeholder="0"
                              onChange={e => setSetLogs(prev => { const u = [...(prev[oe.id] || [])]; u[si] = { ...u[si], gewicht: e.target.value }; return { ...prev, [oe.id]: u } })}
                              style={{ padding: "7px 10px", borderRadius: 6, border: `1px solid ${s.done ? GREEN : C.inputBorder}`, background: C.inputBg, color: C.text, fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" }}
                            />
                            <button onClick={() => setSetLogs(prev => { const u = [...(prev[oe.id] || [])]; u[si] = { ...u[si], done: !u[si].done }; return { ...prev, [oe.id]: u } })}
                              style={{ width: 36, height: 36, borderRadius: 8, border: `2px solid ${s.done ? GREEN : C.inputBorder}`, background: s.done ? "#0a1a0f" : "transparent", cursor: "pointer", color: GREEN, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {s.done ? "✓" : ""}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })
              }

              <button onClick={finishWorkout} style={{ width: "100%", padding: 14, background: GREEN, border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer", fontSize: 15, color: "#000", marginTop: 4 }}>
                Workout afronden ✓
              </button>
            </>
          )}

          {/* ── DONE ── */}
          {workoutScreen === "done" && (
            <>
              <div style={{ textAlign: "center", padding: "32px 0 24px" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>💪</div>
                <h3 style={{ color: GREEN, fontSize: 22, margin: 0 }}>Workout afgerond!</h3>
                {todayWorkout?.workout?.naam && (
                  <p style={{ color: C.textSub, fontSize: 14, marginTop: 8 }}>{todayWorkout.workout.naam}</p>
                )}
              </div>
              {(() => {
                const allSets = Object.values(setLogs).flat()
                const doneSets = allSets.filter(s => s.done)
                const volume = Math.round(doneSets.reduce((sum, s) => sum + (parseFloat(s.gewicht) || 0) * (parseInt(s.reps) || 0), 0))
                return doneSets.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, textAlign: "center" }}>
                      <p style={{ color: GREEN, fontSize: 28, fontWeight: "bold", margin: 0 }}>{doneSets.length}</p>
                      <p style={{ color: C.textMuted, fontSize: 12, marginTop: 4 }}>sets voltooid</p>
                    </div>
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, textAlign: "center" }}>
                      <p style={{ color: GREEN, fontSize: 28, fontWeight: "bold", margin: 0 }}>{volume}</p>
                      <p style={{ color: C.textMuted, fontSize: 12, marginTop: 4 }}>kg volume</p>
                    </div>
                  </div>
                ) : null
              })()}
              <button onClick={() => setWorkoutScreen("overview")}
                style={{ width: "100%", padding: 12, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, color: C.textSub, cursor: "pointer", fontSize: 14 }}>
                ← Terug naar overzicht
              </button>
            </>
          )}
        </>
      )}

    </div>
  )}

  {/* ── TAB BAR ──────────────────────────────────────────────── */}
  <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 420, height: TAB_H, background: C.bg, borderTop: `1px solid ${C.borderSub}`, display: "flex", zIndex: 50 }}>

    {/* Vandaag */}
    <button onClick={() => setActiveTab("vandaag")}
      style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, background: "none", border: "none", cursor: "pointer" }}>
      <svg width={22} height={22} viewBox="0 0 22 22" fill="none">
        <circle cx={11} cy={11} r={9}
          stroke={activeTab === "vandaag" ? GREEN : "#666"} strokeWidth={1.5}
          fill={activeTab === "vandaag" ? "#0a1a0f" : "none"} />
        <path d="M7 11l3 3 5-5" stroke={activeTab === "vandaag" ? GREEN : "#666"} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span style={{ fontSize: 11, color: activeTab === "vandaag" ? GREEN : C.textMuted, fontWeight: activeTab === "vandaag" ? "bold" : "normal" }}>Vandaag</span>
    </button>

    {/* Voortgang */}
    <button onClick={() => setActiveTab("voortgang")}
      style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, background: "none", border: "none", cursor: "pointer" }}>
      <svg width={22} height={22} viewBox="0 0 22 22" fill="none">
        <polyline points="3,16 8,10 12,13 19,5"
          stroke={activeTab === "voortgang" ? GREEN : "#666"} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M17 5h2v2" stroke={activeTab === "voortgang" ? GREEN : "#666"} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span style={{ fontSize: 11, color: activeTab === "voortgang" ? GREEN : C.textMuted, fontWeight: activeTab === "voortgang" ? "bold" : "normal" }}>Voortgang</span>
    </button>

    {/* Workout */}
    <button onClick={() => setActiveTab("workout")}
      style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, background: "none", border: "none", cursor: "pointer" }}>
      <svg width={22} height={22} viewBox="0 0 22 22" fill="none">
        <path d="M3 11h2M17 11h2M5 11l2-3h8l2 3M5 11l2 3h8l2-3"
          stroke={activeTab === "workout" ? GREEN : "#666"} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={3} cy={11} r={1.5} stroke={activeTab === "workout" ? GREEN : "#666"} strokeWidth={1.5} />
        <circle cx={19} cy={11} r={1.5} stroke={activeTab === "workout" ? GREEN : "#666"} strokeWidth={1.5} />
      </svg>
      <span style={{ fontSize: 11, color: activeTab === "workout" ? GREEN : C.textMuted, fontWeight: activeTab === "workout" ? "bold" : "normal" }}>Workout</span>
    </button>

    {/* Coach */}
    <button onClick={() => setActiveTab("coach")}
      style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, background: "none", border: "none", cursor: "pointer" }}>
      <svg width={22} height={22} viewBox="0 0 22 22" fill="none">
        <path d="M4 4h14a1 1 0 011 1v9a1 1 0 01-1 1H7l-4 3V5a1 1 0 011-1z"
          stroke={activeTab === "coach" ? GREEN : "#666"} strokeWidth={1.5}
          strokeLinecap="round" strokeLinejoin="round"
          fill={activeTab === "coach" ? "#0a1a0f" : "none"} />
      </svg>
      <span style={{ fontSize: 11, color: activeTab === "coach" ? GREEN : C.textMuted, fontWeight: activeTab === "coach" ? "bold" : "normal" }}>Coach</span>
    </button>

  </div>

</div>
)

}
