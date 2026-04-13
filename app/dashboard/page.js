"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "raoul87@gmail.com"
const GREEN = "#22c55e"
const CARD_BG = "#111"
const BORDER = "#1e1e1e"

// ─── Sidebar ────────────────────────────────────────────────
function Sidebar({ active, setActive }) {
  const nav = ["Overview", "Clients", "Commitments", "Insights", "Settings"]
  return (
    <div style={{
      width: 220, minHeight: "100vh", background: "#0a0a0a",
      borderRight: `1px solid ${BORDER}`, padding: "28px 0", flexShrink: 0,
      display: "flex", flexDirection: "column"
    }}>
      <div style={{ padding: "0 24px 32px" }}>
        <img src="/logo.png" alt="AXIS" style={{ width: 90, height: 34, mixBlendMode: "screen" }} />
        <p style={{ color: "#333", fontSize: 10, letterSpacing: 1.5, marginTop: 6, textTransform: "uppercase" }}>
          Coach Dashboard
        </p>
      </div>
      {nav.map(item => (
        <button key={item} onClick={() => setActive(item)} style={{
          display: "block", width: "100%", padding: "11px 24px",
          textAlign: "left", background: active === item ? "#161616" : "transparent",
          border: "none", borderLeft: active === item ? `3px solid ${GREEN}` : "3px solid transparent",
          color: active === item ? "#fff" : "#555", fontSize: 14,
          cursor: "pointer", transition: "all 0.15s"
        }}>
          {item}
        </button>
      ))}
    </div>
  )
}

// ─── Stat Card ───────────────────────────────────────────────
function StatCard({ label, value, sub }) {
  return (
    <div style={{
      background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12,
      padding: "20px 24px", flex: 1
    }}>
      <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>{label}</p>
      <p style={{ fontSize: 32, fontWeight: "bold", color: "#fff", margin: 0 }}>{value}</p>
      {sub && <p style={{ color: "#444", fontSize: 12, marginTop: 6 }}>{sub}</p>}
    </div>
  )
}

// ─── Weekly Chart (SVG) ──────────────────────────────────────
function WeeklyChart({ data }) {
  const W = 340, H = 120, PAD = 16
  const max = Math.max(...data.map(d => d.count), 1)
  const points = data.map((d, i) => {
    const x = PAD + (i / (data.length - 1)) * (W - PAD * 2)
    const y = H - PAD - ((d.count / max) * (H - PAD * 2))
    return { x, y, ...d }
  })
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ")
  const fillD = `${pathD} L${points[points.length-1].x},${H} L${points[0].x},${H} Z`

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GREEN} stopOpacity="0.3" />
          <stop offset="100%" stopColor={GREEN} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill="url(#chartGrad)" />
      <path d={pathD} fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} fill={GREEN} />
          <text x={p.x} y={H - 2} textAnchor="middle" fill="#444" fontSize="9">{p.label}</text>
        </g>
      ))}
    </svg>
  )
}

// ─── Status Badge ────────────────────────────────────────────
function Badge({ status }) {
  const map = {
    Done:        { bg: "#14532d", color: GREEN },
    "In progress": { bg: "#1a1a00", color: "#facc15" },
    Missed:      { bg: "#2a0a0a", color: "#ef4444" },
    Inactief:    { bg: "#1a1a1a", color: "#444" },
  }
  const s = map[status] || map["Inactief"]
  return (
    <span style={{
      background: s.bg, color: s.color, fontSize: 11,
      padding: "3px 10px", borderRadius: 20, fontWeight: "bold"
    }}>
      {status}
    </span>
  )
}

// ─── Main Page ───────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter()
  const [activeNav, setActiveNav] = useState("Overview")
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  const [users, setUsers]           = useState([])
  const [todayCommits, setTodayCommits] = useState([])
  const [weeklyData, setWeeklyData] = useState([])
  const [todayReflections, setTodayReflections] = useState([])

  // Auth check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/login"); return }
      if (session.user.email !== ADMIN_EMAIL) { router.replace("/"); return }
      setAuthorized(true)
    })
  }, [])

  // Data laden
  useEffect(() => {
    if (!authorized) return
    loadAll()
  }, [authorized])

  async function loadAll() {
    setLoading(true)
    const today = new Date().toISOString().split("T")[0]

    const [
      { data: usersData },
      { data: commitsData },
      { data: checkinsData },
      { data: reflectionsData },
    ] = await Promise.all([
      supabase.from("users").select("id, auth_user_id, whatsapp_number, name, streak, missed_days, awaiting_reflection").not("whatsapp_number", "is", null).order("id", { ascending: true }),
      supabase.from("commitments").select("user_id, text, done, date").eq("date", today),
      supabase.from("check_ins").select("user_id, sent_at, type").eq("type", "evening").gte("sent_at", new Date(Date.now() - 7 * 86400000).toISOString()),
      supabase.from("reflections").select("user_id, completed, created_at").gte("created_at", `${today}T00:00:00`),
    ])

    setUsers(usersData || [])
    setTodayCommits(commitsData || [])
    setTodayReflections(reflectionsData || [])

    // Weekly data: tel evening check-ins per dag
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return {
        date: d.toISOString().split("T")[0],
        label: d.toLocaleDateString("nl-NL", { weekday: "short" }),
        count: 0,
      }
    })
    ;(checkinsData || []).forEach(c => {
      const day = c.sent_at.split("T")[0]
      const found = days.find(d => d.date === day)
      if (found) found.count++
    })
    setWeeklyData(days)
    setLoading(false)
  }

  if (!authorized || loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f0f0f", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#333", fontSize: 14 }}>{!authorized ? "Verificeren..." : "Laden..."}</p>
      </div>
    )
  }

  // ── Stats berekenen ──
  const activeClients = users.length
  const todayActiveUsers = new Set(todayCommits.map(c => c.user_id)).size
  const avgExecution = users.length === 0 ? 0 : Math.round(
    users.reduce((sum, u) => {
      const total = (u.streak || 0) + (u.missed_days || 0)
      return sum + (total === 0 ? 0 : (u.streak / total) * 100)
    }, 0) / users.length
  )
  const activeStreaks = users.filter(u => u.streak > 0).length
  const longestStreak = users.reduce((max, u) => Math.max(max, u.streak || 0), 0)

  // ── Client status bepalen ──
  const reflectedToday = new Set(todayReflections.map(r => r.user_id))
  const committedToday = new Set(todayCommits.map(c => c.user_id))

  function getClientStatus(user) {
    if (reflectedToday.has(user.auth_user_id)) return "Done"
    if (committedToday.has(user.auth_user_id)) return "In progress"
    if (committedToday.size > 0) return "Missed"
    return "Inactief"
  }

  function getTodayCommitment(user) {
    const commits = todayCommits.filter(c => c.user_id === user.auth_user_id)
    if (commits.length === 0) return "—"
    const done = commits.filter(c => c.done).length
    return `${done}/${commits.length} afgevinkt`
  }

  // ── Insights ──
  const mostConsistent = [...users].sort((a, b) => (b.streak || 0) - (a.streak || 0))[0]
  const needsSupport   = [...users].sort((a, b) => (b.missed_days || 0) - (a.missed_days || 0))[0]
  const onTrack        = users.filter(u => (u.streak || 0) > 3 && (u.missed_days || 0) === 0)

  const shortNum = (n) => n ? n.replace("whatsapp:", "").replace("+31", "0") : "—"
  const displayName = (user) => user?.name || shortNum(user?.whatsapp_number)

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0f0f0f", color: "#fff", fontFamily: "sans-serif" }}>
      <Sidebar active={activeNav} setActive={setActiveNav} />

      <div style={{ flex: 1, padding: "32px 32px 64px", overflowY: "auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: "bold", margin: 0 }}>
            {activeNav}
          </h1>
          <p style={{ color: "#444", fontSize: 13, marginTop: 6 }}>
            {new Date().toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>

        {(activeNav === "Overview" || activeNav === "Clients") && (
          <>
            {/* Stat Cards */}
            <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
              <StatCard label="Active Clients"        value={activeClients}  sub={`${todayActiveUsers} actief vandaag`} />
              <StatCard label="Today's Commitments"   value={todayActiveUsers} sub={`${todayCommits.length} commitments totaal`} />
              <StatCard label="Avg. Execution %"      value={`${avgExecution}%`} sub="gemiddeld over alle users" />
              <StatCard label="Current Streaks"       value={activeStreaks}   sub={`langste streak: ${longestStreak} ${longestStreak === 1 ? "dag" : "dagen"}`} />
            </div>

            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>

              {/* Clients tabel */}
              <div style={{ flex: 2, minWidth: 320, background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${BORDER}` }}>
                  <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase" }}>Clients</p>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                      {["Client", "Streak", "Vandaag", "Status"].map(h => (
                        <th key={h} style={{ padding: "10px 20px", textAlign: "left", color: "#444", fontSize: 11, fontWeight: "normal", letterSpacing: 1 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <td style={{ padding: "14px 20px" }}>
                          <p style={{ fontSize: 13, color: "#fff", margin: 0 }}>{displayName(user)}</p>
                          {user.name && <p style={{ fontSize: 11, color: "#444", margin: "2px 0 0" }}>{shortNum(user.whatsapp_number)}</p>}
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <span style={{ color: (user.streak || 0) > 0 ? GREEN : "#444", fontSize: 13, fontWeight: "bold" }}>
                            🔥 {user.streak || 0}
                          </span>
                        </td>
                        <td style={{ padding: "14px 20px", fontSize: 12, color: "#666" }}>
                          {getTodayCommitment(user)}
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <Badge status={getClientStatus(user)} />
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan={4} style={{ padding: 24, color: "#333", textAlign: "center", fontSize: 13 }}>Geen clients gevonden</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Weekly Progress */}
              <div style={{ flex: 1, minWidth: 280, background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "20px 24px" }}>
                <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 20 }}>Weekly Check-outs</p>
                <WeeklyChart data={weeklyData} />
                <p style={{ color: "#333", fontSize: 11, marginTop: 16, textAlign: "center" }}>
                  avond check-ins afgelopen 7 dagen
                </p>
              </div>

            </div>
          </>
        )}

        {/* Commitments tab */}
        {activeNav === "Commitments" && (
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${BORDER}` }}>
              <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase" }}>Commitments vandaag</p>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {["Client", "Commitment", "Afgevinkt"].map(h => (
                    <th key={h} style={{ padding: "10px 20px", textAlign: "left", color: "#444", fontSize: 11, fontWeight: "normal" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {todayCommits.map((c, i) => {
                  const user = users.find(u => u.auth_user_id === c.user_id)
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td style={{ padding: "14px 20px" }}>
                        <p style={{ fontSize: 13, color: "#ccc", margin: 0 }}>{displayName(user)}</p>
                        {user?.name && <p style={{ fontSize: 11, color: "#444", margin: "2px 0 0" }}>{shortNum(user?.whatsapp_number)}</p>}
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: 13, color: "#ccc" }}>{c.text}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ color: c.done ? GREEN : "#444", fontSize: 13 }}>{c.done ? "✓" : "—"}</span>
                      </td>
                    </tr>
                  )
                })}
                {todayCommits.length === 0 && (
                  <tr><td colSpan={3} style={{ padding: 24, color: "#333", textAlign: "center", fontSize: 13 }}>Nog geen commitments vandaag</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Insights tab */}
        {activeNav === "Insights" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>

              <div style={{ flex: 1, minWidth: 240, background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24 }}>
                <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16 }}>Most Consistent</p>
                {mostConsistent ? (
                  <>
                    <p style={{ fontSize: 16, color: "#fff", marginBottom: 4 }}>{displayName(mostConsistent)}</p>
                    {mostConsistent.name && <p style={{ fontSize: 11, color: "#444", margin: "-2px 0 8px" }}>{shortNum(mostConsistent.whatsapp_number)}</p>}
                    <p style={{ color: GREEN, fontSize: 13 }}>🔥 {mostConsistent.streak} {mostConsistent.streak === 1 ? "dag" : "dagen"} streak</p>
                  </>
                ) : <p style={{ color: "#333" }}>Geen data</p>}
              </div>

              <div style={{ flex: 1, minWidth: 240, background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24 }}>
                <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16 }}>Needs Support</p>
                {needsSupport ? (
                  <>
                    <p style={{ fontSize: 16, color: "#fff", marginBottom: 4 }}>{displayName(needsSupport)}</p>
                    {needsSupport.name && <p style={{ fontSize: 11, color: "#444", margin: "-2px 0 8px" }}>{shortNum(needsSupport.whatsapp_number)}</p>}
                    <p style={{ color: "#ef4444", fontSize: 13 }}>⚠️ {needsSupport.missed_days} gemiste {needsSupport.missed_days === 1 ? "dag" : "dagen"}</p>
                  </>
                ) : <p style={{ color: "#333" }}>Geen data</p>}
              </div>

              <div style={{ flex: 1, minWidth: 240, background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24 }}>
                <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16 }}>On Track</p>
                <p style={{ fontSize: 32, fontWeight: "bold", color: GREEN, margin: 0 }}>{onTrack.length}</p>
                <p style={{ color: "#444", fontSize: 12, marginTop: 6 }}>streak &gt; 3 en geen gemiste dagen</p>
              </div>

            </div>

            {/* Volume knob overview */}
            <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24 }}>
              <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 20 }}>Volume Knob per Client</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {users.map(u => {
                  const missed = u.missed_days || 0
                  const str = u.streak || 0
                  const tone = missed >= 4 ? "brutal" : missed >= 2 ? "hard" : str >= 7 ? "soft" : "medium"
                  const toneColor = { brutal: "#ef4444", hard: "#f97316", medium: GREEN, soft: "#86efac" }
                  return (
                    <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <span style={{ color: "#ccc", fontSize: 12, width: 120 }}>{displayName(u)}</span>
                      <span style={{ background: toneColor[tone] + "22", color: toneColor[tone], fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: "bold", width: 60, textAlign: "center" }}>{tone}</span>
                      <span style={{ color: "#333", fontSize: 11 }}>streak {str} · gemist {missed}</span>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        )}

        {/* Settings tab */}
        {activeNav === "Settings" && (
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 32, maxWidth: 480 }}>
            <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 24 }}>Instellingen</p>
            <p style={{ color: "#666", fontSize: 13, marginBottom: 8 }}>Admin email</p>
            <p style={{ color: "#fff", fontSize: 14, marginBottom: 24 }}>{ADMIN_EMAIL}</p>
            <p style={{ color: "#666", fontSize: 13, marginBottom: 8 }}>Cron tijden</p>
            <p style={{ color: "#aaa", fontSize: 13 }}>☀️ Ochtend: 08:00 NL · 🌙 Avond: 21:00 NL · 🕛 Midnight: 23:59 NL</p>
          </div>
        )}

      </div>
    </div>
  )
}
