"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"

const COACH_EMAILS = ["raoul87@gmail.com", "jobbrinkman1998@gmail.com"]
const GREEN = "#22c55e"
const CARD_BG = "#111"
const BORDER = "#1e1e1e"

function Sidebar({ active, setActive }) {
  const nav = ["Overview", "Clients", "Commitments", "Insights", "Settings"]
  return (
    <div style={{ width: 220, minHeight: "100vh", background: "#0a0a0a", borderRight: `1px solid ${BORDER}`, padding: "28px 0", flexShrink: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "0 24px 32px" }}>
        <img src="/logo.png" alt="AXIS" style={{ width: 90, height: 34, mixBlendMode: "screen" }} />
        <p style={{ color: "#333", fontSize: 10, letterSpacing: 1.5, marginTop: 6, textTransform: "uppercase" }}>Coach Dashboard</p>
      </div>
      {nav.map(item => (
        <button key={item} onClick={() => setActive(item)} style={{
          display: "block", width: "100%", padding: "11px 24px", textAlign: "left",
          background: active === item ? "#161616" : "transparent", border: "none",
          borderLeft: active === item ? `3px solid ${GREEN}` : "3px solid transparent",
          color: active === item ? "#fff" : "#555", fontSize: 14, cursor: "pointer", transition: "all 0.15s",
        }}>
          {item}
        </button>
      ))}
    </div>
  )
}

function StatCard({ label, value, sub }) {
  return (
    <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "20px 24px", flex: 1 }}>
      <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>{label}</p>
      <p style={{ fontSize: 32, fontWeight: "bold", color: "#fff", margin: 0 }}>{value}</p>
      {sub && <p style={{ color: "#444", fontSize: 12, marginTop: 6 }}>{sub}</p>}
    </div>
  )
}

function WeeklyChart({ data }) {
  const W = 340, H = 120, PAD = 16
  const max = Math.max(...data.map(d => d.count), 1)
  const points = data.map((d, i) => {
    const x = PAD + (i / (data.length - 1)) * (W - PAD * 2)
    const y = H - PAD - ((d.count / max) * (H - PAD * 2))
    return { x, y, ...d }
  })
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ")
  const fillD = `${pathD} L${points[points.length - 1].x},${H} L${points[0].x},${H} Z`
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

function Badge({ status }) {
  const map = {
    Done:           { bg: "#14532d", color: GREEN },
    "In Progress":  { bg: "#1a1a00", color: "#facc15" },
    Missed:         { bg: "#2a0a0a", color: "#ef4444" },
    Inactive:       { bg: "#1a1a1a", color: "#444" },
  }
  const s = map[status] || map["Inactive"]
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: "bold" }}>
      {status}
    </span>
  )
}

function TabBar({ tabs, active, setActive }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {tabs.map(tab => (
        <button key={tab.value} onClick={() => setActive(tab.value)} style={{
          padding: "10px 18px", border: "none", background: "transparent",
          borderBottom: active === tab.value ? `2px solid ${GREEN}` : "2px solid transparent",
          color: active === tab.value ? "#fff" : "#555", fontSize: 13, cursor: "pointer",
          transition: "all 0.15s", marginBottom: -1,
        }}>
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// Extract clean numeric value from raw text like "Oké mijn gewicht is 78kg" → "78 kg"
function extractValue(raw) {
  if (!raw) return "—"
  const match = raw.match(/(\d+(?:[.,]\d+)?)\s*(kg|kcal|cal|km|stap(?:pen)?|min(?:uten)?|uur)/i)
  if (match) {
    const num = match[1].replace(",", ".")
    const unit = match[2].toLowerCase().replace("stappen", "stap").replace("minuten", "min")
    return `${num} ${unit}`
  }
  if (/^\s*\d+([.,]\d+)?\s*$/.test(raw)) return raw.trim()
  return raw.length <= 12 ? raw : raw.slice(0, 12) + "…"
}

export default function Dashboard() {
  const router = useRouter()
  const [activeNav, setActiveNav] = useState("Overview")
  const [loading, setLoading]     = useState(true)
  const [authorized, setAuthorized] = useState(false)

  const [users, setUsers]               = useState([])
  const [todayCommits, setTodayCommits] = useState([])
  const [recentCommits, setRecentCommits] = useState([])
  const [weeklyData, setWeeklyData]     = useState([])
  const [todayReflections, setTodayReflections] = useState([])
  const [metricsData, setMetricsData]   = useState([])
  const [authProfile, setAuthProfile]   = useState(null)

  const [clientSearch, setClientSearch] = useState("")
  const [clientSort, setClientSort]     = useState("streak")

  const [commitTab, setCommitTab]               = useState("today")
  const [historySearch, setHistorySearch]       = useState("")
  const [historyClientFilter, setHistoryClientFilter] = useState("")
  const [historyDateFilter, setHistoryDateFilter]     = useState("")

  const [deactivatedIds, setDeactivatedIds] = useState(new Set())
  const [conversations, setConversations]   = useState([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/login"); return }
      if (!COACH_EMAILS.includes(session.user.email)) { router.replace("/"); return }
      setAuthProfile(session.user)
      setAuthorized(true)
    })
  }, [])

  useEffect(() => {
    if (!authorized || !authProfile) return
    loadAll(authProfile.email)
  }, [authorized, authProfile])

  async function loadAll(coachEmail) {
    setLoading(true)
    const now      = new Date()
    const today    = now.toISOString().split("T")[0]
    const thirtyAgo = new Date(now)
    thirtyAgo.setDate(thirtyAgo.getDate() - 30)
    const thirtyAgoStr = thirtyAgo.toISOString().split("T")[0]

    const [
      { data: usersData },
      { data: commitsData },
      { data: recentCommitsData },
      { data: checkinsData },
      { data: reflectionsData },
      { data: metricsRaw },
      { data: conversationsRaw },
    ] = await Promise.all([
      supabase.from("users").select("id, auth_user_id, whatsapp_number, name, streak, missed_days, awaiting_reflection").not("whatsapp_number", "is", null).eq("coach_email", coachEmail).order("id", { ascending: true }),
      supabase.from("commitments").select("user_id, text, done, date").eq("date", today),
      supabase.from("commitments").select("user_id, text, done, date").gte("date", thirtyAgoStr).order("date", { ascending: false }).limit(500),
      supabase.from("check_ins").select("user_id, sent_at, type").eq("type", "evening").gte("sent_at", new Date(Date.now() - 7 * 86400000).toISOString()),
      supabase.from("reflections").select("user_id, completed, created_at").gte("created_at", `${today}T00:00:00`),
      supabase.from("metrics").select("user_id, type, waarde, datum").order("datum", { ascending: false }).limit(300),
      supabase.from("conversations").select("user_id, role, content, created_at").order("created_at", { ascending: false }).limit(200),
    ])

    setUsers(usersData || [])
    setTodayCommits(commitsData || [])
    setRecentCommits(recentCommitsData || [])
    setTodayReflections(reflectionsData || [])
    setMetricsData(metricsRaw || [])
    setConversations(conversationsRaw || [])

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return { date: d.toISOString().split("T")[0], label: d.toLocaleDateString("nl-NL", { weekday: "short" }), count: 0 }
    })
    ;(checkinsData || []).forEach(c => {
      const day = c.sent_at.split("T")[0]
      const found = days.find(d => d.date === day)
      if (found) found.count++
    })
    setWeeklyData(days)
    setLoading(false)
  }

  async function deactivateClient(userId) {
    setDeactivatedIds(prev => new Set([...prev, userId]))
    const { error } = await supabase.from("users").update({ active: false }).eq("id", userId)
    if (error) console.error("Deactivate failed:", error.message)
  }

  if (!authorized || loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f0f0f", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#333", fontSize: 14 }}>{!authorized ? "Verifying..." : "Loading..."}</p>
      </div>
    )
  }

  // ── Computed ──
  const todayStr         = new Date().toISOString().split("T")[0]
  const activeClients    = users.length
  const todayActiveUsers = new Set(todayCommits.map(c => c.user_id)).size
  const avgExecution     = users.length === 0 ? 0 : Math.round(
    users.reduce((sum, u) => {
      const total = (u.streak || 0) + (u.missed_days || 0)
      return sum + (total === 0 ? 0 : (u.streak / total) * 100)
    }, 0) / users.length
  )
  const activeStreaks  = users.filter(u => u.streak > 0).length
  const longestStreak = users.reduce((max, u) => Math.max(max, u.streak || 0), 0)

  const reflectedToday = new Set(todayReflections.map(r => r.user_id))
  const committedToday = new Set(todayCommits.map(c => c.user_id))

  function getClientStatus(user) {
    if (reflectedToday.has(user.auth_user_id)) return "Done"
    if (committedToday.has(user.auth_user_id)) return "In Progress"
    if (committedToday.size > 0) return "Missed"
    return "Inactive"
  }

  function getTodayCommitmentText(user) {
    const commits = todayCommits.filter(c => c.user_id === user.auth_user_id)
    if (commits.length === 0) return "—"
    const done = commits.filter(c => c.done).length
    return `${done}/${commits.length} checked`
  }

  // ── Insights ──
  const mostConsistent = [...users].sort((a, b) => (b.streak || 0) - (a.streak || 0))[0]
  const needsSupport   =
    [...users].filter(u => (u.streak || 0) === 0).sort((a, b) => (b.missed_days || 0) - (a.missed_days || 0))[0]
    || [...users].sort((a, b) => (b.missed_days || 0) - (a.missed_days || 0))[0]
  const onTrack       = users.filter(u => (u.streak || 0) > 3 && (u.missed_days || 0) === 0)
  const actionsNeeded = users.filter(u => (u.missed_days || 0) > 2 && !committedToday.has(u.auth_user_id))

  // ── Metrics helpers ──
  const getLatestWeight = (uid) => metricsData.find(m => m.user_id === uid && (m.type === "gewicht" || m.type === "weight")) ?? null
  const getWeightTrend  = (uid) => {
    const e = metricsData.filter(m => m.user_id === uid && m.type === "gewicht").slice(0, 3)
    if (e.length < 2) return null
    const l = parseFloat(e[0].waarde), f = parseFloat(e[e.length - 1].waarde)
    if (isNaN(l) || isNaN(f)) return null
    return l > f ? "up" : l < f ? "down" : "equal"
  }
  const hasTodayMetric = (uid) => metricsData.some(m => m.user_id === uid && m.datum === todayStr)
  const getLatestByType = (uid) => {
    const r = {}
    metricsData.filter(m => m.user_id === uid).forEach(m => { if (!r[m.type]) r[m.type] = m })
    return r
  }
  const getTodayMetric = (uid, type) =>
    metricsData.find(m => m.user_id === uid && m.type === type && m.datum === todayStr)

  const metricSentToday = new Set(
    users.filter(u => u.auth_user_id && hasTodayMetric(u.auth_user_id)).map(u => u.id)
  )

  // ── Helpers ──
  const shortNum    = (n) => n ? n.replace("whatsapp:", "").replace("+31", "0") : "—"
  const displayName = (user) => user?.name || shortNum(user?.whatsapp_number)
  const fmtDate     = (d) => { if (!d) return "—"; const p = d.split("-"); return p.length === 3 ? `${p[2]}/${p[1]}` : d }

  const toneMap   = { brutal: "#ef4444", hard: "#f97316", medium: GREEN, soft: "#86efac" }
  const getToneLabel = (u) => { const m = u.missed_days || 0, s = u.streak || 0; return m >= 4 ? "brutal" : m >= 2 ? "hard" : s >= 7 ? "soft" : "medium" }

  // ── Week / history commits ──
  const weekAgoStr    = (() => { const d = new Date(); d.setDate(d.getDate() - 6); return d.toISOString().split("T")[0] })()
  const weekCommits   = recentCommits.filter(c => c.date >= weekAgoStr)
  const historyCommits = recentCommits.filter(c => {
    if (historyDateFilter && c.date !== historyDateFilter) return false
    if (historySearch && !c.text.toLowerCase().includes(historySearch.toLowerCase())) return false
    if (historyClientFilter) {
      const user = users.find(u => u.auth_user_id === c.user_id)
      if (!user || user.id !== historyClientFilter) return false
    }
    return true
  })

  // ── Shared table styles ──
  const TH = { padding: "10px 20px", textAlign: "left", color: "#444", fontSize: 11, fontWeight: "normal", letterSpacing: 1 }
  const TD = { padding: "13px 20px" }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0f0f0f", color: "#fff", fontFamily: "sans-serif" }}>
      <Sidebar active={activeNav} setActive={setActiveNav} />

      <div style={{ flex: 1, padding: "32px 32px 64px", overflowY: "auto" }}>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: "bold", margin: 0 }}>{activeNav}</h1>
          <p style={{ color: "#444", fontSize: 13, marginTop: 6 }}>
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>

        {/* ── OVERVIEW ── */}
        {activeNav === "Overview" && (
          <>
            <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
              <StatCard label="Active Clients"      value={activeClients}     sub={`${todayActiveUsers} active today`} />
              <StatCard label="Today's Commitments" value={todayActiveUsers}   sub={`${todayCommits.length} total`} />
              <StatCard label="Avg. Execution"      value={`${avgExecution}%`} sub="average across all users" />
              <StatCard label="Current Streaks"     value={activeStreaks}      sub={`longest: ${longestStreak} ${longestStreak === 1 ? "day" : "days"}`} />
            </div>

            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              <div style={{ flex: 2, minWidth: 320, background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${BORDER}` }}>
                  <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase" }}>Clients</p>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                      {["Client", "Streak", "Weight", "Status"].map(h => <th key={h} style={TH}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => {
                      const w     = getLatestWeight(user.auth_user_id)
                      const trend = w ? getWeightTrend(user.auth_user_id) : null
                      const arrow = trend === "down" ? { sym: "↓", color: GREEN }
                                  : trend === "up"   ? { sym: "↑", color: "#ef4444" }
                                  : trend === "equal" ? { sym: "→", color: "#888" } : null
                      return (
                      <tr key={user.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <td style={TD}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <button onClick={() => router.push(`/dashboard/clients/${user.id}`)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
                              <p style={{ fontSize: 13, color: "#fff", margin: 0 }}>{displayName(user)}</p>
                            </button>
                            {metricSentToday.has(user.id) && <span title="Metric submitted today" style={{ fontSize: 13 }}>📊</span>}
                          </div>
                          {user.name && <p style={{ fontSize: 11, color: "#444", margin: "2px 0 0" }}>{shortNum(user.whatsapp_number)}</p>}
                        </td>
                        <td style={TD}>
                          <span style={{ color: (user.streak || 0) > 0 ? GREEN : "#444", fontSize: 13, fontWeight: "bold" }}>🔥 {user.streak || 0}</span>
                        </td>
                        <td style={TD}>
                          {w ? (
                            <span style={{ fontSize: 13, color: "#ccc", whiteSpace: "nowrap" }}>
                              {extractValue(w.waarde)} — {fmtDate(w.datum)}
                              {arrow && <span style={{ color: arrow.color, marginLeft: 5 }}>{arrow.sym}</span>}
                            </span>
                          ) : <span style={{ color: "#333", fontSize: 13 }}>—</span>}
                        </td>
                        <td style={TD}><Badge status={getClientStatus(user)} /></td>
                      </tr>
                      )
                    })}
                    {users.length === 0 && <tr><td colSpan={4} style={{ padding: 24, color: "#333", textAlign: "center", fontSize: 13 }}>No clients found</td></tr>}
                  </tbody>
                </table>
              </div>

              <div style={{ flex: 1, minWidth: 280, background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "20px 24px" }}>
                <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 20 }}>Weekly Check-outs</p>
                <WeeklyChart data={weeklyData} />
                <p style={{ color: "#333", fontSize: 11, marginTop: 16, textAlign: "center" }}>evening check-ins last 7 days</p>
              </div>
            </div>
          </>
        )}

        {/* ── CLIENTS ── */}
        {activeNav === "Clients" && (() => {
          const filtered = users
            .filter(u => {
              const q = clientSearch.toLowerCase()
              return !q || displayName(u).toLowerCase().includes(q) || shortNum(u.whatsapp_number).includes(q)
            })
            .sort((a, b) => clientSort === "streak"
              ? (b.streak || 0) - (a.streak || 0)
              : (b.missed_days || 0) - (a.missed_days || 0))
          return (
            <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BORDER}`, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <input value={clientSearch} onChange={e => setClientSearch(e.target.value)} placeholder="Search by name or number..."
                  style={{ flex: 1, minWidth: 200, padding: "8px 14px", borderRadius: 8, border: `1px solid #2a2a2a`, background: "#0a0a0a", color: "#fff", fontSize: 13, outline: "none" }} />
                <div style={{ display: "flex", gap: 6 }}>
                  {[["streak", "Streak"], ["missed", "Missed"]].map(([val, label]) => (
                    <button key={val} onClick={() => setClientSort(val)} style={{
                      padding: "7px 14px", borderRadius: 8, border: `1px solid ${clientSort === val ? GREEN : "#2a2a2a"}`,
                      background: clientSort === val ? "#0a1a0f" : "transparent",
                      color: clientSort === val ? GREEN : "#555", fontSize: 12, cursor: "pointer",
                    }}>↕ {label}</button>
                  ))}
                </div>
                <span style={{ color: "#444", fontSize: 12 }}>{filtered.length} clients</span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    {["Client", "Number", "Streak", "Missed", "Volume", "Weight", "Commitment", "Status"].map(h => (
                      <th key={h} style={{ ...TH, padding: "10px 16px", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(user => {
                    const tone = getToneLabel(user)
                    const w    = getLatestWeight(user.auth_user_id)
                    const trend = w ? getWeightTrend(user.auth_user_id) : null
                    const arrow = trend === "up" ? { sym: "↑", color: "#ef4444" } : trend === "down" ? { sym: "↓", color: GREEN } : trend === "equal" ? { sym: "→", color: "#888" } : null
                    return (
                      <tr key={user.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <td style={{ ...TD, padding: "12px 16px" }}>
                          <button onClick={() => router.push(`/dashboard/clients/${user.id}`)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
                            <p style={{ fontSize: 13, color: "#fff", margin: 0, whiteSpace: "nowrap" }}>{displayName(user)}</p>
                          </button>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "#555", whiteSpace: "nowrap" }}>{shortNum(user.whatsapp_number)}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ color: (user.streak || 0) > 0 ? GREEN : "#444", fontSize: 13, fontWeight: "bold" }}>🔥 {user.streak || 0}</span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: (user.missed_days || 0) > 0 ? "#ef4444" : "#444" }}>{user.missed_days || 0}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ background: toneMap[tone] + "22", color: toneMap[tone], fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: "bold" }}>{tone}</span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {w ? (
                            <div>
                              <span style={{ fontSize: 13, color: "#fff" }}>{extractValue(w.waarde)}</span>
                              {arrow && <span style={{ fontSize: 12, color: arrow.color, marginLeft: 4 }}>{arrow.sym}</span>}
                              <p style={{ fontSize: 10, color: "#444", margin: "2px 0 0" }}>{fmtDate(w.datum)}</p>
                            </div>
                          ) : <span style={{ color: "#333", fontSize: 12 }}>—</span>}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "#666", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {getTodayCommitmentText(user)}
                        </td>
                        <td style={{ padding: "12px 16px" }}><Badge status={getClientStatus(user)} /></td>
                      </tr>
                    )
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} style={{ padding: 24, color: "#333", textAlign: "center", fontSize: 13 }}>
                      {clientSearch ? "No clients found for this search" : "No clients found"}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )
        })()}

        {/* ── COMMITMENTS ── */}
        {activeNav === "Commitments" && (
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px 0", borderBottom: `1px solid ${BORDER}` }}>
              <TabBar
                tabs={[{ value: "today", label: "Today" }, { value: "week", label: "This Week" }, { value: "history", label: "History" }]}
                active={commitTab} setActive={setCommitTab}
              />
            </div>

            {commitTab === "today" && (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    {["Client", "Commitment", "Weight", "Kcal", "Status"].map(h => <th key={h} style={TH}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {todayCommits.map((c, i) => {
                    const user    = users.find(u => u.auth_user_id === c.user_id)
                    const weightM = getTodayMetric(c.user_id, "gewicht")
                    const kcalM   = getTodayMetric(c.user_id, "voeding") || getTodayMetric(c.user_id, "calorie")
                    return (
                      <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <td style={TD}>
                          <button onClick={() => user && router.push(`/dashboard/clients/${user.id}`)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
                            <p style={{ fontSize: 13, color: "#ccc", margin: 0 }}>{displayName(user)}</p>
                          </button>
                          {user?.name && <p style={{ fontSize: 11, color: "#444", margin: "2px 0 0" }}>{shortNum(user?.whatsapp_number)}</p>}
                        </td>
                        <td style={{ ...TD, fontSize: 13, color: "#ccc" }}>{c.text}</td>
                        <td style={{ ...TD, fontSize: 12, color: weightM ? "#fff" : "#333" }}>{weightM ? extractValue(weightM.waarde) : "—"}</td>
                        <td style={{ ...TD, fontSize: 12, color: kcalM ? "#fff" : "#333" }}>{kcalM ? extractValue(kcalM.waarde) : "—"}</td>
                        <td style={TD}><Badge status={c.done ? "Done" : "In Progress"} /></td>
                      </tr>
                    )
                  })}
                  {todayCommits.length === 0 && <tr><td colSpan={5} style={{ padding: 24, color: "#333", textAlign: "center", fontSize: 13 }}>No commitments today yet</td></tr>}
                </tbody>
              </table>
            )}

            {commitTab === "week" && (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    {["Date", "Client", "Commitment", "Status"].map(h => <th key={h} style={TH}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {weekCommits.map((c, i) => {
                    const user = users.find(u => u.auth_user_id === c.user_id)
                    return (
                      <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <td style={{ ...TD, fontSize: 12, color: "#555", whiteSpace: "nowrap" }}>{fmtDate(c.date)}</td>
                        <td style={TD}>
                          <button onClick={() => user && router.push(`/dashboard/clients/${user.id}`)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
                            <p style={{ fontSize: 13, color: "#ccc", margin: 0 }}>{displayName(user)}</p>
                          </button>
                        </td>
                        <td style={{ ...TD, fontSize: 13, color: "#ccc" }}>{c.text}</td>
                        <td style={TD}><Badge status={c.done ? "Done" : c.date === todayStr ? "In Progress" : "Missed"} /></td>
                      </tr>
                    )
                  })}
                  {weekCommits.length === 0 && <tr><td colSpan={4} style={{ padding: 24, color: "#333", textAlign: "center", fontSize: 13 }}>No commitments this week</td></tr>}
                </tbody>
              </table>
            )}

            {commitTab === "history" && (
              <>
                <div style={{ padding: "14px 20px", borderBottom: `1px solid ${BORDER}`, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <input value={historySearch} onChange={e => setHistorySearch(e.target.value)} placeholder="Search commitment text..."
                    style={{ flex: 2, minWidth: 180, padding: "7px 12px", borderRadius: 8, border: `1px solid #2a2a2a`, background: "#0a0a0a", color: "#fff", fontSize: 12, outline: "none" }} />
                  <select value={historyClientFilter} onChange={e => setHistoryClientFilter(e.target.value)}
                    style={{ flex: 1, minWidth: 140, padding: "7px 12px", borderRadius: 8, border: `1px solid #2a2a2a`, background: "#0a0a0a", color: historyClientFilter ? "#fff" : "#555", fontSize: 12, outline: "none" }}>
                    <option value="">All clients</option>
                    {users.map(u => <option key={u.id} value={u.id}>{displayName(u)}</option>)}
                  </select>
                  <input type="date" value={historyDateFilter} onChange={e => setHistoryDateFilter(e.target.value)}
                    style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid #2a2a2a`, background: "#0a0a0a", color: historyDateFilter ? "#fff" : "#555", fontSize: 12, outline: "none" }} />
                  {(historySearch || historyClientFilter || historyDateFilter) && (
                    <button onClick={() => { setHistorySearch(""); setHistoryClientFilter(""); setHistoryDateFilter("") }}
                      style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid #2a2a2a`, background: "transparent", color: "#555", fontSize: 12, cursor: "pointer" }}>
                      Clear
                    </button>
                  )}
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                      {["Date", "Client", "Commitment", "Status"].map(h => <th key={h} style={TH}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {historyCommits.map((c, i) => {
                      const user = users.find(u => u.auth_user_id === c.user_id)
                      return (
                        <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
                          <td style={{ ...TD, fontSize: 12, color: "#555", whiteSpace: "nowrap" }}>{fmtDate(c.date)}</td>
                          <td style={TD}>
                            <button onClick={() => user && router.push(`/dashboard/clients/${user.id}`)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
                              <p style={{ fontSize: 13, color: "#ccc", margin: 0 }}>{displayName(user)}</p>
                            </button>
                          </td>
                          <td style={{ ...TD, fontSize: 13, color: "#ccc" }}>{c.text}</td>
                          <td style={TD}><Badge status={c.done ? "Done" : c.date === todayStr ? "In Progress" : "Missed"} /></td>
                        </tr>
                      )
                    })}
                    {historyCommits.length === 0 && <tr><td colSpan={4} style={{ padding: 24, color: "#333", textAlign: "center", fontSize: 13 }}>No commitments found</td></tr>}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {/* ── INSIGHTS ── */}
        {activeNav === "Insights" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 240, background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24 }}>
                <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16 }}>Most Consistent</p>
                {mostConsistent ? (
                  <>
                    <button onClick={() => router.push(`/dashboard/clients/${mostConsistent.id}`)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
                      <p style={{ fontSize: 16, color: "#fff", marginBottom: 4 }}>{displayName(mostConsistent)}</p>
                    </button>
                    {mostConsistent.name && <p style={{ fontSize: 11, color: "#444", margin: "-2px 0 8px" }}>{shortNum(mostConsistent.whatsapp_number)}</p>}
                    <p style={{ color: GREEN, fontSize: 13 }}>🔥 {mostConsistent.streak} {mostConsistent.streak === 1 ? "day" : "days"} streak</p>
                  </>
                ) : <p style={{ color: "#333" }}>No data</p>}
              </div>

              <div style={{ flex: 1, minWidth: 240, background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24 }}>
                <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16 }}>Needs Support</p>
                {needsSupport ? (
                  <>
                    <button onClick={() => router.push(`/dashboard/clients/${needsSupport.id}`)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
                      <p style={{ fontSize: 16, color: "#fff", marginBottom: 4 }}>{displayName(needsSupport)}</p>
                    </button>
                    {needsSupport.name && <p style={{ fontSize: 11, color: "#444", margin: "-2px 0 8px" }}>{shortNum(needsSupport.whatsapp_number)}</p>}
                    <p style={{ color: "#ef4444", fontSize: 13 }}>⚠️ {needsSupport.missed_days} missed {needsSupport.missed_days === 1 ? "day" : "days"}</p>
                  </>
                ) : <p style={{ color: "#333" }}>No data</p>}
              </div>

              <div style={{ flex: 1, minWidth: 240, background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24 }}>
                <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16 }}>On Track</p>
                <p style={{ fontSize: 32, fontWeight: "bold", color: GREEN, margin: 0 }}>{onTrack.length}</p>
                <p style={{ color: "#444", fontSize: 12, marginTop: 6 }}>streak &gt; 3 and no missed days</p>
              </div>
            </div>

            {actionsNeeded.length > 0 && (
              <div style={{ background: "#110808", border: `1px solid #2a1a1a`, borderRadius: 12, padding: 24 }}>
                <p style={{ color: "#ef4444", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16 }}>
                  ⚠️ Action Required — {actionsNeeded.length} {actionsNeeded.length === 1 ? "client" : "clients"}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {actionsNeeded.map(u => (
                    <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <button onClick={() => router.push(`/dashboard/clients/${u.id}`)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
                        <span style={{ color: "#fff", fontSize: 13 }}>{displayName(u)}</span>
                      </button>
                      <span style={{ color: "#666", fontSize: 12 }}>{u.missed_days} missed days · no check-in today</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24 }}>
              <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 20 }}>Metrics Overview</p>
              {users.length === 0 ? <p style={{ color: "#333", fontSize: 13 }}>No clients</p> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {users.map(u => {
                    const byType = getLatestByType(u.auth_user_id)
                    const types  = Object.keys(byType)
                    return (
                      <div key={u.id} style={{ display: "flex", alignItems: "flex-start", gap: 16, paddingBottom: 14, borderBottom: `1px solid ${BORDER}` }}>
                        <span style={{ color: "#ccc", fontSize: 12, width: 120, flexShrink: 0, paddingTop: 2 }}>{displayName(u)}</span>
                        {types.length === 0
                          ? <span style={{ color: "#333", fontSize: 12 }}>No measurements yet</span>
                          : (
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                              {types.map(type => {
                                const m = byType[type]
                                return (
                                  <div key={type} style={{ background: "#1a1a1a", borderRadius: 8, padding: "6px 12px" }}>
                                    <p style={{ color: "#555", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>{type}</p>
                                    <p style={{ color: "#fff", fontSize: 13, margin: "3px 0 0" }}>{extractValue(m.waarde)}</p>
                                    <p style={{ color: "#444", fontSize: 10, margin: "2px 0 0" }}>{fmtDate(m.datum)}</p>
                                  </div>
                                )
                              })}
                            </div>
                          )
                        }
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24 }}>
              <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 20 }}>Volume Knob per Client</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {users.map(u => {
                  const tone = getToneLabel(u)
                  return (
                    <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <span style={{ color: "#ccc", fontSize: 12, width: 120 }}>{displayName(u)}</span>
                      <span style={{ background: toneMap[tone] + "22", color: toneMap[tone], fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: "bold", width: 60, textAlign: "center" }}>{tone}</span>
                      <span style={{ color: "#333", fontSize: 11 }}>streak {u.streak || 0} · missed {u.missed_days || 0}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ── CLIENT QUESTIONS ── */}
            {(() => {
              const QUESTION_RE = /\?|^(hoe|wat|waarom|hoeveel|kan ik|mag ik|wanneer)\b/i

              // Build ordered list of conversations chronologically for reply lookup
              const allConvos = [...conversations].reverse() // oldest first

              // Extract user questions with their AI reply
              const questions = []
              for (let i = 0; i < allConvos.length; i++) {
                const msg = allConvos[i]
                if (msg.role !== "user") continue
                if (!QUESTION_RE.test(msg.content.trim())) continue
                const reply = allConvos[i + 1]?.role === "assistant" ? allConvos[i + 1] : null
                const user  = users.find(u => u.id === msg.user_id)
                questions.push({ ...msg, reply, user })
              }

              // Sort most recent first, cap at 20
              const sorted = questions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 20)

              // Weekly stats
              const weekAgo = new Date(Date.now() - 7 * 86400000)
              const questionsThisWeek = questions.filter(q => new Date(q.created_at) > weekAgo)

              const questionsByUser = {}
              questions.forEach(q => {
                const uid = q.user_id
                questionsByUser[uid] = (questionsByUser[uid] || 0) + 1
              })
              const mostActiveId  = Object.entries(questionsByUser).sort((a, b) => b[1] - a[1])[0]?.[0]
              const mostActiveUser = mostActiveId ? users.find(u => u.id === mostActiveId) : null

              const fmtTs = (ts) => {
                if (!ts) return "—"
                return new Date(ts).toLocaleDateString("nl-NL", { day: "numeric", month: "short" }) + " " +
                       new Date(ts).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })
              }

              return (
                <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                    <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", margin: 0, flex: 1 }}>Client Questions</p>
                    <div style={{ display: "flex", gap: 20 }}>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ color: "#fff", fontSize: 18, fontWeight: "bold", margin: 0 }}>{questionsThisWeek.length}</p>
                        <p style={{ color: "#444", fontSize: 10, margin: "2px 0 0" }}>this week</p>
                      </div>
                      {mostActiveUser && (
                        <div style={{ textAlign: "right" }}>
                          <p style={{ color: GREEN, fontSize: 13, fontWeight: "bold", margin: 0 }}>{displayName(mostActiveUser)}</p>
                          <p style={{ color: "#444", fontSize: 10, margin: "2px 0 0" }}>most active · {questionsByUser[mostActiveId]}q</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {sorted.length === 0 ? (
                    <p style={{ padding: 24, color: "#333", fontSize: 13, textAlign: "center" }}>No client questions yet</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {sorted.map((q, i) => (
                        <div key={i} style={{ padding: "16px 24px", borderBottom: `1px solid ${BORDER}` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                            <button onClick={() => q.user && router.push(`/dashboard/clients/${q.user.id}`)}
                              style={{ background: "none", border: "none", padding: 0, cursor: q.user ? "pointer" : "default" }}>
                              <span style={{ color: GREEN, fontSize: 12, fontWeight: "bold" }}>{q.user ? displayName(q.user) : "Unknown"}</span>
                            </button>
                            <span style={{ color: "#333", fontSize: 11 }}>·</span>
                            <span style={{ color: "#444", fontSize: 11 }}>{fmtTs(q.created_at)}</span>
                          </div>
                          <p style={{ color: "#fff", fontSize: 13, margin: "0 0 8px", lineHeight: 1.5 }}>{q.content}</p>
                          {q.reply && (
                            <p style={{ color: "#555", fontSize: 12, margin: 0, lineHeight: 1.5, borderLeft: `2px solid #2a2a2a`, paddingLeft: 10 }}>
                              {q.reply.content.length > 160 ? q.reply.content.slice(0, 160) + "…" : q.reply.content}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}

          </div>
        )}

        {/* ── SETTINGS ── */}
        {activeNav === "Settings" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 600 }}>

            <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 28 }}>
              <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 20 }}>Coach Profile</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <p style={{ color: "#555", fontSize: 11, marginBottom: 4 }}>Name</p>
                  <p style={{ color: "#fff", fontSize: 14 }}>{authProfile?.user_metadata?.full_name || authProfile?.user_metadata?.name || "—"}</p>
                </div>
                <div>
                  <p style={{ color: "#555", fontSize: 11, marginBottom: 4 }}>Email</p>
                  <p style={{ color: "#aaa", fontSize: 14 }}>{authProfile?.email || "—"}</p>
                </div>
              </div>
            </div>

            <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", margin: 0 }}>Clients</p>
                <button
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/invite`)}
                  style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${GREEN}`, background: "#0a1a0f", color: GREEN, fontSize: 12, cursor: "pointer" }}
                >
                  + Invite Client
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {users.map(u => {
                  const deactivated = deactivatedIds.has(u.id)
                  return (
                    <div key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderBottom: `1px solid ${BORDER}` }}>
                      <div>
                        <p style={{ fontSize: 13, color: deactivated ? "#444" : "#fff", margin: 0 }}>{displayName(u)}</p>
                        <p style={{ fontSize: 11, color: "#333", margin: "2px 0 0" }}>{shortNum(u.whatsapp_number)}</p>
                      </div>
                      <button
                        onClick={() => !deactivated && deactivateClient(u.id)}
                        disabled={deactivated}
                        style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${deactivated ? "#1a1a1a" : "#2a0a0a"}`, background: "transparent", color: deactivated ? "#333" : "#ef4444", fontSize: 11, cursor: deactivated ? "default" : "pointer" }}
                      >
                        {deactivated ? "Deactivated" : "Deactivate"}
                      </button>
                    </div>
                  )
                })}
                {users.length === 0 && <p style={{ color: "#333", fontSize: 13 }}>No clients yet</p>}
              </div>
            </div>

            <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 28 }}>
              <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 20 }}>Cron Schedule</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { icon: "☀️", label: "Morning check-in", time: "08:00 NL" },
                  { icon: "🌙", label: "Evening check-out", time: "20:00 NL" },
                  { icon: "🕛", label: "Midnight evaluation", time: "23:59 NL" },
                ].map(({ icon, label, time }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#aaa", fontSize: 13 }}>{icon} {label}</span>
                    <span style={{ color: "#555", fontSize: 12 }}>{time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "#0f0808", border: `1px solid #2a1515`, borderRadius: 12, padding: 28 }}>
              <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 20 }}>Danger Zone</p>
              <button
                onClick={async () => { await supabase.auth.signOut(); router.replace("/login") }}
                style={{ padding: "9px 20px", borderRadius: 8, border: `1px solid #3a1a1a`, background: "#1a0808", color: "#ef4444", fontSize: 13, cursor: "pointer" }}
              >
                Sign Out
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
