"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"
import { calculateTDEE } from "../../lib/calculateTDEE"
import { normalizeWhatsapp } from "../../lib/whatsapp"
import { AxisLogo } from "../../components/AxisLogo"
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
const [reflectionSubmitted, setReflectionSubmitted] = useState(false)
const [reflectionDate,      setReflectionDate]      = useState("")
const [reflectionTekst,     setReflectionTekst]     = useState("")
const [showAll,         setShowAll]        = useState(false)
const [whatsappInput,   setWhatsappInput]  = useState("")
const [whatsappLinked,  setWhatsappLinked] = useState(false)
const [showSettings,    setShowSettings]   = useState(false)
const [weekCheckIns,    setWeekCheckIns]   = useState(new Set())
const [weekCommits,     setWeekCommits]    = useState(new Set())
const [theme,           setTheme]          = useState("dark")
const [activeTab,       setActiveTab]      = useState("vandaag")
const [selectedGoal,    setSelectedGoal]   = useState([])
const [onboardingName,  setOnboardingName]  = useState("")
const [currentWeightInput, setCurrentWeightInput] = useState("")
const [targetWeightInput,  setTargetWeightInput]  = useState("")
const [trainingLocation,   setTrainingLocation]   = useState("")
const [sportFrequentie,    setSportFrequentie]    = useState(0)
const [fitnessLevel,       setFitnessLevel]       = useState("")
const [chatMessages,    setChatMessages]   = useState([])
const [chatInput,       setChatInput]      = useState("")
const [chatLoading,     setChatLoading]    = useState(false)

const [userRole,        setUserRole]        = useState("")
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

const [tdeeForm,       setTdeeForm]       = useState({ weight_kg: "", height_cm: "", age: "", gender: "male", activity_level: "moderately_active" })
const [tdeeResult,     setTdeeResult]     = useState(null)
const [showTdeeForm,   setShowTdeeForm]   = useState(false)
const [savingTdee,     setSavingTdee]     = useState(false)

const [userName,       setUserName]       = useState("")
const [showAddCommit,  setShowAddCommit]  = useState(false)

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
const [prevSets,         setPrevSets]         = useState({})
const [workoutLoading,   setWorkoutLoading]   = useState(false)
const [workoutLibrary,   setWorkoutLibrary]   = useState([])
const [pickerSelected,   setPickerSelected]   = useState(null)
const [openSections,     setOpenSections]     = useState({})
const [myWorkouts,       setMyWorkouts]       = useState([])
const [coachWorkouts,    setCoachWorkouts]    = useState([])
const [builderNaam,      setBuilderNaam]      = useState("")
const [builderItems,     setBuilderItems]     = useState([])
const [builderSearch,    setBuilderSearch]    = useState("")
const [builderResults,   setBuilderResults]   = useState([])
const [builderSaving,    setBuilderSaving]    = useState(false)

const chatBottomRef = useRef(null)
const messagesEndRef = useRef(null)
const scrollRef = useRef(null)
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
const handleReflection = async (gehaald) => {
  const today = getNLDate()
  const payload = {
    user_id:   user.id,
    datum:     today,
    gehaald,
    completed: true,
    answer:    gehaald ? "ja" : "nee",
    tekst:     reflectionTekst || null,
  }
  console.log("[handleReflection] insert payload:", payload)
  const { data, error } = await supabase.from("reflections").insert([payload]).select()
  console.log("[handleReflection] insert data:", data, "| error:", error?.message ?? "geen")
  if (error) { console.error("Reflectie opslaan mislukt:", error.message); return }
  setReflectionSubmitted(true)
  setReflectionDate(today)
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
    const today = getNLDate()
    if (reflectionDate && reflectionDate !== today) {
      setReflectionSubmitted(false)
      setReflectionDate("")
      setReflectionTekst("")
    }
    const { data: existingReflection, error: reflErr } = await supabase
      .from("reflections")
      .select("id")
      .eq("user_id", user.id)
      .eq("datum", today)
      .maybeSingle()
    console.log("[loadReflection] today:", today, "| user.id:", user.id, "| gevonden:", existingReflection, "| error:", reflErr?.message ?? "geen")
    if (existingReflection) {
      setReflectionSubmitted(true)
      setReflectionDate(today)
    }
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
  const { data } = await supabase.from("users").select("goal, training_location, fitness_level, sport_frequentie, kcal_doel, eiwitten_doel, koolhydraten_doel, vetten_doel, doelen_door_coach, target_weight, role, height_cm, gender, age, activity_level, name").eq("auth_user_id", user.id).maybeSingle()
  console.log("[checkFirstUse] goal:", data?.goal ?? "NULL", "| role:", data?.role ?? "NULL")
  if (data?.name)              setUserName(data.name.trim().split(/\s+/)[0])
  if (data?.role)              setUserRole(data.role)
  if (data?.training_location) setTrainingLocation(data.training_location)
  if (data?.fitness_level)     setFitnessLevel(data.fitness_level)
  if (data?.sport_frequentie)  setSportFrequentie(data.sport_frequentie)
  if (data?.kcal_doel)         setKcalDoel(String(data.kcal_doel))
  if (data?.eiwitten_doel)     setEiwittenDoel(String(data.eiwitten_doel))
  if (data?.koolhydraten_doel) setKoolhydratenDoel(String(data.koolhydraten_doel))
  if (data?.vetten_doel)       setVettenDoel(String(data.vetten_doel))
  if (data?.doelen_door_coach) setDoelenDoorCoach(!!data.doelen_door_coach)
  if (data?.target_weight)     setDoelGewicht(data.target_weight)
  setTdeeForm(prev => ({
    ...prev,
    height_cm:      data?.height_cm      ? String(data.height_cm)      : prev.height_cm,
    age:            data?.age            ? String(data.age)            : prev.age,
    gender:         data?.gender         ?? prev.gender,
    activity_level: data?.activity_level ?? prev.activity_level,
  }))
  if (data?.role === "coach" || data?.role === "b2c") return  // coaches en b2c-gebruikers slaan home onboarding over
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

function handleCalculateTdee() {
  const { weight_kg, height_cm, age, gender, activity_level } = tdeeForm
  if (!weight_kg || !height_cm || !age) return
  const result = calculateTDEE({
    weight_kg:      parseFloat(weight_kg),
    height_cm:      parseFloat(height_cm),
    age:            parseInt(age),
    gender,
    activity_level,
  })
  setTdeeResult(result)
  setKcalDoel(String(result.tdee))
  setEiwittenDoel(String(result.eiwitten))
  setKoolhydratenDoel(String(result.koolhydraten))
  setVettenDoel(String(result.vetten))
}

async function saveTdeeAsGoals() {
  if (!tdeeResult || savingTdee) return
  setSavingTdee(true)
  await supabase.from("users").update({
    height_cm:          parseFloat(tdeeForm.height_cm) || null,
    gender:             tdeeForm.gender,
    age:                parseInt(tdeeForm.age) || null,
    activity_level:     tdeeForm.activity_level,
    tdee_value:         tdeeResult.tdee,
    kcal_doel:          tdeeResult.tdee,
    eiwitten_doel:      tdeeResult.eiwitten,
    koolhydraten_doel:  tdeeResult.koolhydraten,
    vetten_doel:        tdeeResult.vetten,
  }).eq("auth_user_id", user.id)
  setSavingTdee(false)
  setShowNutritionModal(false)
  setShowTdeeForm(false)
  setTdeeResult(null)
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
}

async function loadWeekData() {
  const monday = getMondayNL()
  const today  = getNLDate()
  const { data: userData } = await supabase
    .from("users").select("id, missed_days, streak").eq("auth_user_id", user.id).single()
  if (userData?.missed_days != null) setMissedDays(userData.missed_days)
  if (userData?.streak != null) setStreak(userData.streak)
  const pid = userData?.id
  setPublicUserId(pid)
  if (pid) { loadReminders(pid); loadChatHistory(pid) }
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

async function loadChatHistory(publicUserId) {
  if (!publicUserId) return
  const { data, error } = await supabase
    .from("conversations")
    .select("role, content, created_at")
    .eq("user_id", publicUserId)
    .order("created_at", { ascending: true })
    .limit(20)
  if (error) { console.error("Chat history ophalen mislukt:", error.message); return }
  if (!data?.length) return
  setChatMessages(prev => prev.length > 0 ? prev : data.map(row => ({
    role: row.role,
    content: row.content,
    time: row.created_at
      ? new Date(row.created_at).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })
      : undefined,
  })))
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

    const { data: profile } = await supabase.from("users").select("id, coach_email").eq("auth_user_id", user.id).maybeSingle()

    const [{ data: planning, error: planErr }, { data: weekPlan }, { data: libraryData, error: libErr }, { data: personalData, error: personalErr }, { data: coachData, error: coachErr }] = await Promise.all([
      supabase.from("workout_planning")
        .select(PLANNING_SELECT)
        .eq("user_id", user.id).eq("datum", today).maybeSingle(),
      supabase.from("workout_planning")
        .select(`id, datum, gedaan, workout:workout_id ( naam, dag_type )`)
        .eq("user_id", user.id).gte("datum", monday).lte("datum", sunday)
        .order("datum", { ascending: true }),
      supabase.from("workouts")
        .select(`id, naam, niveau, dag_type, schema_type, created_by, visibility, workout_oefeningen ( id )`)
        .eq("visibility", "template")
        .order("naam", { ascending: true }),
      supabase.from("workouts")
        .select(`id, naam, niveau, dag_type, schema_type, created_by, visibility, workout_oefeningen ( id )`)
        .eq("created_by", profile?.id)
        .eq("visibility", "personal"),
      profile?.coach_email
        ? supabase.from("workouts")
            .select(`id, naam, niveau, dag_type, schema_type, created_by, visibility, workout_oefeningen ( id )`)
            .eq("visibility", "coach")
            .eq("coach_email", profile.coach_email)
            .order("naam", { ascending: true })
        : Promise.resolve({ data: [] }),
    ])

    console.log("[loadWorkoutData] user.id:", user?.id, "user.email:", user?.email)
    console.log("[loadWorkoutData] profile:", profile)
    console.log("[loadWorkoutData] planning:", planning, "err:", planErr)
    console.log("[loadWorkoutData] library count:", libraryData?.length, "err:", libErr)
    console.log("[loadWorkoutData] personal count:", personalData?.length, "err:", personalErr)
    console.log("[loadWorkoutData] coach count:", coachData?.length, "err:", coachErr)

    setTodayWorkout(planning || null)
    setWeekWorkouts(weekPlan || [])
    setWorkoutLibrary(libraryData || [])
    setMyWorkouts(personalData || [])
    setCoachWorkouts(coachData || [])
    if (planning?.gedaan) setWorkoutScreen("done")

    if (planning?.workout?.workout_oefeningen?.length) {
      const ids = planning.workout.workout_oefeningen.map(wo => wo.oefening?.id).filter(Boolean)
      const { data: prev } = await supabase
        .from("workout_sets").select("oefening_id, gewicht, reps_gedaan, set_nummer, datum")
        .eq("user_id", user.id)
        .in("oefening_id", ids)
        .order("datum", { ascending: false })
        .order("set_nummer", { ascending: true })
      const weightMap = {}
      const setsMap = {}
      for (const s of prev || []) {
        if (!weightMap[s.oefening_id] && s.gewicht != null) weightMap[s.oefening_id] = s.gewicht
        if (!setsMap[s.oefening_id]) setsMap[s.oefening_id] = { date: s.datum, sets: [] }
        if (setsMap[s.oefening_id].date === s.datum) setsMap[s.oefening_id].sets.push(s)
      }
      const prevSetsMap = {}
      for (const [id, val] of Object.entries(setsMap)) prevSetsMap[id] = val.sets
      setPrevWeights(weightMap)
      setPrevSets(prevSetsMap)
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

// ── Schema builder ────────────────────────────────────────────

async function searchOefeningen(q) {
  setBuilderSearch(q)
  if (q.trim().length < 2) { setBuilderResults([]); return }
  const { data } = await supabase
    .from("oefeningen")
    .select("id, naam, spiergroep")
    .ilike("naam", `%${q}%`)
    .order("naam", { ascending: true })
    .limit(20)
  setBuilderResults(data || [])
}

function addBuilderOefening(oe) {
  if (builderItems.find(x => x.oefening_id === oe.id)) return
  setBuilderItems(prev => [...prev, { oefening_id: oe.id, naam: oe.naam, sets: 3, reps: 10 }])
  setBuilderSearch("")
  setBuilderResults([])
}

function removeBuilderOefening(id) {
  setBuilderItems(prev => prev.filter(x => x.oefening_id !== id))
}

function updateBuilderItem(id, field, val) {
  setBuilderItems(prev => prev.map(x => x.oefening_id === id ? { ...x, [field]: Math.max(1, Number(val) || 1) } : x))
}

async function saveBuilder() {
  if (!builderNaam.trim() || builderItems.length === 0 || !user) return
  setBuilderSaving(true)
  try {
    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle()
    const payload = {
      naam: builderNaam.trim(),
      created_by: user.id,
      visibility: "personal",
      is_template: false,
      niveau: "beginner",
      schema_type: "custom",
      dag_type: "custom",
    }
    console.log("[saveBuilder] insert payload:", payload)
    const { data: workout, error: wErr } = await supabase
      .from("workouts")
      .insert(payload)
      .select("id")
      .single()
    if (wErr) throw wErr
    const rows = builderItems.map((item, i) => ({
      workout_id: workout.id, oefening_id: item.oefening_id,
      sets: item.sets, reps: item.reps, volgorde: i + 1,
    }))
    const { error: oeErr } = await supabase.from("workout_oefeningen").insert(rows)
    if (oeErr) throw oeErr
    setBuilderNaam("")
    setBuilderItems([])
    const { data: fresh } = await supabase
      .from("workouts")
      .select("id, naam, niveau, dag_type, schema_type, created_by, visibility, workout_oefeningen(id)")
      .eq("created_by", user.id).eq("visibility", "personal")
    setMyWorkouts(fresh || [])
    setWorkoutScreen("picker")
  } catch (err) {
    console.error("saveBuilder error:", err)
    alert("Opslaan mislukt: " + err.message)
  } finally {
    setBuilderSaving(false)
  }
}

function getCoachSectionOpen() {
  if (openSections && "coach_schemas" in openSections) return openSections["coach_schemas"]
  return true
}
function toggleCoachSection() {
  setOpenSections(prev => ({ ...(prev || {}), coach_schemas: !getCoachSectionOpen() }))
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
  console.log("[cancelWorkout] todayWorkout.id:", todayWorkout.id, "| user.id:", user.id)
  const workoutNaam = todayWorkout.workout?.naam
  const { error: planErr } = await supabase.from("workout_planning").delete().eq("id", todayWorkout.id)
  console.log("[cancelWorkout] workout_planning delete:", planErr ? `ERROR: ${planErr.message} (${planErr.code})` : "OK")
  if (workoutNaam) {
    const { error: commitErr } = await supabase.from("commitments").delete()
      .eq("user_id", user.id).eq("date", getNLDate()).eq("text", `💪 ${workoutNaam}`)
    console.log("[cancelWorkout] commitments delete:", commitErr ? `ERROR: ${commitErr.message} (${commitErr.code})` : "OK")
  }
  setTodayWorkout(null)
  setSetLogs({})
  setWorkoutScreen("picker")
  loadCommitments()
  loadWeekData()
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
  if (todayWorkout.workout?.naam) {
    await supabase.from("commitments")
      .update({ done: true })
      .eq("user_id", user.id).eq("date", today).eq("text", `💪 ${todayWorkout.workout.naam}`)
  }
  setTodayWorkout(prev => ({ ...prev, gedaan: true }))
  setWorkoutScreen("done")
  loadCommitments()
}

function calculateProgress(list) {
  if (list.length === 0) { setProgress(0); return }
  const pct = Math.round(list.filter(c => c.done).length / list.length * 100)
  setProgress(pct)
  saveDailyScore(pct)
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
  const formatted = normalizeWhatsapp(number)
  const { data: existing } = await supabase.from("users")
    .select("id, auth_user_id")
    .eq("whatsapp_number", formatted)
    .maybeSingle()
  if (existing && existing.auth_user_id !== user.id) {
    alert("Dit nummer is al gekoppeld aan een ander account.")
    return false
  }
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
  const now = new Date().toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })
  const newMessages = [...chatMessages, { role: "user", content: msg, time: now }]
  setChatMessages(newMessages)
  setChatLoading(true)
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })), streak, missedDays, commitment: todayCommitment, trainingLocation, fitnessLevel }),
    })
    const data = await res.json()
    const replyTime = new Date().toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })
    if (!res.ok || !data.content) throw new Error(data.error || "Geen antwoord ontvangen")
    setChatMessages(prev => [...prev, { role: "assistant", content: data.content, time: replyTime }])
  } catch (err) {
    console.error("[sendChat] fout:", err?.message, err)
    const replyTime = new Date().toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })
    setChatMessages(prev => [...prev, { role: "assistant", content: `Fout: ${err?.message || "onbekend"}. Probeer opnieuw.`, time: replyTime }])
  }
  setChatLoading(false)
}

useEffect(() => {
  setTimeout(() => {
    const container = scrollRef.current
    if (container) container.scrollTop = container.scrollHeight + 1000
  }, 100)
}, [chatMessages])

useEffect(() => {
  if (activeTab === "coach") {
    setTimeout(() => {
      const container = scrollRef.current
      if (container) container.scrollTop = container.scrollHeight + 1000
    }, 100)
  }
}, [activeTab])

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

        {/* Stap 1 — Doel kiezen (meerkeuze, optioneel) */}
        {onboardingStep === 1 && (
          <>
            <h2 style={{ marginBottom: 8, fontSize: 22, color: C.text }}>Wat is je doel?</h2>
            <p style={{ color: C.textSub, fontSize: 14, marginBottom: 24 }}>Kies één of meerdere doelen. Je kunt altijd wijzigen.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
              {GOALS.map(g => {
                const active = selectedGoal.includes(g)
                return (
                  <button key={g} onClick={() => setSelectedGoal(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])} style={{
                    padding: "10px 18px", borderRadius: 20, border: `2px solid ${active ? GREEN : C.inputBorder}`,
                    background: active ? "#0a1a0f" : C.inputBg,
                    color: active ? GREEN : C.text,
                    fontSize: 14, cursor: "pointer", fontWeight: active ? "bold" : "normal",
                  }}>
                    {active ? "✓ " : ""}{g}
                  </button>
                )
              })}
            </div>
            <button onClick={() => setOnboardingStep(2)} style={btnPrimary}>
              Volgende →
            </button>
            <button onClick={() => setOnboardingStep(2)} style={btnGhost}>Sla over</button>
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
            <button onClick={async () => { await saveGoalData(selectedGoal[0] || "", currentWeightInput, targetWeightInput); setOnboardingStep(4) }} style={btnPrimary}>
              Volgende →
            </button>
            <button onClick={async () => { await saveGoalData(selectedGoal[0] || "", null, null); setOnboardingStep(4) }} style={btnGhost}>
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
              if (trainingLocation) await supabase.from("users").update({ training_location: trainingLocation }).eq("auth_user_id", user.id)
              setOnboardingStep(5)
            }} style={btnPrimary}>
              Volgende →
            </button>
            <button onClick={() => setOnboardingStep(5)} style={btnGhost}>Sla over</button>
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
              if (sportFrequentie) await supabase.from("users").update({ sport_frequentie: sportFrequentie }).eq("auth_user_id", user.id)
              setOnboardingStep(6)
            }} style={btnPrimary}>
              Volgende →
            </button>
            <button onClick={() => setOnboardingStep(6)} style={btnGhost}>Sla over</button>
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
              if (fitnessLevel) await supabase.from("users").update({ fitness_level: fitnessLevel }).eq("auth_user_id", user.id)
              setOnboardingStep(7)
            }} style={btnPrimary}>
              Volgende →
            </button>
            <button onClick={() => setOnboardingStep(7)} style={btnGhost}>Sla over</button>
          </>
        )}

        {/* Stap 7 — Eerste commitment kiezen */}
        {onboardingStep === 7 && (
          <>
            <h2 style={{ marginBottom: 8, fontSize: 22, color: C.text }}>Wat ga jij vandaag doen?</h2>
            <p style={{ color: C.textSub, fontSize: 14, marginBottom: 20 }}>Kies een suggestie of typ je eigen commitment.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {(GOAL_SUGGESTIONS[selectedGoal[0]] || GOAL_SUGGESTIONS["Fitter worden"] || []).map(s => (
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
            <button onClick={() => setOnboardingStep(8)} style={btnGhost}>Sla over</button>
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
          <>
            <button onClick={() => { setShowTdeeForm(v => !v); setTdeeResult(null) }}
              style={{ width: "100%", marginTop: 16, padding: "10px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, color: C.textMuted, fontSize: 13, cursor: "pointer", textAlign: "left" }}>
              {showTdeeForm ? "▲ Bereken via TDEE" : "▼ Bereken via TDEE"}
            </button>
            {showTdeeForm && (
              <div style={{ marginTop: 12, padding: 16, background: C.cardAlt, borderRadius: 10, border: `1px solid ${C.border}` }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  {[
                    { label: "Gewicht (kg)", key: "weight_kg", placeholder: "bijv. 80" },
                    { label: "Lengte (cm)",  key: "height_cm", placeholder: "bijv. 180" },
                    { label: "Leeftijd",     key: "age",       placeholder: "bijv. 30" },
                  ].map(({ label, key, placeholder }) => (
                    <div key={key}>
                      <p style={{ color: C.textMuted, fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 5 }}>{label}</p>
                      <input type="number" value={tdeeForm[key]} placeholder={placeholder}
                        onChange={e => setTdeeForm(prev => ({ ...prev, [key]: e.target.value }))}
                        style={{ width: "100%", padding: "9px 10px", borderRadius: 7, border: `1px solid ${C.inputBorder}`, background: C.inputBg, color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                    </div>
                  ))}
                  <div>
                    <p style={{ color: C.textMuted, fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 5 }}>Geslacht</p>
                    <select value={tdeeForm.gender} onChange={e => setTdeeForm(prev => ({ ...prev, gender: e.target.value }))}
                      style={{ width: "100%", padding: "9px 10px", borderRadius: 7, border: `1px solid ${C.inputBorder}`, background: C.inputBg, color: C.text, fontSize: 13, outline: "none" }}>
                      <option value="male">Man</option>
                      <option value="female">Vrouw</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <p style={{ color: C.textMuted, fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 5 }}>Activiteitsniveau</p>
                  <select value={tdeeForm.activity_level} onChange={e => setTdeeForm(prev => ({ ...prev, activity_level: e.target.value }))}
                    style={{ width: "100%", padding: "9px 10px", borderRadius: 7, border: `1px solid ${C.inputBorder}`, background: C.inputBg, color: C.text, fontSize: 13, outline: "none" }}>
                    <option value="sedentary">Sedentair (weinig/geen sport)</option>
                    <option value="lightly_active">Licht actief (1-3x/week)</option>
                    <option value="moderately_active">Matig actief (3-5x/week)</option>
                    <option value="very_active">Zeer actief (6-7x/week)</option>
                  </select>
                </div>
                <button onClick={handleCalculateTdee} disabled={!tdeeForm.weight_kg || !tdeeForm.height_cm || !tdeeForm.age}
                  style={{ width: "100%", padding: "10px", background: (!tdeeForm.weight_kg || !tdeeForm.height_cm || !tdeeForm.age) ? C.card : C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: (!tdeeForm.weight_kg || !tdeeForm.height_cm || !tdeeForm.age) ? C.textDim : C.textSub, fontSize: 13, cursor: (!tdeeForm.weight_kg || !tdeeForm.height_cm || !tdeeForm.age) ? "default" : "pointer" }}>
                  Bereken
                </button>
                {tdeeResult && (
                  <div style={{ marginTop: 10, padding: "10px 12px", background: C.card, borderRadius: 8, border: `1px solid ${C.border}` }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                      {[
                        { label: "TDEE",         value: `${tdeeResult.tdee} kcal`, color: GREEN },
                        { label: "Eiwit",        value: `${tdeeResult.eiwitten}g`,     color: "#60a5fa" },
                        { label: "Koolh.",       value: `${tdeeResult.koolhydraten}g`, color: "#facc15" },
                        { label: "Vetten",       value: `${tdeeResult.vetten}g`,       color: "#f97316" },
                        { label: "BMR",          value: `${tdeeResult.bmr} kcal`,      color: C.textMuted },
                      ].map(({ label, value, color }) => (
                        <div key={label}>
                          <p style={{ color: C.textDim, fontSize: 9, margin: "0 0 2px" }}>{label}</p>
                          <p style={{ color, fontSize: 13, fontWeight: "bold", margin: 0 }}>{value}</p>
                        </div>
                      ))}
                    </div>
                    <p style={{ color: C.textDim, fontSize: 11, marginTop: 8, marginBottom: 0 }}>Ingevuld in je doelen — klik Opslaan om te bevestigen.</p>
                  </div>
                )}
              </div>
            )}
            <button onClick={tdeeResult ? saveTdeeAsGoals : saveNutritionGoals} disabled={!kcalDoel || savingGoals || savingTdee}
              style={{ width: "100%", marginTop: 16, padding: "13px", background: (!kcalDoel || savingGoals || savingTdee) ? C.cardAlt : GREEN, border: "none", borderRadius: 8, color: (!kcalDoel || savingGoals || savingTdee) ? C.textMuted : "#000", fontWeight: "bold", fontSize: 15, cursor: (!kcalDoel || savingGoals || savingTdee) ? "default" : "pointer" }}>
              {(savingGoals || savingTdee) ? "Opslaan..." : "Opslaan"}
            </button>
          </>
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
  {(() => {
    const nlHour = parseInt(new Date().toLocaleString("nl-NL", { hour: "numeric", hour12: false, timeZone: "Europe/Amsterdam" }))
    const greetWord = nlHour < 12 ? "Goedemorgen" : nlHour < 18 ? "Goedemiddag" : "Goedenavond"
    const greeting  = userName ? `${greetWord}, ${userName} 👋` : `${greetWord} 👋`
    const dateStr   = new Date().toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Amsterdam" })
    const dateDisplay = dateStr.charAt(0).toUpperCase() + dateStr.slice(1)
    return (
  <div style={{ padding: "8px 22px 22px", borderBottom: "1px solid #1f1f1f" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <div style={{ width: 8, height: 8, borderRadius: 2, background: GREEN }} />
        <span style={{ color: "#fff", fontSize: 16, fontWeight: "bold", letterSpacing: 2 }}>AXIS</span>
      </div>
      <div style={{ position: "relative" }}>
        <button onClick={() => setShowSettings(!showSettings)}
          style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 20, padding: "4px 8px" }}>
          ···
        </button>
        {showSettings && (
          <div style={{ position: "absolute", right: 0, top: 36, background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "6px 0", minWidth: 216, zIndex: 100, boxShadow: "0 8px 28px rgba(0,0,0,0.28)", overflow: "hidden" }}>
            <style>{`.ax-menu-btn { transition: background 0.12s; } .ax-menu-btn:hover { background: ${theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"} !important; }`}</style>

            {/* Coach Dashboard */}
            {userRole === "coach" && (
              <>
                <a href="/dashboard"
                  style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "9px 14px", background: "none", color: GREEN, fontSize: 13, boxSizing: "border-box", textDecoration: "none", fontWeight: "bold" }}>
                  <span style={{ fontSize: 14, width: 18, textAlign: "center" }}>📊</span>
                  <span style={{ textAlign: "left" }}>Coach Dashboard →</span>
                </a>
                <div style={{ height: 1, background: C.borderSub }} />
              </>
            )}

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
    <p style={{ color: "#9a9a9a", fontSize: 13, margin: "0 0 4px" }}>{greeting}</p>
    <p style={{ color: "#fafafa", fontSize: 26, fontWeight: "bold", margin: 0, letterSpacing: -0.5 }}>{dateDisplay}</p>
  </div>
    )
  })()}

  {/* ── TAB: VANDAAG ─────────────────────────────────────────── */}
  {activeTab === "vandaag" && (
    <div style={{ padding: "22px 22px 0", paddingBottom: TAB_H + 80 }}>

      {/* ── COMMITMENT ── */}
      <div style={{ marginTop: 0 }}>
        <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 10.5, letterSpacing: "0.26em", color: "#5e5e5e", textTransform: "uppercase", margin: "0 0 12px" }}>Commitment</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {commitments.map(c => (
            <div key={c.id} style={{ background: "#141414", border: "1px solid #1f1f1f", borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
              <div onClick={() => toggleDone(c.id, c.done)}
                style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, border: c.done ? "none" : "2px solid #3a3a3a", background: c.done ? GREEN : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                {c.done && <span style={{ color: "#000", fontSize: 12, fontWeight: "bold" }}>✓</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span onClick={() => toggleDone(c.id, c.done)}
                  style={{ fontSize: 14, color: c.done ? "#5e5e5e" : "#fafafa", textDecoration: c.done ? "line-through" : "none", cursor: "pointer", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.text}
                </span>
                {c.done && <p style={{ color: "#5e5e5e", fontSize: 11, margin: "3px 0 0" }}>Voltooid</p>}
              </div>
              {!c.done && (
                <button onClick={async () => { await supabase.from("commitments").delete().eq("id", c.id); setCommitments(prev => prev.filter(x => x.id !== c.id)) }}
                  style={{ background: "none", border: "none", color: "#5e5e5e", fontSize: 16, cursor: "pointer", padding: "0 4px", lineHeight: 1, flexShrink: 0 }}>×</button>
              )}
            </div>
          ))}
          {showAddCommit ? (
            <div style={{ background: "#141414", border: "1px dashed #2c2c2c", borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <input value={text} onChange={e => setText(e.target.value)} autoFocus
                onKeyDown={e => { if (e.key === "Enter" && text) { addCommitment(); setShowAddCommit(false) } if (e.key === "Escape") { setText(""); setShowAddCommit(false) } }}
                placeholder="Typ een commitment..."
                style={{ flex: 1, background: "transparent", border: "none", color: "#fafafa", fontSize: 14, outline: "none" }} />
              <button onClick={() => { if (text) { addCommitment(); setShowAddCommit(false) } else { setText(""); setShowAddCommit(false) } }}
                style={{ background: "none", border: "none", color: text ? GREEN : "#5e5e5e", fontSize: 20, cursor: "pointer", lineHeight: 1, padding: 0 }}>
                {text ? "↑" : "×"}
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAddCommit(true)}
              style={{ background: "transparent", border: "1px dashed #2c2c2c", borderRadius: 14, padding: 18, color: "#5e5e5e", fontSize: 14, cursor: "pointer", width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 16, fontWeight: 400 }}>+</span> Voeg commitment toe
            </button>
          )}
        </div>
      </div>

      {/* ── REFLECTIE ── */}
      {todayState > 1 && (
        <div style={{ marginTop: 24, opacity: todayState === 2 ? 0.4 : todayState === 3 ? 0.65 : 1, transition: "opacity 0.4s ease" }}>
          <div style={{ background: "#161616", border: "1px solid #333", borderRadius: 12, padding: "14px 16px" }}>
            <p style={{ fontSize: 13, color: todayState < 4 ? "#6b7280" : "#a1a1aa", margin: todayState === 4 && !reflectionSubmitted ? "0 0 10px" : 0 }}>
              {todayState < 4 ? "Vink commitments af om te reflecteren." : "Heb je je commitments gehaald?"}
            </p>
            {todayState === 4 && !reflectionSubmitted && (
              <>
                <textarea value={reflectionTekst} onChange={e => setReflectionTekst(e.target.value)}
                  placeholder="Toelichting (optioneel)" rows={2}
                  style={{ width: "100%", padding: 10, borderRadius: 8, background: C.inputBg, color: C.text, border: `1px solid #333`, fontSize: 13, resize: "none", boxSizing: "border-box", marginBottom: 8, outline: "none" }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => handleReflection(true)}  style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer", background: "#0f2010", color: GREEN,      fontWeight: "600", fontSize: 13 }}>Ja</button>
                  <button onClick={() => handleReflection(false)} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer", background: "#1f0f0f", color: "#ef4444", fontWeight: "600", fontSize: 13 }}>Nee</button>
                </div>
              </>
            )}
            {todayState === 4 && reflectionSubmitted && (
              <p style={{ color: GREEN, fontSize: 12, margin: 0 }}>✓ Opgeslagen</p>
            )}
          </div>
        </div>
      )}

      {/* ── DEZE WEEK ── */}
      <div style={{ marginTop: 26 }}>
        <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 10.5, letterSpacing: "0.26em", color: "#5e5e5e", textTransform: "uppercase", margin: "0 0 12px" }}>Deze week</p>
        {(() => {
          const dagNamen = ["ma", "di", "wo", "do", "vr", "za", "zo"]
          const today    = getNLDate()
          const base     = new Date(today)
          const dow      = base.getDay()
          const monday   = new Date(base)
          monday.setDate(base.getDate() + (dow === 0 ? -6 : 1 - dow))
          const weekDagen = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday); d.setDate(monday.getDate() + i)
            return d.toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" })
          })
          const scoreMap = {}
          history.forEach(d => { scoreMap[d.date] = Number(d.score) })
          const actiefDagen = weekDagen.filter(d => weekCheckIns.has(d) && (scoreMap[d] ?? 0) > 0).length
          return (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
                {weekDagen.map((datum, i) => {
                  const isToekomst   = datum > today
                  const isVandaag    = datum === today
                  const heeftCheckIn = weekCheckIns.has(datum)
                  const score        = scoreMap[datum] ?? null
                  const isVoltooid   = !isToekomst && !isVandaag && heeftCheckIn && score > 0
                  const isGemist     = !isToekomst && !isVandaag && !heeftCheckIn
                  return (
                    <div key={datum} style={{
                      aspectRatio: "1 / 1.18", borderRadius: 9, position: "relative",
                      background:  isVoltooid ? "rgba(34,197,94,0.12)" : isGemist ? "rgba(239,68,68,0.12)" : "transparent",
                      border:      isVandaag
                        ? `1px solid ${GREEN}`
                        : isVoltooid ? "1px solid rgba(34,197,94,0.40)"
                        : isGemist  ? "1px solid rgba(239,68,68,0.35)"
                        : "1px solid #1f1f1f",
                      boxShadow: isVandaag ? "inset 0 0 0 2px rgba(34,197,94,0.18)" : "none",
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      gap: 4,
                    }}>
                      <div style={{ width: 18, height: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 8, color: isVandaag ? GREEN : isVoltooid ? GREEN : isGemist ? "#ef4444" : "#5e5e5e", opacity: isToekomst ? 0.25 : 1 }}>
                        {isVandaag  && <svg width={16} height={16} viewBox="0 0 16 16" fill="none"><circle cx={8} cy={8} r={2.5} fill="currentColor" /></svg>}
                        {isVoltooid && <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M3 8.5L6.5 12L13 4.5"/></svg>}
                        {isGemist   && <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M5 5L11 11M11 5L5 11"/></svg>}
                        {isToekomst && <span style={{ fontSize: 12, lineHeight: 1 }}>·</span>}
                      </div>
                      <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 9.5, letterSpacing: "0.16em", textTransform: "uppercase", color: isVandaag ? GREEN : "#5e5e5e", position: "absolute", bottom: 6, left: 0, right: 0, textAlign: "center" }}>{dagNamen[i]}</span>
                    </div>
                  )
                })}
              </div>
              <p style={{ fontSize: 12, color: "#5e5e5e", padding: "0 2px", marginTop: 10, marginBottom: 0 }}>{actiefDagen} van 7 dagen actief deze week</p>
            </>
          )
        })()}
      </div>

      {/* ── VOEDING ── */}
      {kcalDoel && (
        <div style={{ marginTop: 26 }}>
          <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 10.5, letterSpacing: "0.26em", color: "#5e5e5e", textTransform: "uppercase", margin: "0 0 12px" }}>Voeding</p>
          <div onClick={() => setShowNutritionModal(true)}
            style={{ background: "#141414", border: "1px solid #1f1f1f", borderRadius: 14, padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, flex: 1 }}>
              {[
                { label: "KCAL",   value: kcalDoel,         unit: null },
                { label: "EIWIT",  value: eiwittenDoel,     unit: "g"  },
                { label: "KOOLH.", value: koolhydratenDoel, unit: "g"  },
                { label: "VETTEN", value: vettenDoel,       unit: "g"  },
              ].map(({ label, value, unit }) => (
                <div key={label}>
                  <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 9.5, letterSpacing: "0.2em", color: "#5e5e5e", textTransform: "uppercase", margin: "0 0 5px" }}>{label}</p>
                  <p style={{ fontSize: 19, fontWeight: 800, color: value ? "#fafafa" : "#3a3a3a", margin: 0, lineHeight: 1 }}>
                    {value || "—"}
                    {value && unit && <span style={{ fontSize: 11, fontWeight: 500, color: "#5e5e5e", marginLeft: 1 }}>{unit}</span>}
                  </p>
                </div>
              ))}
            </div>
            <span style={{ color: "#5e5e5e", fontSize: 14, flexShrink: 0, marginLeft: 8 }}>›</span>
          </div>
        </div>
      )}

      {/* ── REMINDERS ── */}
      <div style={{ marginTop: 26 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: 24, marginBottom: 12 }}>
          <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 10.5, letterSpacing: "0.26em", color: "#5e5e5e", textTransform: "uppercase", margin: 0 }}>Reminders</p>
          <button onClick={() => { setShowAddReminder(v => !v); setReminderForm({ tekst: "", tijd: "", eenmalig: false, datum: "" }) }}
            style={{ padding: "5px 11px", borderRadius: 7, border: `1px solid ${showAddReminder ? "#3a3a3a" : "#262626"}`, background: "transparent", color: showAddReminder ? "#fafafa" : "#9a9a9a", fontSize: 11.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            {showAddReminder ? "Annuleren" : <><span style={{ fontSize: 13, fontWeight: 400, color: "#5e5e5e" }}>+</span> Toevoegen</>}
          </button>
        </div>
          {showAddReminder && (
            <div style={{ background: "#161616", borderRadius: 12, padding: 16, marginBottom: 10, border: "1px solid #333" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input value={reminderForm.tekst} onChange={e => setReminderForm(f => ({ ...f, tekst: e.target.value }))}
                  placeholder="Bijv. creatine innemen"
                  style={{ padding: "10px 13px", borderRadius: 8, border: "1px solid #333", background: "#0a0a0a", color: "#fff", fontSize: 14, outline: "none" }} />
                <div style={{ display: "flex", gap: 8 }}>
                  {[{ val: false, label: "Dagelijks" }, { val: true, label: "Eenmalig" }].map(({ val, label }) => (
                    <button key={label} onClick={() => setReminderForm(f => ({ ...f, eenmalig: val, datum: "" }))}
                      style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `1px solid ${reminderForm.eenmalig === val ? GREEN : "#333"}`, background: reminderForm.eenmalig === val ? "#0a1a0f" : "#0a0a0a", color: reminderForm.eenmalig === val ? GREEN : "#a1a1aa", fontSize: 13, fontWeight: reminderForm.eenmalig === val ? "bold" : "normal", cursor: "pointer" }}>
                      {label}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {(() => {
                    const sel = { flex: 1, padding: "10px 13px", borderRadius: 8, border: "1px solid #333", background: "#0a0a0a", color: "#fff", fontSize: 14, outline: "none", appearance: "none", WebkitAppearance: "none" }
                    const [uurVal, minVal] = reminderForm.tijd ? reminderForm.tijd.split(":") : ["", ""]
                    return (
                      <>
                        <select value={uurVal} onChange={e => setReminderForm(f => ({ ...f, tijd: `${e.target.value}:${minVal || "00"}` }))} style={sel}>
                          <option value="" disabled>uur</option>
                          {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")).map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                        <select value={minVal} onChange={e => setReminderForm(f => ({ ...f, tijd: `${uurVal || "00"}:${e.target.value}` }))} style={sel}>
                          <option value="" disabled>min</option>
                          {["00","05","10","15","20","25","30","35","40","45","50","55"].map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </>
                    )
                  })()}
                  {reminderForm.eenmalig && (
                    <input type="date" value={reminderForm.datum} min={getNLDate()} onChange={e => setReminderForm(f => ({ ...f, datum: e.target.value }))}
                      style={{ flex: 1, padding: "10px 13px", borderRadius: 8, border: "1px solid #333", background: "#0a0a0a", color: "#fff", colorScheme: "dark", fontSize: 14, outline: "none" }} />
                  )}
                </div>
                {(() => {
                  const ok = reminderForm.tekst.trim() && reminderForm.tijd && (!reminderForm.eenmalig || reminderForm.datum)
                  return (
                    <button onClick={addReminder} disabled={!ok || savingReminder}
                      style={{ padding: "11px", borderRadius: 8, border: "none", background: ok ? GREEN : "#1a1a1a", color: ok ? "#000" : "#6b7280", fontWeight: "bold", fontSize: 14, cursor: ok ? "pointer" : "default" }}>
                      {savingReminder ? "Opslaan..." : "Opslaan"}
                    </button>
                  )
                })()}
              </div>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {reminders.map(r => {
              const isExpired = r.eenmalig && r.datum && r.datum < getNLDate()
              return (
                <div key={r.id} style={{ background: "#141414", border: "1px solid #1f1f1f", borderRadius: 12, padding: "14px 16px 14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14.5, fontWeight: 600, color: r.actief && !isExpired ? "#fafafa" : "#5e5e5e", margin: 0, textDecoration: !r.actief || isExpired ? "line-through" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.tekst}
                    </p>
                    <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: isExpired ? "#7a3030" : "#5e5e5e", margin: "3px 0 0" }}>
                      {fmtTime(r.tijd)} · {r.eenmalig ? (isExpired ? "Verlopen" : fmtReminderDate(r.datum)) : "Dagelijks"}
                    </p>
                  </div>
                  <button onClick={() => toggleReminder(r.id, r.actief)} disabled={isExpired}
                    style={{ width: 42, height: 24, borderRadius: 14, border: "none", background: r.actief && !isExpired ? GREEN : "#2c2c2c", cursor: isExpired ? "default" : "pointer", position: "relative", flexShrink: 0, transition: "background 150ms" }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: r.actief && !isExpired ? 20 : 2, transition: "left 150ms", boxShadow: "0 1px 3px rgba(0,0,0,0.4)" }} />
                  </button>
                  <button onClick={() => deleteReminder(r.id)}
                    style={{ background: "none", border: "none", color: "#5e5e5e", cursor: "pointer", fontSize: 18, padding: "0 2px", flexShrink: 0, lineHeight: 1 }}>×</button>
                </div>
              )
            })}
          </div>
        </div>

    </div>
  )}

  {/* ── TAB: VOORTGANG ───────────────────────────────────────── */}
  {activeTab === "voortgang" && (
    <div style={{ padding: "0 20px", paddingBottom: TAB_H + 32 }}>

      {/* Sectie 1 — Streak stats */}
      <div style={{ marginTop: 24, marginBottom: 32 }}>
        <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 10.5, letterSpacing: "0.26em", color: "#5e5e5e", textTransform: "uppercase", marginBottom: 16 }}>Statistieken</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { label: "Huidige streak",   value: `🔥 ${streak}`,          sub: streak === 1 ? "dag" : "dagen" },
            { label: "Langste streak",   value: longestStreak,            sub: longestStreak === 1 ? "dag" : "dagen" },
            { label: "Totaal actief",    value: totalActiveDays,          sub: "dagen" },
            { label: "Succesratio",      value: `${successRatio}%`,       sub: "van alle dagen" },
          ].map(({ label, value, sub }) => (
            <div key={label} style={{ background: C.card, border: `1px solid ${C.borderSub}`, borderRadius: 12, padding: "16px 18px" }}>
              <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 10, letterSpacing: "0.22em", color: "#5e5e5e", textTransform: "uppercase", margin: "0 0 10px" }}>{label}</p>
              <p style={{ fontSize: 26, fontWeight: 800, color: "#fafafa", margin: 0 }}>{value}</p>
              <p style={{ fontSize: 11, color: "#9a9a9a", margin: "4px 0 0" }}>{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sectie 2 — Gewicht trend */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 10.5, letterSpacing: "0.26em", color: "#5e5e5e", textTransform: "uppercase", margin: 0 }}>Gewicht</p>
          <PeriodSelector options={["7d", "30d", "90d"]} value={weightPeriod} onChange={setWeightPeriod} />
        </div>
        {weightChartData.length >= 2 ? (
          <div style={{ background: C.card, border: `1px solid ${C.borderSub}`, borderRadius: 12, padding: "20px 16px 12px" }}>
            {latestWeight && (
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: "#fafafa" }}>{parseMetricValue(latestWeight.waarde)} kg</span>
                <span style={{ fontSize: 12, color: "#9a9a9a", marginLeft: 10 }}>{fmtShortDate(latestWeight.datum)}</span>
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
              <p style={{ fontSize: 11, color: "#9a9a9a", marginTop: 12, textAlign: "right" }}>
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
            <p style={{ color: "#9a9a9a", fontSize: 14, lineHeight: 1.6 }}>
              Stuur je gewicht via WhatsApp<br/>om je trend bij te houden
            </p>
            <p style={{ color: "#5e5e5e", fontSize: 12, marginTop: 8 }}>bijv. "76kg"</p>
          </div>
        )}
      </div>

      {/* Sectie 3 — Voeding trend */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 10.5, letterSpacing: "0.26em", color: "#5e5e5e", textTransform: "uppercase", margin: 0 }}>Voeding</p>
          <PeriodSelector options={["7d", "30d"]} value={kcalPeriod} onChange={setKcalPeriod} />
        </div>
        {kcalChartData.length >= 1 ? (
          <div style={{ background: C.card, border: `1px solid ${C.borderSub}`, borderRadius: 12, padding: "20px 16px 12px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: "#fafafa" }}>{avgKcal}</span>
              <span style={{ fontSize: 12, color: "#9a9a9a" }}>gem. kcal / dag</span>
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
            <p style={{ color: "#9a9a9a", fontSize: 14, lineHeight: 1.6 }}>
              Stuur je dagelijkse kcal via WhatsApp<br/>om bij te houden
            </p>
            <p style={{ color: "#5e5e5e", fontSize: 12, marginTop: 8 }}>bijv. "2000 kcal"</p>
          </div>
        )}
      </div>

      {/* Sectie 4 — Commitments 8-weken grid */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 10.5, letterSpacing: "0.26em", color: "#5e5e5e", textTransform: "uppercase", marginBottom: 16 }}>Afgelopen 8 weken</p>
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
                    <div key={d} style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", textAlign: "center", fontSize: 9, color: "#5e5e5e", textTransform: "uppercase" }}>{d}</div>
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
    <div style={{
      position: "fixed",
      top: 0,
      bottom: TAB_H,
      left: "50%",
      transform: "translateX(-50%)",
      width: "100%",
      maxWidth: 420,
      display: "flex",
      flexDirection: "column",
      background: C.bg,
      zIndex: 40,
    }}>

      {/* Coach header */}
      <div style={{ padding: "14px 22px", borderBottom: "1px solid #1f1f1f", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#141414", border: "1px solid #262626", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: "#fafafa", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em" }}>AX</span>
        </div>
        <div>
          <p style={{ color: "#fafafa", fontSize: 14, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>AXIS Coach</p>
          <p style={{ color: "#5e5e5e", fontSize: 11, margin: 0 }}>Jouw persoonlijke coach</p>
        </div>
      </div>

      {/* Scroll area — flex: 1 fills remaining height, paddingBottom clears fixed input bar */}
      <div ref={scrollRef} className="chat-scroll" style={{ flex: 1, overflowY: "auto", padding: "0 20px", paddingBottom: "calc(64px + env(safe-area-inset-bottom, 0px) + 16px)" }}>
        {chatMessages.length === 0 ? (
          <div style={{ paddingTop: 24 }}>
            <p style={{ color: "#9a9a9a", fontSize: 15, marginBottom: 28, lineHeight: 1.6 }}>
              Hoi — ik ben je AXIS coach. Stel me een vraag of kies een onderwerp.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {suggestions.map(s => (
                <button key={s} onClick={() => sendChat(s)}
                  style={{ padding: "8px 14px", borderRadius: 20, border: "1px solid #262626", background: "transparent", color: "#9a9a9a", fontSize: 13, cursor: "pointer" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ paddingTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
            {chatMessages.map((msg, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                  style={{
                    maxWidth: "80%", padding: "12px 16px",
                    borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                    background: msg.role === "user" ? "#1c1c1c" : "#141414",
                    color: "#fafafa",
                    fontSize: 14, lineHeight: 1.5,
                    border: msg.role === "user" ? "1px solid #333" : "1px solid #1f1f1f",
                    wordBreak: "break-word", whiteSpace: "pre-wrap",
                  }}
                />
                {msg.time && (
                  <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 10, color: "#5e5e5e", margin: "4px 4px 0" }}>{msg.time}</p>
                )}
              </div>
            ))}
            {chatLoading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ padding: "12px 16px", borderRadius: "14px 14px 14px 4px", background: "#141414", border: "1px solid #1f1f1f", color: "#5e5e5e", fontSize: 14 }}>
                  ...
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar — fixed above tab bar, exact height 64px */}
      <div style={{
        position: "fixed",
        bottom: TAB_H,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 420,
        height: 64,
        padding: "0 16px",
        background: "#0a0a0a",
        borderTop: "1px solid #1f1f1f",
        display: "flex",
        gap: 10,
        alignItems: "center",
        zIndex: 45,
      }}>
        <input value={chatInput} onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendChat()}
          placeholder="Stel een vraag..."
          autoComplete="new-password" autoCorrect="off" autoCapitalize="off" spellCheck="false"
          style={{ flex: 1, padding: "12px 16px", borderRadius: 24, border: "1px solid #262626", background: "#141414", color: "#fafafa", fontSize: 14, outline: "none" }}
        />
        <button onClick={() => sendChat()} disabled={chatLoading}
          style={{ width: 44, height: 44, borderRadius: "50%", border: "none", background: chatInput ? GREEN : "#2c2c2c", cursor: chatInput ? "pointer" : "default", fontSize: 18, color: chatInput ? "#000" : "#5e5e5e", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.2s" }}>
          ↑
        </button>
      </div>
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
                      <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 10.5, letterSpacing: "0.26em", color: "#5e5e5e", textTransform: "uppercase", marginBottom: 4 }}>Vandaag</p>
                      <h3 style={{ color: "#fafafa", fontSize: 18, fontWeight: 700, margin: 0 }}>{todayWorkout.workout?.naam}</h3>
                      {todayWorkout.workout?.dag_type && (
                        <p style={{ color: "#9a9a9a", fontSize: 13, marginTop: 2 }}>{todayWorkout.workout.dag_type}</p>
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
                          <span style={{ color: "#9a9a9a", fontSize: 14 }}>{wo.oefening?.naam}</span>
                          <span style={{ color: "#5e5e5e", fontSize: 12 }}>{wo.sets}×{wo.reps}</span>
                        </div>
                      ))
                    }
                  </div>
                  {!todayWorkout.gedaan ? (
                    <>
                      <button onClick={startWorkout} style={{ width: "100%", padding: 14, background: GREEN, border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer", fontSize: 15, color: "#000" }}>
                        Start workout →
                      </button>
                      <button onClick={cancelWorkout} style={{ width: "100%", marginTop: 8, padding: 10, background: "transparent", border: "none", color: "#5e5e5e", cursor: "pointer", fontSize: 12 }}>
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
                  <p style={{ color: "#9a9a9a", fontSize: 15, marginBottom: 6 }}>Geen workout gepland vandaag</p>
                  <p style={{ color: "#5e5e5e", fontSize: 13, marginBottom: 20 }}>Kies zelf een workout om te beginnen</p>
                  <button onClick={() => setWorkoutScreen("picker")}
                    style={{ padding: "13px 28px", background: GREEN, border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer", fontSize: 15, color: "#000" }}>
                    Kies workout →
                  </button>
                </div>
              )}

              {weekWorkouts.length > 0 && (
                <div>
                  <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 10.5, letterSpacing: "0.26em", color: "#5e5e5e", textTransform: "uppercase", marginBottom: 10 }}>Deze week</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {weekWorkouts.map(wp => {
                      const isToday = wp.datum === getNLDate()
                      const dayNames = ["zo", "ma", "di", "wo", "do", "vr", "za"]
                      const dn = dayNames[new Date(wp.datum + "T12:00:00").getDay()]
                      return (
                        <div key={wp.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: isToday ? "#0a1a0f" : C.card, border: `1px solid ${isToday ? "#1a4d2a" : C.border}`, borderRadius: 8, padding: "10px 14px" }}>
                          <span style={{ color: isToday ? GREEN : "#9a9a9a", fontSize: 13, fontWeight: isToday ? 700 : 400, minWidth: 60 }}>{dn} {fmtShortDate(wp.datum)}</span>
                          <span style={{ color: isToday ? GREEN : "#9a9a9a", fontSize: 13, flex: 1, textAlign: "right", marginRight: wp.gedaan ? 8 : 0 }}>{wp.workout?.naam || "—"}</span>
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
                    style={{ background: "none", border: "none", color: "#9a9a9a", cursor: "pointer", fontSize: 13, padding: 0 }}>
                    ← Terug
                  </button>
                  <h3 style={{ color: "#fafafa", fontSize: 18, fontWeight: 700, margin: 0 }}>Kies een workout</h3>
                </div>
                {pickerSelected && (
                  <button onClick={() => chooseSelfWorkout(pickerSelected)}
                    style={{ padding: "10px 20px", background: GREEN, border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer", fontSize: 14, color: "#000" }}>
                    Start →
                  </button>
                )}
              </div>

              {/* ── Mijn schema's ── */}
              {myWorkouts.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 10.5, letterSpacing: "0.26em", color: "#5e5e5e", textTransform: "uppercase", marginBottom: 10 }}>
                    Mijn schema's
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {myWorkouts.map(w => {
                      const isSelected = pickerSelected === w.id
                      return (
                        <button key={w.id} onClick={() => setPickerSelected(isSelected ? null : w.id)}
                          style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: isSelected ? "#0a1a0f" : C.card, border: `2px solid ${isSelected ? GREEN : GREEN + "55"}`, borderRadius: 10, cursor: "pointer", textAlign: "left" }}>
                          <div>
                            <p style={{ color: isSelected ? GREEN : "#fafafa", fontSize: 14, fontWeight: 600, margin: 0 }}>{w.naam}</p>
                            <p style={{ color: "#9a9a9a", fontSize: 12, marginTop: 3 }}>{(w.workout_oefeningen || []).length} oefeningen</p>
                          </div>
                          {isSelected ? <span style={{ color: GREEN, fontSize: 18 }}>✓</span> : <span style={{ color: GREEN, fontSize: 16 }}>★</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── Van mijn coach ── */}
              {coachWorkouts.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <button onClick={toggleCoachSection}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", padding: "8px 0", marginBottom: getCoachSectionOpen() ? 10 : 0 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 10.5, letterSpacing: "0.26em", color: "#5e5e5e", textTransform: "uppercase" }}>
                      Van mijn coach
                    </span>
                    <span style={{ color: C.textDim, fontSize: 12 }}>{getCoachSectionOpen() ? "▲" : "▼"}</span>
                  </button>
                  {getCoachSectionOpen() && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {coachWorkouts.map(w => {
                        const isSelected = pickerSelected === w.id
                        return (
                          <button key={w.id} onClick={() => setPickerSelected(isSelected ? null : w.id)}
                            style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: isSelected ? "#0a1a0f" : C.card, border: `2px solid ${isSelected ? GREEN : C.border}`, borderRadius: 10, cursor: "pointer", textAlign: "left" }}>
                            <div>
                              <p style={{ color: isSelected ? GREEN : "#fafafa", fontSize: 14, fontWeight: 600, margin: 0 }}>{w.naam}</p>
                              <p style={{ color: "#9a9a9a", fontSize: 12, marginTop: 3 }}>{(w.workout_oefeningen || []).length} oefeningen</p>
                            </div>
                            {isSelected ? <span style={{ color: GREEN, fontSize: 18 }}>✓</span> : <span style={{ color: C.textDim, fontSize: 18 }}>○</span>}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {workoutLibrary.length === 0 && myWorkouts.length === 0 && coachWorkouts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <p style={{ color: "#9a9a9a", fontSize: 14 }}>Geen workouts beschikbaar</p>
                  <p style={{ color: "#5e5e5e", fontSize: 12, marginTop: 6 }}>Herlaad de pagina als dit onverwacht is</p>
                </div>
              ) : workoutLibrary.length === 0 ? null : (() => {
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
                  return false
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

              <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
                <button onClick={() => { setBuilderNaam(""); setBuilderItems([]); setBuilderSearch(""); setBuilderResults([]); setWorkoutScreen("builder") }}
                  style={{ width: "100%", padding: "13px 16px", background: "transparent", border: `1.5px dashed ${C.border}`, borderRadius: 10, color: C.textMuted, fontSize: 14, cursor: "pointer" }}>
                  + Maak eigen schema
                </button>
              </div>
            </>
          )}

          {/* ── SCHEMA BUILDER ── */}
          {workoutScreen === "builder" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <button onClick={() => setWorkoutScreen("picker")}
                  style={{ background: "none", border: "none", color: "#9a9a9a", cursor: "pointer", fontSize: 13, padding: 0 }}>
                  ← Terug
                </button>
                <h3 style={{ color: "#fafafa", fontSize: 18, fontWeight: 700, margin: 0 }}>Maak eigen schema</h3>
              </div>

              {/* Naam */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 10.5, letterSpacing: "0.26em", color: "#5e5e5e", textTransform: "uppercase", marginBottom: 8 }}>Naam van je schema</p>
                <input value={builderNaam} onChange={e => setBuilderNaam(e.target.value)}
                  placeholder="Bijv. Push dag A"
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1px solid ${C.inputBorder}`, background: C.inputBg, color: C.text, fontSize: 15, boxSizing: "border-box", outline: "none" }} />
              </div>

              {/* Oefeningen zoeken */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ color: C.textMuted, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Oefeningen toevoegen</p>
                <input value={builderSearch} onChange={e => searchOefeningen(e.target.value)}
                  placeholder="Zoek op naam..."
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1px solid ${C.inputBorder}`, background: C.inputBg, color: C.text, fontSize: 14, boxSizing: "border-box", outline: "none" }} />
                {builderResults.length > 0 && (
                  <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, marginTop: 4, overflow: "hidden" }}>
                    {builderResults.map(oe => (
                      <button key={oe.id} onClick={() => addBuilderOefening(oe)}
                        style={{ width: "100%", padding: "11px 14px", background: builderItems.find(x => x.oefening_id === oe.id) ? C.cardAlt : C.card, border: "none", borderBottom: `1px solid ${C.border}`, color: builderItems.find(x => x.oefening_id === oe.id) ? C.textDim : C.text, fontSize: 14, cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between" }}>
                        <span>{oe.naam}</span>
                        <span style={{ color: C.textDim, fontSize: 12 }}>{oe.spiergroep || ""}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Toegevoegde oefeningen */}
              {builderItems.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <p style={{ color: C.textMuted, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>Schema ({builderItems.length} oefeningen)</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {builderItems.map((item, i) => (
                      <div key={item.oefening_id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                          <span style={{ color: C.text, fontSize: 14, fontWeight: "bold" }}>{i + 1}. {item.naam}</span>
                          <button onClick={() => removeBuilderOefening(item.oefening_id)}
                            style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 16, padding: 0 }}>×</button>
                        </div>
                        <div style={{ display: "flex", gap: 12 }}>
                          <label style={{ flex: 1 }}>
                            <p style={{ color: C.textDim, fontSize: 11, marginBottom: 4 }}>Sets</p>
                            <input type="number" min={1} max={10} value={item.sets}
                              onChange={e => updateBuilderItem(item.oefening_id, "sets", e.target.value)}
                              style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.inputBorder}`, background: C.inputBg, color: C.text, fontSize: 15, textAlign: "center", boxSizing: "border-box" }} />
                          </label>
                          <label style={{ flex: 1 }}>
                            <p style={{ color: C.textDim, fontSize: 11, marginBottom: 4 }}>Reps</p>
                            <input type="number" min={1} max={100} value={item.reps}
                              onChange={e => updateBuilderItem(item.oefening_id, "reps", e.target.value)}
                              style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.inputBorder}`, background: C.inputBg, color: C.text, fontSize: 15, textAlign: "center", boxSizing: "border-box" }} />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={saveBuilder} disabled={builderSaving || !builderNaam.trim() || builderItems.length === 0}
                style={{ width: "100%", padding: 14, background: builderSaving || !builderNaam.trim() || builderItems.length === 0 ? "#1a2a1a" : GREEN, border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer", fontSize: 15, color: builderSaving || !builderNaam.trim() || builderItems.length === 0 ? "#444" : "#000" }}>
                {builderSaving ? "Opslaan..." : "Schema opslaan"}
              </button>
            </>
          )}

          {/* ── ACTIVE WORKOUT ── */}
          {workoutScreen === "active" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <div style={{ display: "flex", gap: 12, marginBottom: 4 }}>
                    <button onClick={cancelWorkout} style={{ background: "none", border: "none", color: "#9a9a9a", cursor: "pointer", fontSize: 13, padding: 0 }}>← Terug</button>
                    <button onClick={cancelWorkout} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 13, padding: 0 }}>✕ Annuleer</button>
                  </div>
                  <h3 style={{ color: "#fafafa", fontSize: 18, fontWeight: 700, margin: 0 }}>{todayWorkout?.workout?.naam}</h3>
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
                          <h4 style={{ color: "#fafafa", fontSize: 15, fontWeight: 600, margin: 0 }}>{oe.naam}</h4>
                          <p style={{ color: "#9a9a9a", fontSize: 12, marginTop: 2, marginBottom: 0 }}>{oe.spiergroep}</p>
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
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "24px 1fr 1fr 36px", gap: 6, paddingBottom: 2 }}>
                          <span style={{ color: C.textDim, fontSize: 11 }}>#</span>
                          <span style={{ color: C.textDim, fontSize: 11 }}>Reps</span>
                          <span style={{ color: C.textDim, fontSize: 11 }}>Kg</span>
                          <span></span>
                        </div>
                        {sets.map((s, si) => {
                          const ps = prevSets[oe.id]?.[si]
                          const hint = ps
                            ? [ps.gewicht != null ? `${ps.gewicht}kg` : null, ps.reps_gedaan != null ? `× ${ps.reps_gedaan}` : null].filter(Boolean).join(" ")
                            : null
                          return (
                            <div key={si}>
                              <div style={{ display: "grid", gridTemplateColumns: "24px 1fr 1fr 36px", gap: 6, alignItems: "center" }}>
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
                              {hint && (
                                <p style={{ color: C.textDim, fontSize: 11, margin: "2px 0 4px 28px" }}>Vorige keer: {hint}</p>
                              )}
                            </div>
                          )
                        })}
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
  <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 420, background: "#0a0a0a", borderTop: "1px solid #1f1f1f", display: "flex", zIndex: 50, padding: "8px 8px 22px", boxSizing: "border-box" }}>

    {[
      { id: "vandaag",   label: "Vandaag",   icon: (c) => (
        <svg width={20} height={20} viewBox="0 0 22 22" fill="none">
          <circle cx={11} cy={11} r={9} stroke={c} strokeWidth={1.5} fill={c === GREEN ? "#0a1a0f" : "none"} />
          <path d="M7 11l3 3 5-5" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )},
      { id: "voortgang", label: "Voortgang", icon: (c) => (
        <svg width={20} height={20} viewBox="0 0 22 22" fill="none">
          <polyline points="3,16 8,10 12,13 19,5" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M17 5h2v2" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )},
      { id: "workout",   label: "Workout",   icon: (c) => (
        <svg width={20} height={20} viewBox="0 0 22 22" fill="none">
          <path d="M3 11h2M17 11h2M5 11l2-3h8l2 3M5 11l2 3h8l2-3" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={3} cy={11} r={1.5} stroke={c} strokeWidth={1.5} />
          <circle cx={19} cy={11} r={1.5} stroke={c} strokeWidth={1.5} />
        </svg>
      )},
      { id: "coach",     label: "Coach",     icon: (c) => (
        <svg width={20} height={20} viewBox="0 0 22 22" fill="none">
          <path d="M4 4h14a1 1 0 011 1v9a1 1 0 01-1 1H7l-4 3V5a1 1 0 011-1z" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill={c === GREEN ? "#0a1a0f" : "none"} />
        </svg>
      )},
    ].map(({ id, label, icon }) => {
      const active = activeTab === id
      const col = active ? GREEN : "#5e5e5e"
      return (
        <button key={id} onClick={() => setActiveTab(id)}
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          {icon(col)}
          <span style={{ fontSize: 10.5, fontWeight: 500, color: col }}>{label}</span>
        </button>
      )
    })}

  </div>

</div>
)

}
