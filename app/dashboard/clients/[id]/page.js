"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "../../../../lib/supabase"

const COACH_EMAILS = ["raoul87@gmail.com", "jobbrinkman1998@gmail.com"]
const GREEN  = "#22c55e"
const BORDER = "#1e1e1e"
const CARD   = "#111"

// ── Mini line chart (SVG, no deps) ──────────────────────────────
function MiniChart({ points, color = GREEN, height = 80 }) {
  if (!points || points.length < 2) return null
  const W = 320, H = height, PAD = 12
  const vals = points.map(p => p.y)
  const min = Math.min(...vals), max = Math.max(...vals)
  const range = max - min || 1
  const coords = points.map((p, i) => ({
    x: PAD + (i / (points.length - 1)) * (W - PAD * 2),
    y: H - PAD - ((p.y - min) / range) * (H - PAD * 2),
    label: p.label,
  }))
  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ")
  const fill = `${path} L${coords[coords.length - 1].x},${H} L${coords[0].x},${H} Z`
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#grad-${color.replace("#", "")})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y} r={3} fill={color} />
          <text x={c.x} y={H - 1} textAnchor="middle" fill="#444" fontSize="8">{c.label}</text>
        </g>
      ))}
    </svg>
  )
}

function Badge({ status }) {
  const map = {
    Done:          { bg: "#14532d", color: GREEN },
    "In Progress": { bg: "#1a1a00", color: "#facc15" },
    Missed:        { bg: "#2a0a0a", color: "#ef4444" },
    Inactive:      { bg: "#1a1a1a", color: "#444" },
  }
  const s = map[status] || map["Inactive"]
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: "bold" }}>
      {status}
    </span>
  )
}

function extractValue(raw) {
  if (!raw) return "—"
  const m = raw.match(/(\d+(?:[.,]\d+)?)\s*(kg|kcal|cal|km|stap(?:pen)?|min(?:uten)?|uur)/i)
  if (m) return `${m[1].replace(",", ".")} ${m[2].toLowerCase().replace("stappen", "stap").replace("minuten", "min")}`
  if (/^\s*\d+([.,]\d+)?\s*$/.test(raw)) return raw.trim()
  return raw.length <= 14 ? raw : raw.slice(0, 14) + "…"
}

function fmtDate(d) {
  if (!d) return "—"
  const p = d.split("-")
  return p.length === 3 ? `${p[2]}/${p[1]}` : d
}

function fmtFull(d) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })
}

function fmtTime(ts) {
  if (!ts) return ""
  return new Date(ts).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })
}

const toneMap = { brutal: "#ef4444", hard: "#f97316", medium: GREEN, soft: "#86efac" }

export default function ClientDetail() {
  const router = useRouter()
  const { id } = useParams()

  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading]       = useState(true)
  const [user, setUser]             = useState(null)
  const [commitments, setCommitments] = useState([])
  const [metrics, setMetrics]         = useState([])
  const [conversations, setConversations] = useState([])
  const [activeTab, setActiveTab]     = useState("overview")

  const [kcalDoel,         setKcalDoel]         = useState("")
  const [eiwittenDoel,     setEiwittenDoel]      = useState("")
  const [koolhydratenDoel, setKoolhydratenDoel]  = useState("")
  const [vettenDoel,       setVettenDoel]        = useState("")
  const [savingGoals,      setSavingGoals]       = useState(false)
  const [goalsSaved,       setGoalsSaved]        = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/login"); return }
      if (!COACH_EMAILS.includes(session.user.email)) { router.replace("/"); return }
      setAuthorized(true)
    })
  }, [])

  useEffect(() => {
    if (!authorized || !id) return
    loadClient()
  }, [authorized, id])

  async function loadClient() {
    setLoading(true)

    const [
      { data: userData },
    ] = await Promise.all([
      supabase.from("users").select("id, auth_user_id, name, whatsapp_number, streak, missed_days, awaiting_reflection, kcal_doel, eiwitten_doel, koolhydraten_doel, vetten_doel").eq("id", id).single(),
    ])

    if (!userData) { setLoading(false); return }
    setUser(userData)
    if (userData.kcal_doel)         setKcalDoel(String(userData.kcal_doel))
    if (userData.eiwitten_doel)     setEiwittenDoel(String(userData.eiwitten_doel))
    if (userData.koolhydraten_doel) setKoolhydratenDoel(String(userData.koolhydraten_doel))
    if (userData.vetten_doel)       setVettenDoel(String(userData.vetten_doel))

    const uid = userData.auth_user_id || userData.id

    const [
      { data: commitsData },
      { data: metricsData },
      { data: convoData },
    ] = await Promise.all([
      supabase.from("commitments").select("text, date, done").eq("user_id", uid).order("date", { ascending: false }).limit(60),
      supabase.from("metrics").select("type, waarde, datum").eq("user_id", uid).order("datum", { ascending: false }).limit(100),
      supabase.from("conversations").select("role, content, created_at").eq("user_id", userData.id).order("created_at", { ascending: false }).limit(40),
    ])

    setCommitments(commitsData || [])
    setMetrics(metricsData || [])
    setConversations((convoData || []).reverse())
    setLoading(false)
  }

  if (!authorized || loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f0f0f", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#333", fontSize: 14 }}>{!authorized ? "Verifying..." : "Loading..."}</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f0f0f", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#555", fontSize: 14 }}>Client not found.</p>
      </div>
    )
  }

  // ── Computed ──
  const todayStr     = new Date().toISOString().split("T")[0]
  const tone         = (user.missed_days >= 4) ? "brutal" : (user.missed_days >= 2) ? "hard" : (user.streak >= 7) ? "soft" : "medium"
  const shortNum     = (n) => n ? n.replace("whatsapp:", "").replace("+31", "0") : "—"
  const displayName  = user.name || shortNum(user.whatsapp_number)
  const totalDays    = (user.streak || 0) + (user.missed_days || 0)
  const execRate     = totalDays === 0 ? 0 : Math.round((user.streak / totalDays) * 100)

  const todayCommits = commitments.filter(c => c.date === todayStr)
  const doneToday    = todayCommits.filter(c => c.done).length

  const weightMetrics = metrics.filter(m => m.type === "gewicht" || m.type === "weight").slice(0, 20).reverse()
  const kcalMetrics   = metrics.filter(m => m.type === "voeding" || m.type === "calorie").slice(0, 20).reverse()

  const weightPoints  = weightMetrics.map(m => ({ y: parseFloat(m.waarde) || 0, label: fmtDate(m.datum) })).filter(p => p.y > 0)
  const kcalPoints    = kcalMetrics.map(m => ({ y: parseFloat(m.waarde) || 0, label: fmtDate(m.datum) })).filter(p => p.y > 0)

  const latestWeight  = weightMetrics[weightMetrics.length - 1]
  const prevWeight    = weightMetrics[weightMetrics.length - 2]
  const weightDelta   = latestWeight && prevWeight
    ? (parseFloat(latestWeight.waarde) - parseFloat(prevWeight.waarde)).toFixed(1)
    : null

  const completionByDay = (() => {
    const map = {}
    commitments.forEach(c => {
      if (!map[c.date]) map[c.date] = { total: 0, done: 0 }
      map[c.date].total++
      if (c.done) map[c.date].done++
    })
    return map
  })()

  // 4-week grid
  const grid = Array.from({ length: 28 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (27 - i))
    const ds = d.toISOString().split("T")[0]
    const day = completionByDay[ds]
    return { date: ds, label: d.getDate(), day: d.toLocaleDateString("nl-NL", { weekday: "short" }), state: !day ? "empty" : day.done > 0 ? "done" : "missed" }
  })

  async function saveNutritionGoals() {
    if (!kcalDoel || savingGoals) return
    setSavingGoals(true)
    await supabase.from("users").update({
      kcal_doel:          parseInt(kcalDoel) || null,
      eiwitten_doel:      eiwittenDoel      ? parseInt(eiwittenDoel)      : null,
      koolhydraten_doel:  koolhydratenDoel  ? parseInt(koolhydratenDoel)  : null,
      vetten_doel:        vettenDoel        ? parseInt(vettenDoel)        : null,
      doelen_door_coach:  true,
    }).eq("id", id)
    setSavingGoals(false)
    setGoalsSaved(true)
    setTimeout(() => setGoalsSaved(false), 2500)
  }

  const TABS = [
    { value: "overview", label: "Overview" },
    { value: "commitments", label: "Commitments" },
    { value: "metrics", label: "Metrics" },
    { value: "messages", label: "Messages" },
  ]

  const TH = { padding: "10px 16px", textAlign: "left", color: "#444", fontSize: 11, fontWeight: "normal", letterSpacing: 1, textTransform: "uppercase" }
  const TD = { padding: "12px 16px" }

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f0f", color: "#fff", fontFamily: "sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: "20px 32px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 0 }}>←</button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 20, fontWeight: "bold", margin: 0 }}>{displayName}</h1>
          {user.name && <p style={{ color: "#444", fontSize: 12, margin: "3px 0 0" }}>{shortNum(user.whatsapp_number)}</p>}
        </div>
        <span style={{ background: toneMap[tone] + "22", color: toneMap[tone], fontSize: 11, padding: "4px 12px", borderRadius: 20, fontWeight: "bold" }}>{tone}</span>
        {user.awaiting_reflection && (
          <span style={{ background: "#1a1a00", color: "#facc15", fontSize: 11, padding: "4px 12px", borderRadius: 20 }}>awaiting reflection</span>
        )}
      </div>

      <div style={{ padding: "24px 32px", maxWidth: 1100 }}>

        {/* ── Stat row ── */}
        <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
          {[
            { label: "Streak", value: `🔥 ${user.streak || 0}`, sub: `${user.streak === 1 ? "day" : "days"} in a row`, color: (user.streak || 0) > 0 ? GREEN : "#444" },
            { label: "Missed Days", value: user.missed_days || 0, sub: "consecutive", color: (user.missed_days || 0) > 0 ? "#ef4444" : "#444" },
            { label: "Execution Rate", value: `${execRate}%`, sub: `${totalDays} total days`, color: execRate > 70 ? GREEN : execRate > 40 ? "#facc15" : "#ef4444" },
            { label: "Today", value: todayCommits.length > 0 ? `${doneToday}/${todayCommits.length}` : "—", sub: "commitments done", color: GREEN },
            { label: "Latest Weight", value: latestWeight ? extractValue(latestWeight.waarde) : "—", sub: latestWeight ? (weightDelta !== null ? `${weightDelta > 0 ? "+" : ""}${weightDelta} kg` : fmtDate(latestWeight.datum)) : "no data", color: weightDelta < 0 ? GREEN : weightDelta > 0 ? "#ef4444" : "#ccc" },
          ].map(s => (
            <div key={s.label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px 22px", flex: 1, minWidth: 140 }}>
              <p style={{ color: "#555", fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>{s.label}</p>
              <p style={{ fontSize: 26, fontWeight: "bold", color: s.color, margin: 0 }}>{s.value}</p>
              {s.sub && <p style={{ color: "#444", fontSize: 11, marginTop: 5 }}>{s.sub}</p>}
            </div>
          ))}
        </div>

        {/* ── Tab bar ── */}
        <div style={{ display: "flex", gap: 2, borderBottom: `1px solid ${BORDER}`, marginBottom: 24 }}>
          {TABS.map(t => (
            <button key={t.value} onClick={() => setActiveTab(t.value)} style={{
              padding: "10px 20px", border: "none", background: "transparent",
              borderBottom: activeTab === t.value ? `2px solid ${GREEN}` : "2px solid transparent",
              color: activeTab === t.value ? "#fff" : "#555", fontSize: 13, cursor: "pointer",
              transition: "all 0.15s", marginBottom: -1,
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>

            {/* 4-week grid */}
            <div style={{ flex: 1, minWidth: 300, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24 }}>
              <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 18 }}>Last 4 Weeks</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 5 }}>
                {["ma", "di", "wo", "do", "vr", "za", "zo"].map(d => (
                  <p key={d} style={{ fontSize: 9, color: "#444", textAlign: "center", margin: 0 }}>{d}</p>
                ))}
                {grid.map((g, i) => (
                  <div key={i} title={`${g.date}${g.state !== "empty" ? ` — ${g.state}` : ""}`}
                    style={{
                      width: "100%", aspectRatio: "1", borderRadius: 5,
                      background: g.state === "done" ? GREEN + "44" : g.state === "missed" ? "#ef444422" : "#1a1a1a",
                      border: g.date === todayStr ? `1px solid ${GREEN}` : "1px solid transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                    <span style={{ fontSize: 8, color: g.state === "done" ? GREEN : g.state === "missed" ? "#ef4444" : "#333" }}>{g.label}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                {[["done", GREEN, "Committed"], ["missed", "#ef4444", "Missed"], ["empty", "#1a1a1a", "No data"]].map(([s, c, l]) => (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: c + (s === "empty" ? "" : "44"), border: s === "empty" ? `1px solid #333` : "none" }} />
                    <span style={{ fontSize: 10, color: "#444" }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weight chart */}
            {weightPoints.length >= 2 && (
              <div style={{ flex: 1, minWidth: 280, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24 }}>
                <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 18 }}>Weight Trend</p>
                <MiniChart points={weightPoints} color={GREEN} height={90} />
                {latestWeight && (
                  <p style={{ color: "#444", fontSize: 11, marginTop: 12, textAlign: "right" }}>
                    Latest: <span style={{ color: "#ccc" }}>{extractValue(latestWeight.waarde)}</span>
                    {weightDelta !== null && (
                      <span style={{ color: weightDelta < 0 ? GREEN : "#ef4444", marginLeft: 6 }}>
                        {weightDelta > 0 ? "+" : ""}{weightDelta} kg
                      </span>
                    )}
                  </p>
                )}
              </div>
            )}

            {/* Kcal chart */}
            {kcalPoints.length >= 2 && (
              <div style={{ flex: 1, minWidth: 280, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24 }}>
                <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 18 }}>Calorie Intake</p>
                <MiniChart points={kcalPoints} color="#f97316" height={90} />
                {kcalMetrics.length > 0 && (
                  <p style={{ color: "#444", fontSize: 11, marginTop: 12, textAlign: "right" }}>
                    Latest: <span style={{ color: "#ccc" }}>{extractValue(kcalMetrics[kcalMetrics.length - 1].waarde)}</span>
                  </p>
                )}
              </div>
            )}

            {/* Voedingsdoelen */}
            <div style={{ width: "100%", background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24 }}>
              <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 20 }}>Voedingsdoelen</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14, marginBottom: 18 }}>
                {[
                  { label: "Kcal doel *", val: kcalDoel, set: setKcalDoel, placeholder: "bijv. 2000" },
                  { label: "Eiwitten (g)", val: eiwittenDoel, set: setEiwittenDoel, placeholder: "bijv. 150" },
                  { label: "Koolhydraten (g)", val: koolhydratenDoel, set: setKoolhydratenDoel, placeholder: "bijv. 200" },
                  { label: "Vetten (g)", val: vettenDoel, set: setVettenDoel, placeholder: "bijv. 70" },
                ].map(({ label, val, set, placeholder }) => (
                  <div key={label}>
                    <p style={{ color: "#555", fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 7 }}>{label}</p>
                    <input type="number" value={val} onChange={e => set(e.target.value)} placeholder={placeholder}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid #2a2a2a`, background: "#0a0a0a", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                  </div>
                ))}
              </div>
              <button onClick={saveNutritionGoals} disabled={!kcalDoel || savingGoals}
                style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: goalsSaved ? "#0a1a0f" : (!kcalDoel || savingGoals ? "#1a1a1a" : GREEN), color: goalsSaved ? GREEN : (!kcalDoel || savingGoals ? "#444" : "#000"), fontWeight: "bold", fontSize: 13, cursor: (!kcalDoel || savingGoals) ? "default" : "pointer" }}>
                {goalsSaved ? "✓ Opgeslagen" : savingGoals ? "Opslaan..." : "Opslaan"}
              </button>
            </div>

            {/* Recent commitments preview */}
            <div style={{ width: "100%", background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BORDER}` }}>
                <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", margin: 0 }}>Recent Commitments</p>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    {["Date", "Commitment", "Status"].map(h => <th key={h} style={TH}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {commitments.slice(0, 8).map((c, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td style={{ ...TD, fontSize: 12, color: "#555", whiteSpace: "nowrap" }}>{fmtDate(c.date)}</td>
                      <td style={{ ...TD, fontSize: 13, color: "#ccc" }}>{c.text}</td>
                      <td style={TD}><Badge status={c.done ? "Done" : c.date === todayStr ? "In Progress" : "Missed"} /></td>
                    </tr>
                  ))}
                  {commitments.length === 0 && (
                    <tr><td colSpan={3} style={{ padding: 24, color: "#333", textAlign: "center", fontSize: 13 }}>No commitments yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── COMMITMENTS TAB ── */}
        {activeTab === "commitments" && (
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {["Date", "Commitment", "Status"].map(h => <th key={h} style={TH}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {commitments.map((c, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <td style={{ ...TD, fontSize: 12, color: "#555", whiteSpace: "nowrap" }}>{fmtFull(c.date)}</td>
                    <td style={{ ...TD, fontSize: 13, color: "#ccc" }}>{c.text}</td>
                    <td style={TD}><Badge status={c.done ? "Done" : c.date === todayStr ? "In Progress" : "Missed"} /></td>
                  </tr>
                ))}
                {commitments.length === 0 && (
                  <tr><td colSpan={3} style={{ padding: 24, color: "#333", textAlign: "center", fontSize: 13 }}>No commitments found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── METRICS TAB ── */}
        {activeTab === "metrics" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {weightPoints.length >= 2 && (
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24 }}>
                <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 18 }}>Weight (kg)</p>
                <MiniChart points={weightPoints} color={GREEN} height={110} />
              </div>
            )}

            {kcalPoints.length >= 2 && (
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24 }}>
                <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 18 }}>Calories (kcal)</p>
                <MiniChart points={kcalPoints} color="#f97316" height={110} />
              </div>
            )}

            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BORDER}` }}>
                <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", margin: 0 }}>All Metrics</p>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    {["Date", "Type", "Value"].map(h => <th key={h} style={TH}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((m, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td style={{ ...TD, fontSize: 12, color: "#555", whiteSpace: "nowrap" }}>{fmtFull(m.datum)}</td>
                      <td style={{ ...TD, fontSize: 12, color: "#888" }}>{m.type}</td>
                      <td style={{ ...TD, fontSize: 13, color: "#ccc" }}>{extractValue(m.waarde)}</td>
                    </tr>
                  ))}
                  {metrics.length === 0 && (
                    <tr><td colSpan={3} style={{ padding: 24, color: "#333", textAlign: "center", fontSize: 13 }}>No metrics found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── MESSAGES TAB ── */}
        {activeTab === "messages" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {conversations.length === 0 && (
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 32, textAlign: "center" }}>
                <p style={{ color: "#333", fontSize: 13 }}>No conversation history yet</p>
              </div>
            )}
            {conversations.map((msg, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}>
                <div style={{
                  maxWidth: "70%", background: msg.role === "user" ? "#0a1a0f" : "#161616",
                  border: `1px solid ${msg.role === "user" ? GREEN + "44" : BORDER}`,
                  borderRadius: 12, padding: "10px 14px",
                }}>
                  <p style={{ fontSize: 13, color: msg.role === "user" ? "#ccc" : "#aaa", margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {msg.content}
                  </p>
                  <p style={{ fontSize: 10, color: "#333", margin: "6px 0 0", textAlign: "right" }}>
                    {msg.role === "user" ? "client" : "coach"} · {fmtTime(msg.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
