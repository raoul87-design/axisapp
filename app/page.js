"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../lib/supabase"

const GREEN = "#22c55e"

export default function Home() {

const [user,              setUser]             = useState(null)
const [text,              setText]             = useState("")
const [commitments,       setCommitments]      = useState([])
const [history,           setHistory]          = useState([])
const [progress,          setProgress]         = useState(0)
const [streak,            setStreak]           = useState(0)
const [showOnboarding,    setShowOnboarding]   = useState(false)
const [onboardingStep,    setOnboardingStep]   = useState(1)
const [interactionMode,   setInteractionMode]  = useState("")
const [completed,         setCompleted]        = useState(null)
const [answer,            setAnswer]           = useState("")
const [showAll,           setShowAll]          = useState(false)
const [whatsappInput,     setWhatsappInput]    = useState("")
const [whatsappLinked,    setWhatsappLinked]   = useState(false)
const [showSettings,      setShowSettings]     = useState(false)
const [weekCheckIns,      setWeekCheckIns]     = useState(new Set())
const [weekCommits,       setWeekCommits]      = useState(new Set())
const [theme,             setTheme]            = useState("dark")
const router = useRouter()
const FORCE_ONBOARDING = false

// ── Kleurenpalet ─────────────────────────────────────────────
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

// ── Reflectie opslaan ─────────────────────────────────────────
const handleSubmit = async () => {
  if (!answer) { alert("Please add a reflection"); return }
  const { error } = await supabase.from("reflections").insert([{ user_id: user.id, completed, answer }])
  if (error) { console.error("ERROR:", error); alert("Error saving") }
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
  const { data } = await supabase.from("commitments").select("id").eq("user_id", user.id).limit(1)
  if (FORCE_ONBOARDING || !data || data.length === 0) setShowOnboarding(true)
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
    .from("users").select("id").eq("auth_user_id", user.id).single()
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

function calculateProgress(list) {
  if (list.length === 0) { setProgress(0); return }
  const done  = list.filter(c => c.done).length
  const total = list.length
  saveDailyScore(Math.round((done / total) * 100))
  setProgress(Math.round((done / total) * 100))
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

async function addCommitment() {
  if (!text || !user) return
  await supabase.from("commitments").insert({ text, user_id: user.id, date: getNLDate(), done: false })
  setText("")
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

// ── Onboarding ────────────────────────────────────────────────
if (showOnboarding) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg }}>
      <div style={{ width: "100%", maxWidth: 420, background: C.card, padding: 40, borderRadius: 12 }}>
        <p style={{ color: C.textSub, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", marginBottom: 32 }}>
          Stap {onboardingStep} van 2
        </p>

        {onboardingStep === 1 && (
          <>
            <h2 style={{ marginBottom: 8, fontSize: 22, color: C.text }}>Waar ga jij vandaag voor?</h2>
            <p style={{ color: C.textSub, fontSize: 14, marginBottom: 24 }}>Eén commitment. Maak het concreet.</p>
            <input
              autoFocus value={text} onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && text && (addCommitment().then(() => setOnboardingStep(2)))}
              placeholder="bijv. 30 minuten sporten"
              style={{ width: "100%", padding: "14px", marginBottom: 16, borderRadius: 8, border: `1px solid ${C.inputBorder}`, background: C.inputBg, color: C.text, fontSize: 15 }}
            />
            <button onClick={async () => { if (!text) return; await addCommitment(); setOnboardingStep(2) }}
              style={{ width: "100%", padding: "14px", background: GREEN, border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer", fontSize: 15, color: "#000" }}>
              Dit is mijn commitment →
            </button>
          </>
        )}

        {onboardingStep === 2 && (
          <>
            <h2 style={{ marginBottom: 8, fontSize: 22, color: C.text }}>Blijf op koers via WhatsApp</h2>
            <p style={{ color: C.textSub, fontSize: 14, marginBottom: 24 }}>AXIS stuurt je dagelijks een check-in.<br/>Geen app nodig — gewoon reageren.</p>
            <input
              autoFocus value={whatsappInput} onChange={e => setWhatsappInput(e.target.value)}
              placeholder="+31612345678"
              style={{ width: "100%", padding: "14px", marginBottom: 16, borderRadius: 8, border: `1px solid ${C.inputBorder}`, background: C.inputBg, color: C.text, fontSize: 15 }}
            />
            <button onClick={async () => { if (!whatsappInput) return; const ok = await linkWhatsapp(whatsappInput); if (ok) { setInteractionMode("whatsapp"); setShowOnboarding(false) } }}
              style={{ width: "100%", padding: "14px", background: GREEN, border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer", fontSize: 15, color: "#000", marginBottom: 10 }}>
              Koppel WhatsApp (aanbevolen)
            </button>
            <button onClick={() => { setInteractionMode("app"); setShowOnboarding(false) }}
              style={{ width: "100%", padding: "12px", background: "transparent", border: "none", color: C.textSub, cursor: "pointer", fontSize: 13 }}>
              Sla over, ik gebruik de app
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

return (
<div style={{ maxWidth: 420, margin: "auto", paddingBottom: 100, fontFamily: "sans-serif", background: C.bg, minHeight: "100vh", color: C.text }}>

  {/* HEADER */}
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 20px 12px" }}>
    <div>
      <img src="/logotransparant.png" alt="Axis logo" style={{ width: 100, height: 38, filter: theme === "light" ? "invert(1)" : "none" }} />
      <p style={{ color: C.textSub, fontSize: 10, letterSpacing: 1.5, marginTop: 4, textTransform: "uppercase" }}>
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
          style={{ background: "none", border: "none", color: C.textSub, cursor: "pointer", fontSize: 20, padding: "4px 8px" }}>
          ···
        </button>
        {showSettings && (
          <div style={{ position: "absolute", right: 0, top: 32, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 0", minWidth: 190, zIndex: 100 }}>
            <div style={{ padding: "6px 16px", color: C.textSub, fontSize: 11 }}>{user?.email}</div>
            <hr style={{ border: "none", borderTop: `1px solid ${C.borderSub}`, margin: "4px 0" }} />
            {[{ val: "dark", label: "Dark", icon: "🌙" }, { val: "light", label: "Light", icon: "☀️" }].map(({ val, label, icon }) => (
              <button key={val} onClick={() => { toggleTheme(val); setShowSettings(false) }}
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 16px", background: "none", border: "none", color: C.text, textAlign: "left", cursor: "pointer", fontSize: 14 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: theme === val ? GREEN : "transparent", border: theme === val ? "none" : `1px solid ${C.border}`, flexShrink: 0 }} />
                {icon} {label}
              </button>
            ))}
            <hr style={{ border: "none", borderTop: `1px solid ${C.borderSub}`, margin: "4px 0" }} />
            <button onClick={async () => {
              setShowSettings(false)
              const pw = prompt("Nieuw wachtwoord (min. 6 tekens):")
              if (!pw || pw.length < 6) return
              const { error } = await supabase.auth.updateUser({ password: pw })
              if (error) alert("Fout: " + error.message)
              else alert("Wachtwoord opgeslagen!")
            }} style={{ display: "block", width: "100%", padding: "10px 16px", background: "none", border: "none", color: C.text, textAlign: "left", cursor: "pointer", fontSize: 14 }}>
              Wachtwoord instellen
            </button>
            <button onClick={async () => {
              setShowSettings(false)
              const number = prompt("Jouw WhatsApp nummer (+31...):")
              if (!number) return
              const ok = await linkWhatsapp(number)
              if (ok) alert("WhatsApp gekoppeld!")
            }} style={{ display: "block", width: "100%", padding: "10px 16px", background: "none", border: "none", color: C.text, textAlign: "left", cursor: "pointer", fontSize: 14 }}>
              Koppel WhatsApp
            </button>
            <hr style={{ border: "none", borderTop: `1px solid ${C.borderSub}`, margin: "4px 0" }} />
            <button onClick={logout} style={{ display: "block", width: "100%", padding: "10px 16px", background: "none", border: "none", color: "#ef4444", textAlign: "left", cursor: "pointer", fontSize: 14 }}>
              Uitloggen
            </button>
          </div>
        )}
      </div>
    </div>
  </div>

  <div style={{ padding: "0 20px" }}>

    {/* VOORTGANG */}
    <div style={{ marginTop: 24, marginBottom: 32 }}>
      <p style={{ fontSize: 10, letterSpacing: 2, color: C.textSub, textTransform: "uppercase", marginBottom: 16 }}>Vandaag</p>
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <svg width={88} height={88} style={{ flexShrink: 0 }}>
          <circle cx={44} cy={44} r={36} fill="none" stroke={C.borderSub} strokeWidth={6} />
          <circle cx={44} cy={44} r={36} fill="none"
            stroke={GREEN} strokeWidth={6}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (circumference * progress / 100)}
            strokeLinecap="round"
            transform="rotate(-90 44 44)"
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

    {/* COMMITMENTS */}
    <div style={{ marginBottom: 32 }}>
      <p style={{ fontSize: 10, letterSpacing: 2, color: C.textSub, textTransform: "uppercase", marginBottom: 16 }}>Commitments</p>
      {commitments.length === 0 && (
        <p style={{ color: C.textMuted, fontSize: 14 }}>Nog geen commitments voor vandaag.</p>
      )}
      {commitments.slice(0, showAll ? commitments.length : 5).map(c => (
        <div key={c.id} onClick={() => toggleDone(c.id, c.done)}
          style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: `1px solid ${C.borderSub}`, cursor: "pointer" }}>
          <div style={{
            width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
            border: c.done ? "none" : `2px solid ${C.border}`,
            background: c.done ? GREEN : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            {c.done && <span style={{ color: "#000", fontSize: 13, fontWeight: "bold" }}>✓</span>}
          </div>
          <span style={{ fontSize: 15, color: c.done ? C.textSub : C.text, textDecoration: c.done ? "line-through" : "none" }}>
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

    {/* REFLECTIE */}
    <div style={{ marginBottom: 32 }}>
      <p style={{ fontSize: 10, letterSpacing: 2, color: C.textSub, textTransform: "uppercase", marginBottom: 16 }}>Reflectie</p>
      <div style={{ background: C.card, borderRadius: 12, padding: 20, border: `1px solid ${C.borderSub}` }}>
        <p style={{ fontSize: 15, marginBottom: 16, color: C.text }}>Heb je je commitments gehaald?</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setCompleted(true)} style={{
            flex: 1, padding: "10px 0", borderRadius: 8, border: "none", cursor: "pointer",
            background: completed === true ? "#166534" : C.cardAlt,
            color: completed === true ? GREEN : C.textSub,
            fontWeight: completed === true ? "bold" : "normal", fontSize: 14
          }}>Ja</button>
          <button onClick={() => setCompleted(false)} style={{
            flex: 1, padding: "10px 0", borderRadius: 8, border: "none", cursor: "pointer",
            background: completed === false ? "#2a1a1a" : C.cardAlt,
            color: completed === false ? "#ef4444" : C.textSub,
            fontWeight: completed === false ? "bold" : "normal", fontSize: 14
          }}>Nee</button>
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

    {/* WEEKGRID */}
    <div style={{ marginBottom: 32 }}>
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 8px #22c55e55, 0 0 16px #22c55e22; }
          50%       { box-shadow: 0 0 12px #22c55e88, 0 0 24px #22c55e44; }
        }
      `}</style>
      <p style={{ fontSize: 10, letterSpacing: 2, color: C.textSub, textTransform: "uppercase", marginBottom: 16 }}>Deze week</p>

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

                let boxStyle    = {}
                let content     = null
                let labelColor  = C.textMuted
                let labelWeight = "normal"

                if (isToekomst) {
                  boxStyle = { background: C.cardAlt, border: `1px dashed ${C.border}` }
                } else if (isVandaag) {
                  boxStyle = { background: "#0a1a0f", border: "1px solid #1a4d2a", animation: "pulseGlow 2.5s ease-in-out infinite" }
                  labelColor  = GREEN
                  labelWeight = "bold"
                  content = (
                    <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${GREEN}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {heeftCheckIn && score > 0 && <span style={{ color: GREEN, fontSize: 11, fontWeight: "bold" }}>✓</span>}
                    </div>
                  )
                } else if (isGreen) {
                  boxStyle = { background: "#0a1a0f", border: "1px solid #1a4d2a", boxShadow: "0 0 8px #22c55e66, 0 0 16px #22c55e22" }
                  content = (
                    <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${GREEN}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ color: GREEN, fontSize: 11, fontWeight: "bold" }}>✓</span>
                    </div>
                  )
                } else if (isOranje) {
                  boxStyle = { background: "#1a1500", border: "1px solid #3d3000" }
                  content = <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid #3d3000", borderTopColor: "#c8900a" }} />
                } else if (isRood) {
                  boxStyle = { background: "#1f0f0f", border: "1px solid #3d1a1a" }
                  content = <span style={{ color: "#7a2020", fontSize: 16, fontWeight: "bold" }}>×</span>
                } else {
                  boxStyle = { background: C.cardAlt, border: `1px solid ${C.border}` }
                }

                return (
                  <div key={datum} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, ...boxStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {content}
                    </div>
                    <span style={{ fontSize: 10, color: labelColor, fontWeight: labelWeight }}>{dagNamen[i]}</span>
                  </div>
                )
              })}
            </div>
            <p style={{ color: C.textMuted, fontSize: 12, marginTop: 14 }}>
              {actiefDagen} van 7 dagen actief deze week
            </p>
          </>
        )
      })()}
    </div>

  </div>

  {/* FLOATING INPUT */}
  <div style={{
    position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
    width: "100%", maxWidth: 420,
    padding: "12px 16px", background: C.bg,
    borderTop: `1px solid ${C.borderSub}`,
    display: "flex", gap: 10, alignItems: "center"
  }}>
    <input
      value={text} onChange={e => setText(e.target.value)}
      onKeyDown={e => e.key === "Enter" && text && addCommitment()}
      placeholder="Voeg een commitment toe..."
      style={{ flex: 1, padding: "12px 16px", borderRadius: 24, border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: 14, outline: "none" }}
    />
    <button onClick={addCommitment} style={{
      width: 44, height: 44, borderRadius: "50%", border: "none",
      background: text ? GREEN : C.card, cursor: "pointer",
      fontSize: 22, color: text ? "#000" : C.textMuted,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, transition: "background 0.2s"
    }}>
      +
    </button>
  </div>

</div>
)

}
