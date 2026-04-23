"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../lib/supabase"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

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
const [currentWeightInput, setCurrentWeightInput] = useState("")
const [targetWeightInput,  setTargetWeightInput]  = useState("")
const [trainingLocation,   setTrainingLocation]   = useState("")
const [fitnessLevel,       setFitnessLevel]       = useState("")
const [chatMessages,    setChatMessages]   = useState([])
const [chatInput,       setChatInput]      = useState("")
const [chatLoading,     setChatLoading]    = useState(false)

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
  }
  init()
}, [user])

async function loadCommitments() {
  const today = getNLDate()
  const { data } = await supabase
    .from("commitments").select("*")
    .eq("user_id", user.id).eq("date", today)
    .order("created_at", { ascending: false })
  if (data) { setCommitments(data); calculateProgress(data) }
}

async function checkFirstUse() {
  const { data } = await supabase.from("users").select("goal, training_location, fitness_level, kcal_doel, eiwitten_doel, koolhydraten_doel, vetten_doel, doelen_door_coach").eq("auth_user_id", user.id).single()
  if (data?.training_location) setTrainingLocation(data.training_location)
  if (data?.fitness_level)     setFitnessLevel(data.fitness_level)
  if (data?.kcal_doel)         setKcalDoel(String(data.kcal_doel))
  if (data?.eiwitten_doel)     setEiwittenDoel(String(data.eiwitten_doel))
  if (data?.koolhydraten_doel) setKoolhydratenDoel(String(data.koolhydraten_doel))
  if (data?.vetten_doel)       setVettenDoel(String(data.vetten_doel))
  if (data?.doelen_door_coach) setDoelenDoorCoach(!!data.doelen_door_coach)
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
  const { data: existing } = await supabase.from("users").select("id").eq("auth_user_id", user.id).single()
  const payload = { goal, current_weight: cw ? parseFloat(cw) : null, target_weight: tw ? parseFloat(tw) : null }
  if (existing) {
    await supabase.from("users").update(payload).eq("auth_user_id", user.id)
  } else {
    await supabase.from("users").insert({ ...payload, auth_user_id: user.id })
  }
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
  const publicUserId = userData?.id
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
      .order("datum", { ascending: true }).limit(14),
    supabase.from("metrics").select("waarde, datum")
      .eq("user_id", user.id).in("type", ["voeding", "calorie", "kcal"])
      .order("datum", { ascending: true }).limit(14),
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
    .upsert({ whatsapp_number: formatted, auth_user_id: user.id }, { onConflict: "whatsapp_number" })
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
const weightChartData = metricsWeight
  .map(m => ({ label: fmtShortDate(m.datum), value: parseMetricValue(m.waarde) }))
  .filter(d => d.value !== null)

const kcalChartData = metricsKcal
  .map(m => ({ label: fmtShortDate(m.datum), value: parseMetricValue(m.waarde) }))
  .filter(d => d.value !== null)

const avgKcal = kcalChartData.length === 0 ? 0
  : Math.round(kcalChartData.reduce((s, d) => s + d.value, 0) / kcalChartData.length)

const successRatio = progressHistory.length === 0 ? 0
  : Math.round(totalActiveDays / progressHistory.length * 100)

const latestWeight = metricsWeight.length > 0 ? metricsWeight[metricsWeight.length - 1] : null

// ── Onboarding ────────────────────────────────────────────────
if (showOnboarding) {
  const totalSteps = 6
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

        {/* Stap 2 — Gewicht (optioneel) */}
        {onboardingStep === 2 && (
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
            <button onClick={async () => { await saveGoalData(selectedGoal, currentWeightInput, targetWeightInput); setOnboardingStep(3) }} style={btnPrimary}>
              Volgende →
            </button>
            <button onClick={async () => { await saveGoalData(selectedGoal, null, null); setOnboardingStep(3) }} style={btnGhost}>
              Sla over
            </button>
          </>
        )}

        {/* Stap 3 — Trainingslocatie */}
        {onboardingStep === 3 && (
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
              setOnboardingStep(4)
            }} style={{ ...btnPrimary, opacity: trainingLocation ? 1 : 0.4, cursor: trainingLocation ? "pointer" : "default" }}>
              Volgende →
            </button>
          </>
        )}

        {/* Stap 4 — Fitnessniveau */}
        {onboardingStep === 4 && (
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
              setOnboardingStep(5)
            }} style={{ ...btnPrimary, opacity: fitnessLevel ? 1 : 0.4, cursor: fitnessLevel ? "pointer" : "default" }}>
              Volgende →
            </button>
          </>
        )}

        {/* Stap 5 — Eerste commitment kiezen */}
        {onboardingStep === 5 && (
          <>
            <h2 style={{ marginBottom: 8, fontSize: 22, color: C.text }}>Wat ga jij vandaag doen?</h2>
            <p style={{ color: C.textSub, fontSize: 14, marginBottom: 20 }}>Kies een suggestie of typ je eigen commitment.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {(GOAL_SUGGESTIONS[selectedGoal] || []).map(s => (
                <button key={s} onClick={async () => { await addCommitment(s); setOnboardingStep(6) }} style={{
                  padding: "13px 14px", borderRadius: 8, border: `1px solid ${C.inputBorder}`,
                  background: C.inputBg, color: C.text, fontSize: 14, cursor: "pointer", textAlign: "left",
                }}>
                  {s}
                </button>
              ))}
            </div>
            <p style={{ color: C.textMuted, fontSize: 12, marginBottom: 8 }}>Of typ zelf:</p>
            <input autoFocus value={text} onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && text && addCommitment().then(() => setOnboardingStep(6))}
              placeholder="bijv. 30 minuten sporten"
              style={{ ...inputStyle, marginBottom: 12 }}
            />
            <button onClick={async () => { if (!text) return; await addCommitment(); setOnboardingStep(6) }}
              style={{ ...btnPrimary, opacity: text ? 1 : 0.4, cursor: text ? "pointer" : "default" }}>
              Dit is mijn commitment →
            </button>
          </>
        )}

        {/* Stap 6 — WhatsApp koppelen */}
        {onboardingStep === 6 && (
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

// Recharts custom tooltip
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
      <p style={{ color: C.textMuted, margin: "0 0 4px" }}>{label}</p>
      <p style={{ color: GREEN, margin: 0, fontWeight: "bold" }}>{payload[0].value}</p>
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
          <div style={{ position: "absolute", right: 0, top: 32, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 0", minWidth: 190, zIndex: 100 }}>
            <div style={{ padding: "6px 16px", color: C.textMuted, fontSize: 11 }}>{user?.email}</div>
            <hr style={{ border: "none", borderTop: `1px solid ${C.borderSub}`, margin: "4px 0" }} />
            {[{ val: "dark", label: "Dark", icon: "🌙" }, { val: "light", label: "Light", icon: "☀️" }].map(({ val, label, icon }) => (
              <button key={val} onClick={() => { toggleTheme(val); setShowSettings(false) }}
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 16px", background: "none", border: "none", color: C.text, textAlign: "left", cursor: "pointer", fontSize: 14 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: theme === val ? GREEN : "transparent", border: theme === val ? "none" : `1px solid ${C.border}`, flexShrink: 0 }} />
                {icon} {label}
              </button>
            ))}
            <hr style={{ border: "none", borderTop: `1px solid ${C.borderSub}`, margin: "4px 0" }} />
            <button onClick={async () => { setShowSettings(false); const pw = prompt("Nieuw wachtwoord (min. 6 tekens):"); if (!pw || pw.length < 6) return; const { error } = await supabase.auth.updateUser({ password: pw }); if (error) alert("Fout: " + error.message); else alert("Wachtwoord opgeslagen!") }}
              style={{ display: "block", width: "100%", padding: "10px 16px", background: "none", border: "none", color: C.text, textAlign: "left", cursor: "pointer", fontSize: 14 }}>
              Wachtwoord instellen
            </button>
            <button onClick={async () => { setShowSettings(false); const number = prompt("Jouw WhatsApp nummer (+31...):"); if (!number) return; const ok = await linkWhatsapp(number); if (ok) alert("WhatsApp gekoppeld!") }}
              style={{ display: "block", width: "100%", padding: "10px 16px", background: "none", border: "none", color: C.text, textAlign: "left", cursor: "pointer", fontSize: 14 }}>
              Koppel WhatsApp
            </button>
            <button onClick={() => { setShowSettings(false); setShowNutritionModal(true) }}
              style={{ display: "block", width: "100%", padding: "10px 16px", background: "none", border: "none", color: C.text, textAlign: "left", cursor: "pointer", fontSize: 14 }}>
              🥗 Voedingsdoelen
            </button>
            <hr style={{ border: "none", borderTop: `1px solid ${C.borderSub}`, margin: "4px 0" }} />
            <button onClick={logout}
              style={{ display: "block", width: "100%", padding: "10px 16px", background: "none", border: "none", color: "#ef4444", textAlign: "left", cursor: "pointer", fontSize: 14 }}>
              Uitloggen
            </button>
          </div>
        )}
      </div>
    </div>
  </div>

  {/* ── TAB: VANDAAG ─────────────────────────────────────────── */}
  {activeTab === "vandaag" && (
    <div style={{ padding: "0 20px", paddingBottom: TAB_H + 80 }}>

      <div style={{ marginTop: 24, marginBottom: 32 }}>
        <p style={{ fontSize: 10, letterSpacing: 2, color: C.textMuted, textTransform: "uppercase", marginBottom: 16 }}>Vandaag</p>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <svg width={88} height={88} style={{ flexShrink: 0 }}>
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
              {progress === 100 ? "Perfecte dag 🎯" : progress > 0 ? "Bezig..." : "Nog niets afgevinkt"}
            </p>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 10, letterSpacing: 2, color: C.textMuted, textTransform: "uppercase", marginBottom: 16 }}>Commitments</p>
        {commitments.length === 0 && <p style={{ color: C.textMuted, fontSize: 14 }}>Nog geen commitments voor vandaag.</p>}
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
      </div>

      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 10, letterSpacing: 2, color: C.textMuted, textTransform: "uppercase", marginBottom: 16 }}>Reflectie</p>
        <div style={{ background: C.card, borderRadius: 12, padding: 20, border: `1px solid ${C.borderSub}` }}>
          <p style={{ fontSize: 15, marginBottom: 16, color: C.text }}>Heb je je commitments gehaald?</p>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setCompleted(true)} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", cursor: "pointer", background: completed === true ? "#166534" : C.cardAlt, color: completed === true ? GREEN : C.textSub, fontWeight: completed === true ? "bold" : "normal", fontSize: 14 }}>Ja</button>
            <button onClick={() => setCompleted(false)} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", cursor: "pointer", background: completed === false ? "#2a1a1a" : C.cardAlt, color: completed === false ? "#ef4444" : C.textSub, fontWeight: completed === false ? "bold" : "normal", fontSize: 14 }}>Nee</button>
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
        </div>
      </div>

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
        <p style={{ fontSize: 10, letterSpacing: 2, color: C.textMuted, textTransform: "uppercase", marginBottom: 16 }}>Gewicht</p>
        {weightChartData.length >= 2 ? (
          <div style={{ background: C.card, border: `1px solid ${C.borderSub}`, borderRadius: 12, padding: "20px 16px 12px" }}>
            {latestWeight && (
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 28, fontWeight: "bold", color: C.text }}>{parseMetricValue(latestWeight.waarde)} kg</span>
                <span style={{ fontSize: 12, color: C.textMuted, marginLeft: 10 }}>{fmtShortDate(latestWeight.datum)}</span>
              </div>
            )}
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={weightChartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <XAxis dataKey="label" tick={{ fill: C.textDim, fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis domain={["auto", "auto"]} tick={{ fill: C.textDim, fontSize: 9 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="value" stroke={GREEN} strokeWidth={2} dot={{ fill: GREEN, r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: GREEN }} />
              </LineChart>
            </ResponsiveContainer>
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
        <p style={{ fontSize: 10, letterSpacing: 2, color: C.textMuted, textTransform: "uppercase", marginBottom: 16 }}>Voeding</p>
        {kcalChartData.length >= 2 ? (
          <div style={{ background: C.card, border: `1px solid ${C.borderSub}`, borderRadius: 12, padding: "20px 16px 12px" }}>
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 28, fontWeight: "bold", color: C.text }}>{avgKcal}</span>
              <span style={{ fontSize: 12, color: C.textMuted, marginLeft: 10 }}>gem. kcal / dag</span>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={kcalChartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <XAxis dataKey="label" tick={{ fill: C.textDim, fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis domain={["auto", "auto"]} tick={{ fill: C.textDim, fontSize: 9 }} axisLine={false} tickLine={false} width={36} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="value" stroke={GREEN} strokeWidth={2} dot={{ fill: GREEN, r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: GREEN }} />
              </LineChart>
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

      {/* Sectie 4 — Commitments 4-weken grid */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 10, letterSpacing: 2, color: C.textMuted, textTransform: "uppercase", marginBottom: 16 }}>Afgelopen 4 weken</p>
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
            startMonday.setDate(thisMonday.getDate() - 21)

            const weeks = Array.from({ length: 4 }, (_, w) =>
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
                <div style={{ display: "grid", gridTemplateColumns: "32px repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
                  <div />
                  {dagNamen.map(d => (
                    <div key={d} style={{ textAlign: "center", fontSize: 9, color: C.textDim, textTransform: "uppercase" }}>{d}</div>
                  ))}
                </div>
                {/* Week rows */}
                {weeks.map((week, wi) => {
                  const weekLabel = wi === 3 ? "nu" : `−${3 - wi}w`
                  return (
                    <div key={wi} style={{ display: "grid", gridTemplateColumns: "32px repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 6 }}>
                        <span style={{ fontSize: 9, color: C.textDim }}>{weekLabel}</span>
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
      <button onClick={addCommitment} style={{ width: 44, height: 44, borderRadius: "50%", border: "none", background: text ? GREEN : C.card, cursor: "pointer", fontSize: 22, color: text ? "#000" : C.textMuted, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.2s" }}>
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
