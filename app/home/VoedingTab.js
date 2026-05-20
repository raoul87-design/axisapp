"use client"
import { useState, useEffect, useRef } from "react"
import { supabase } from "../../lib/supabase"

const G      = "#22c55e"
const PROT   = "#7DD3FC"
const CARB   = "#F472B6"
const FAT    = "#FB923C"
const BG     = "#0f0f0f"
const TILE   = "#141414"
const TILE2  = "#181818"
const BORDER = "#1f1f1f"
const BD2    = "#262626"
const BD3    = "#333"
const TEXT   = "#fafafa"
const DIM    = "#9a9a9a"
const FAINT  = "#5e5e5e"

const MEALS = [
  { id: "ontbijt", label: "Ontbijt" },
  { id: "lunch",   label: "Lunch"   },
  { id: "diner",   label: "Diner"   },
  { id: "snacks",  label: "Snacks"  },
]

const DAYS_SHORT = ["ma","di","wo","do","vr","za","zo"]
const DAYS_FULL  = ["maandag","dinsdag","woensdag","donderdag","vrijdag","zaterdag","zondag"]

const CAT_ICONS = {
  "Groente & Fruit":   "🥦",
  "Vlees & Vis":       "🥩",
  "Zuivel":            "🥛",
  "Granen":            "🌾",
  "Noten & Zaden":     "🥜",
  "Sauzen & Kruiden":  "🫙",
  "Overig":            "🛒",
  // legacy
  "Groente": "🥦",
  "Fruit":   "🍎",
  "Vlees":   "🥩",
  "Vis":     "🐟",
}

function getNLDate() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" })
}
function getMondayNL() {
  const today = new Date(getNLDate())
  const dow = today.getDay()
  const offset = dow === 0 ? -6 : 1 - dow
  today.setDate(today.getDate() + offset)
  return today.toLocaleDateString("en-CA")
}
function getWeekNumber(dateStr) {
  const d = new Date(dateStr)
  const jan4 = new Date(d.getFullYear(), 0, 4)
  const startOfWeek1 = new Date(jan4)
  startOfWeek1.setDate(jan4.getDate() - (jan4.getDay() || 7) + 1)
  const diff = d - startOfWeek1
  return Math.floor(diff / 604800000) + 1
}

function MacroBar({ pct, color }) {
  return (
    <div style={{ height: 4, background: BD3, borderRadius: 2, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.min(100, pct)}%`, background: color, borderRadius: 2 }} />
    </div>
  )
}

function SourceBadge({ source }) {
  const s = source === "WEEKMENU"
    ? { bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.4)", color: G }
    : source === "JUMBO"
    ? { bg: "rgba(234,179,8,0.08)", border: "rgba(234,179,8,0.4)", color: "#eab308" }
    : { bg: "rgba(255,255,255,0.04)", border: BD2, color: FAINT }
  return (
    <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", padding: "2px 5px", border: `1px solid ${s.border}`, borderRadius: 3, background: s.bg, color: s.color, flexShrink: 0 }}>
      {source}
    </span>
  )
}

// ── Search / Add Food Modal ────────────────────────────────────
function AddFoodModal({ meal, onClose, onAdd }) {
  const [q, setQ]             = useState("")
  const [results, setRes]     = useState([])
  const [loading, setLoad]    = useState(false)
  const [searchErr, setSearchErr] = useState("")
  const [manual, setManual]   = useState(false)
  const [form, setForm]       = useState({ naam: "", kcal: "", eiwitten: "", koolhydraten: "", vetten: "", portie: "100" })
  const debounce = useRef(null)

  function onType(val) {
    setQ(val)
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => search(val), 400)
  }

  async function search(term) {
    if (!term || term.length < 2) { setRes([]); setSearchErr(""); return }
    setLoad(true)
    setSearchErr("")
    try {
      const r = await fetch(`/api/food/search?q=${encodeURIComponent(term)}`)
      const d = await r.json()
      setRes(d.products || [])
      if (d.error === "timeout") setSearchErr("Zoeken duurt lang, probeer een kortere zoekterm.")
    } catch { setSearchErr("Zoekopdracht mislukt. Probeer opnieuw.") }
    setLoad(false)
  }

  function submitManual() {
    if (!form.naam || !form.kcal) return
    onAdd({
      name: form.naam,
      kcal: parseInt(form.kcal) || 0,
      eiwitten: parseFloat(form.eiwitten) || 0,
      koolhydraten: parseFloat(form.koolhydraten) || 0,
      vetten: parseFloat(form.vetten) || 0,
      portie: parseInt(form.portie) || 100,
      source: "EIGEN",
    }, meal.id)
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ width: "100%", maxWidth: 420, background: TILE, borderRadius: "20px 20px 0 0", border: `1px solid ${BD2}`, maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 20px 10px" }}>
          <div style={{ width: 36, height: 4, background: BD3, borderRadius: 2, margin: "0 auto 16px" }} />
          <p style={{ color: DIM, fontFamily: "JetBrains Mono, monospace", fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", margin: "0 0 8px" }}>{meal.label}</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input value={q} onChange={e => onType(e.target.value)} autoFocus
              placeholder="Zoek product..."
              style={{ flex: 1, padding: "10px 13px", borderRadius: 10, border: `1px solid ${BD2}`, background: "#0a0a0a", color: TEXT, fontSize: 14, outline: "none" }} />
            <button onClick={() => setManual(v => !v)}
              style={{ padding: "10px 13px", borderRadius: 10, border: `1px solid ${manual ? G : BD2}`, background: manual ? "rgba(34,197,94,0.1)" : "transparent", color: manual ? G : DIM, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
              Handmatig
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 24px" }}>
          {manual ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input value={form.naam} onChange={e => setForm(f => ({ ...f, naam: e.target.value }))} placeholder="Productnaam *"
                style={{ padding: "10px 13px", borderRadius: 10, border: `1px solid ${BD2}`, background: "#0a0a0a", color: TEXT, fontSize: 13, outline: "none" }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { key: "kcal", label: "Kcal *" },
                  { key: "portie", label: "Portie (g)" },
                  { key: "eiwitten", label: "Eiwit (g)" },
                  { key: "koolhydraten", label: "Koolh. (g)" },
                  { key: "vetten", label: "Vet (g)" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <p style={{ color: FAINT, fontFamily: "JetBrains Mono, monospace", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 5px" }}>{label}</p>
                    <input type="number" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      style={{ width: "100%", padding: "8px 11px", borderRadius: 8, border: `1px solid ${BD2}`, background: "#0a0a0a", color: TEXT, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                  </div>
                ))}
              </div>
              <button onClick={submitManual} disabled={!form.naam || !form.kcal}
                style={{ marginTop: 4, padding: "12px 0", borderRadius: 11, border: "none", background: form.naam && form.kcal ? G : BD2, color: form.naam && form.kcal ? "#061a0c" : FAINT, fontWeight: 700, fontSize: 14, cursor: form.naam && form.kcal ? "pointer" : "default" }}>
                Toevoegen →
              </button>
            </div>
          ) : (
            <>
              {loading && <p style={{ color: FAINT, fontSize: 13, textAlign: "center", padding: "20px 0" }}>Zoeken...</p>}
              {searchErr && <p style={{ color: "#fca5a5", fontSize: 12, textAlign: "center", padding: "8px 0" }}>{searchErr}</p>}
              {!loading && !searchErr && q.length > 1 && results.length === 0 && (
                <p style={{ color: FAINT, fontSize: 13, textAlign: "center", padding: "20px 0" }}>Geen resultaten. Probeer handmatige invoer.</p>
              )}
              {results.map((p, i) => (
                <div key={i} onClick={() => onAdd(p, meal.id)}
                  style={{ padding: "12px 0", borderBottom: `1px solid ${BORDER}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 500, margin: "0 0 3px", color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                    <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10.5, color: FAINT, margin: 0 }}>
                      <span style={{ color: DIM, fontWeight: 500 }}>{p.kcal} kcal</span>
                      <span style={{ margin: "0 6px", color: FAINT }}>·</span>E {p.eiwitten}g
                      <span style={{ margin: "0 6px", color: FAINT }}>·</span>K {p.koolhydraten}g
                      <span style={{ margin: "0 6px", color: FAINT }}>·</span>V {p.vetten}g
                    </p>
                  </div>
                  <span style={{ color: G, fontSize: 18, fontWeight: 300, flexShrink: 0 }}>+</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Recipe Drilldown ───────────────────────────────────────────
function RecipeView({ recipe, mealLabel, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: BG, zIndex: 1200, overflowY: "auto", maxWidth: 420, margin: "0 auto" }}>
      <div style={{ height: 220, background: `linear-gradient(160deg,#3a3422 10%,#241f12 80%)`, position: "relative", display: "flex", alignItems: "flex-end", padding: "18px 22px" }}>
        <button onClick={onClose}
          style={{ position: "absolute", top: 14, left: 18, width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "none", color: TEXT, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
          ←
        </button>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {recipe.bereidingstijd > 0 && (
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, letterSpacing: "0.2em", textTransform: "uppercase", padding: "5px 9px", background: "rgba(0,0,0,0.55)", color: "#fff", borderRadius: 5 }}>
              ⏱ {recipe.bereidingstijd} min
            </span>
          )}
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, letterSpacing: "0.2em", textTransform: "uppercase", padding: "5px 9px", background: "rgba(0,0,0,0.55)", color: "#fff", borderRadius: 5 }}>
            {mealLabel}
          </span>
        </div>
      </div>

      <div style={{ padding: "20px 22px 40px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 6px" }}>{recipe.naam}</h2>
          {recipe.beschrijving && <p style={{ fontSize: 13, color: DIM, lineHeight: 1.5, margin: 0 }}>{recipe.beschrijving}</p>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, background: TILE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 11 }}>
          {[
            { l: "Kcal",   v: recipe.kcal,         u: "",  color: G    },
            { l: "Eiwit",  v: recipe.eiwitten,      u: "g", color: PROT },
            { l: "Koolh.", v: recipe.koolhydraten,  u: "g", color: CARB },
            { l: "Vet",    v: recipe.vetten,        u: "g", color: FAT  },
          ].map(({ l, v, u, color }) => (
            <div key={l} style={{ borderLeft: l !== "Kcal" ? `1px solid ${BORDER}` : "none", paddingLeft: l !== "Kcal" ? 8 : 0 }}>
              <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 8.5, letterSpacing: "0.2em", color: FAINT, textTransform: "uppercase", margin: "0 0 3px" }}>{l}</p>
              <p style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.015em", margin: 0, color }}>
                {v}<span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: FAINT, fontWeight: 500, marginLeft: 1 }}>{u}</span>
              </p>
            </div>
          ))}
        </div>

        {recipe.ingredienten?.length > 0 ? (
          <div>
            <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: DIM, margin: "0 0 10px" }}>Ingrediënten</p>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {recipe.ingredienten.map((ingr, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderTop: i > 0 ? `1px solid ${BORDER}` : "none", fontSize: 13 }}>
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: G, fontWeight: 600, minWidth: 70, letterSpacing: "0.04em" }}>
                    {ingr.hoeveelheid} {ingr.eenheid}
                  </span>
                  <span style={{ flex: 1, fontWeight: 500 }}>{ingr.naam}</span>
                  {ingr.categorie && (
                    <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: FAINT, letterSpacing: "0.1em" }}>
                      {CAT_ICONS[ingr.categorie] || ""}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p style={{ color: FAINT, fontSize: 13, textAlign: "center", padding: "12px 0" }}>
            Geen ingrediënten beschikbaar. Genereer het weekmenu opnieuw voor volledige recepten.
          </p>
        )}
      </div>
    </div>
  )
}

// ── AI Generator Modal ─────────────────────────────────────────
function AiGenModal({ onClose, onGenerate, loading, error, prefs, setPrefs }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={e => { if (e.target === e.currentTarget && !loading) onClose() }}>
      <div style={{ width: "100%", maxWidth: 420, background: TILE, borderRadius: "20px 20px 0 0", border: `1px solid ${BD2}`, padding: "24px 20px 36px" }}>
        <div style={{ width: 36, height: 4, background: BD3, borderRadius: 2, margin: "0 auto 20px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: G, color: "#061a0c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>✦</div>
          <h3 style={{ color: TEXT, fontSize: 16, fontWeight: 700, margin: 0 }}>AI Weekmenu Generator</h3>
        </div>
        <p style={{ color: DIM, fontSize: 12, margin: "0 0 20px" }}>Gebaseerd op jouw macro doelen en voorkeuren.</p>

        {loading ? (
          <>
            <div style={{ padding: "20px 0", textAlign: "center" }}>
              <div style={{ padding: "12px 14px", background: "rgba(34,197,94,0.06)", border: `1px solid rgba(34,197,94,0.4)`, borderRadius: 9 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: G, boxShadow: `0 0 8px ${G}`, animation: "pulse 1.4s infinite" }} />
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, letterSpacing: "0.2em", color: G, textTransform: "uppercase" }}>Weekmenu genereren...</span>
                </div>
                <div style={{ height: 4, background: "rgba(34,197,94,0.18)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: "60%", background: G, borderRadius: 2, animation: "slideRight 1.5s infinite" }} />
                </div>
                <p style={{ color: FAINT, fontSize: 11, margin: "10px 0 0" }}>Maaltijdplan + ingrediënten genereren — dit duurt ~45 seconden</p>
              </div>
            </div>
            {error && (
              <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 9 }}>
                <p style={{ color: "#fca5a5", fontSize: 12, margin: 0 }}>{error}</p>
              </div>
            )}
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <p style={{ color: FAINT, fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 7px" }}>Doel</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {["Afvallen", "Spieren kweken", "Onderhouden", "Prestaties"].map(d => (
                  <button key={d} onClick={() => setPrefs(p => ({ ...p, doel: d }))}
                    style={{ padding: "7px 12px", borderRadius: 20, border: `1px solid ${prefs.doel === d ? G : BD2}`, background: prefs.doel === d ? "rgba(34,197,94,0.1)" : "transparent", color: prefs.doel === d ? G : DIM, fontSize: 12, fontWeight: prefs.doel === d ? 600 : 400, cursor: "pointer" }}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p style={{ color: FAINT, fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 7px" }}>Bereidingstijd (max)</p>
              <div style={{ display: "flex", gap: 6 }}>
                {["15", "30", "45", "60+"].map(t => (
                  <button key={t} onClick={() => setPrefs(p => ({ ...p, tijd: t }))}
                    style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `1px solid ${prefs.tijd === t ? G : BD2}`, background: prefs.tijd === t ? "rgba(34,197,94,0.1)" : "transparent", color: prefs.tijd === t ? G : DIM, fontSize: 12, fontWeight: prefs.tijd === t ? 600 : 400, cursor: "pointer" }}>
                    {t} min
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p style={{ color: FAINT, fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 7px" }}>Voorkeuren of allergieën</p>
              <input value={prefs.likes} onChange={e => setPrefs(p => ({ ...p, likes: e.target.value }))}
                placeholder="Bijv. geen gluten, houd van pasta..."
                style={{ width: "100%", padding: "10px 13px", borderRadius: 10, border: `1px solid ${BD2}`, background: "#0a0a0a", color: TEXT, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
            {error && (
              <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 9 }}>
                <p style={{ color: "#fca5a5", fontSize: 12, margin: 0 }}>{error}</p>
              </div>
            )}
            <button onClick={onGenerate}
              style={{ marginTop: 4, padding: "13px 0", borderRadius: 12, border: "none", background: G, color: "#061a0c", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              ✦ Genereer weekmenu
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main VoedingTab ────────────────────────────────────────────
export default function VoedingTab({ publicUserId, user, kcalDoel, eiwittenDoel, koolhydratenDoel, vettenDoel, TAB_H }) {
  const [subTab,        setSubTab]        = useState("vandaag")
  const [foodLogs,      setFoodLogs]      = useState([])
  const [loadingLogs,   setLoadingLogs]   = useState(true)
  const [addFoodMeal,   setAddFoodMeal]   = useState(null)
  const [mealPlan,      setMealPlan]      = useState(null)
  const [loadingPlan,   setLoadingPlan]   = useState(true)
  const [selectedDay,   setSelectedDay]   = useState(() => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1 })
  const [recipeView,    setRecipeView]    = useState(null)
  const [recipeMeal,    setRecipeMeal]    = useState("")
  const [aiGenModal,    setAiGenModal]    = useState(false)
  const [aiGenLoading,  setAiGenLoading]  = useState(false)
  const [aiGenError,    setAiGenError]    = useState("")
  const [aiPrefs,       setAiPrefs]       = useState({ doel: "Onderhouden", likes: "", tijd: "30" })
  const [checkedItems,  setCheckedItems]  = useState({})
  const [copied,        setCopied]        = useState(false)

  const uid = publicUserId ?? user?.id

  const doelKcal  = parseInt(kcalDoel)         || 2000
  const doelEiwit = parseInt(eiwittenDoel)      || 150
  const doelKoolh = parseInt(koolhydratenDoel)  || 200
  const doelVet   = parseInt(vettenDoel)        || 65

  const LS_KEY = `axis_boodschappen_${getMondayNL()}`

  async function loadFoodLogs() {
    if (!uid) return
    setLoadingLogs(true)
    const { data } = await supabase.from("food_logs").select("*")
      .eq("user_id", uid).eq("date", getNLDate()).order("created_at", { ascending: true })
    setFoodLogs(data || [])
    setLoadingLogs(false)
  }

  async function loadMealPlan() {
    if (!uid) return
    setLoadingPlan(true)
    const monday = getMondayNL()
    try {
      const res = await fetch(`/api/nutrition/meal-plan?userId=${encodeURIComponent(uid)}&weekStart=${monday}`)
      const d = await res.json()
      setMealPlan(d.plan || null)
    } catch (err) {
      console.error("[loadMealPlan] error:", err.message)
    }
    setLoadingPlan(false)
  }

  useEffect(() => {
    if (uid) { loadFoodLogs(); loadMealPlan() }
  }, [uid])

  useEffect(() => {
    if ((subTab === "weekmenu" || subTab === "boodschappen") && uid) {
      loadMealPlan()
    }
  }, [subTab])

  // Load checked items from localStorage when switching to boodschappen
  useEffect(() => {
    if (subTab === "boodschappen") {
      try {
        const saved = JSON.parse(localStorage.getItem(LS_KEY) || "{}")
        setCheckedItems(saved)
      } catch {}
    }
  }, [subTab])

  function updateCheckedItem(key) {
    setCheckedItems(prev => {
      // default true = "I have this at home"; false = "still need to buy"
      const next = { ...prev, [key]: !(prev[key] ?? true) }
      try { localStorage.setItem(LS_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  async function copyShoppingList() {
    const monday  = getMondayNL()
    const weekNum = getWeekNumber(monday)
    let text = `🛒 Boodschappenlijst AXIS — week ${weekNum}\n`
    let hasItems = false
    for (const { cat, items } of shoppingList) {
      const needed = items.filter(item => !(checkedItems[`${cat}_${item.naam}`] ?? true))
      if (needed.length === 0) continue
      hasItems = true
      text += `\n${cat}\n`
      for (const item of needed) text += `- ${item.naam} (${item.q})\n`
    }
    if (!hasItems) text += "\n(Alle ingrediënten al aangevinkt)"
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  // Computed
  const totals = foodLogs.reduce((a, f) => ({
    kcal:         a.kcal         + (f.kcal         || 0),
    eiwitten:     a.eiwitten     + (f.eiwitten     || 0),
    koolhydraten: a.koolhydraten + (f.koolhydraten || 0),
    vetten:       a.vetten       + (f.vetten       || 0),
  }), { kcal: 0, eiwitten: 0, koolhydraten: 0, vetten: 0 })

  const kcalPct   = Math.min(100, Math.round(totals.kcal / doelKcal * 100))
  const remaining = doelKcal - totals.kcal

  const byMeal = {}
  for (const f of foodLogs) {
    if (!byMeal[f.meal_type]) byMeal[f.meal_type] = []
    byMeal[f.meal_type].push(f)
  }

  async function addFoodLog(product, mealId) {
    if (!uid) return
    const res = await fetch("/api/food/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id:      uid,
        date:         getNLDate(),
        meal_type:    mealId,
        product_name: product.name,
        kcal:         product.kcal,
        eiwitten:     product.eiwitten,
        koolhydraten: product.koolhydraten,
        vetten:       product.vetten,
        portie_gram:  product.portie || 100,
        source:       product.source || "EIGEN",
      }),
    })
    const d = await res.json()
    if (d.error) { console.error("[addFoodLog] API error:", d.error); return }
    setAddFoodMeal(null)
    loadFoodLogs()
  }

  async function toggleFoodDone(id, current) {
    await supabase.from("food_logs").update({ done: !current }).eq("id", id)
    setFoodLogs(prev => prev.map(f => f.id === id ? { ...f, done: !current } : f))
  }

  async function deleteFoodLog(id) {
    await supabase.from("food_logs").delete().eq("id", id)
    setFoodLogs(prev => prev.filter(f => f.id !== id))
  }

  async function generateMealPlan() {
    if (!uid) return
    setAiGenLoading(true)
    setAiGenError("")
    try {
      const monday = getMondayNL()
      const res = await fetch("/api/nutrition/generate-week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid, weekStart: monday, kcalDoel: doelKcal, eiwittenDoel: doelEiwit, koolhydratenDoel: doelKoolh, vettenDoel: doelVet, prefs: aiPrefs }),
        signal: AbortSignal.timeout(85000),
      })
      const data = await res.json()
      if (data.plan) {
        setMealPlan(data.plan)
        setAiGenModal(false)
        // Reset checked items for the new week's plan
        try { localStorage.removeItem(LS_KEY) } catch {}
        setCheckedItems({})
      } else {
        setAiGenError(data.error || "Onbekende fout. Probeer het opnieuw.")
      }
    } catch (err) {
      if (err.name === "TimeoutError" || err.name === "AbortError") {
        setAiGenError("Menu genereren duurt langer dan verwacht. Probeer het opnieuw.")
      } else {
        setAiGenError("Er ging iets mis. Probeer het opnieuw.")
      }
    }
    setAiGenLoading(false)
  }

  // Build shopping list from ingredients embedded in meal_plans.plan
  function buildShoppingList(plan) {
    if (!plan?.plan) return []
    const cats = {}
    for (const dayMeals of Object.values(plan.plan)) {
      for (const mealItems of Object.values(dayMeals)) {
        for (const item of (mealItems || [])) {
          for (const ingr of (item.ingredienten || [])) {
            const cat = ingr.categorie || "Overig"
            if (!cats[cat]) cats[cat] = {}
            const key = ingr.naam.toLowerCase()
            if (!cats[cat][key]) cats[cat][key] = { naam: ingr.naam, qty: 0, eenheid: ingr.eenheid || "" }
            cats[cat][key].qty += parseFloat(ingr.hoeveelheid) || 0
          }
        }
      }
    }
    const CAT_ORDER = ["Groente & Fruit", "Vlees & Vis", "Zuivel", "Granen", "Noten & Zaden", "Sauzen & Kruiden", "Overig"]
    const sorted = Object.keys(cats).sort((a, b) => {
      const ai = CAT_ORDER.indexOf(a); const bi = CAT_ORDER.indexOf(b)
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
    })
    return sorted.map(cat => ({
      cat,
      items: Object.values(cats[cat]).map(i => ({
        naam: i.naam,
        q: i.qty > 0 ? `${Number.isInteger(i.qty) ? i.qty : Math.round(i.qty * 10) / 10} ${i.eenheid}`.trim() : i.eenheid,
      })),
    }))
  }

  const shoppingList = buildShoppingList(mealPlan)
  const dayPlan = mealPlan?.plan?.[DAYS_FULL[selectedDay]] || null

  const dayTotals = dayPlan ? Object.values(dayPlan).flat().reduce((a, r) => ({
    kcal: a.kcal + (r.kcal || 0),
    eiwitten: a.eiwitten + (r.eiwitten || 0),
    koolhydraten: a.koolhydraten + (r.koolhydraten || 0),
    vetten: a.vetten + (r.vetten || 0),
  }), { kcal: 0, eiwitten: 0, koolhydraten: 0, vetten: 0 }) : null

  const MONO = { fontFamily: "JetBrains Mono, monospace" }

  // ── SUB-TAB: VANDAAG ──────────────────────────────────────────
  function VandaagTab() {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Kcal card */}
        <div style={{ background: TILE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "18px 18px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
            <div>
              <p style={{ fontSize: 13, color: DIM, margin: "0 0 4px", lineHeight: 1.2 }}>
                {remaining >= 0 ? <>Nog <strong style={{ color: TEXT }}>{remaining} kcal</strong> over vandaag</> : <><strong style={{ color: "#ef4444" }}>{Math.abs(remaining)} kcal</strong> boven doel</>}
              </p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.05 }}>{totals.kcal.toLocaleString("nl-NL")}</span>
                <span style={{ ...MONO, fontSize: 11, color: FAINT, letterSpacing: "0.18em", textTransform: "uppercase" }}>/ {doelKcal.toLocaleString("nl-NL")} kcal</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ ...MONO, fontSize: 9.5, letterSpacing: "0.22em", color: FAINT, textTransform: "uppercase", margin: "0 0 3px" }}>Doel</p>
              <p style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.005em", margin: 0 }}>{doelKcal.toLocaleString("nl-NL")}</p>
            </div>
          </div>
          <div style={{ height: 6, background: BORDER, borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${kcalPct}%`, background: kcalPct >= 100 ? "#ef4444" : kcalPct >= 85 ? "#eab308" : G, borderRadius: 3, transition: "width 0.4s ease" }} />
          </div>
          {/* Macro row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {[
              { key: "koolhydraten", label: "Koolh.",  doel: doelKoolh, color: CARB },
              { key: "eiwitten",     label: "Eiwit",   doel: doelEiwit, color: PROT },
              { key: "vetten",       label: "Vet",     doel: doelVet,   color: FAT  },
            ].map(({ key, label, doel, color }) => {
              const val = Math.round(totals[key] * 10) / 10
              const pct = Math.round(val / doel * 100)
              return (
                <div key={key} style={{ background: TILE2, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "11px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ ...MONO, fontSize: 9.5, letterSpacing: "0.2em", color: FAINT, textTransform: "uppercase" }}>{label}</span>
                    <span style={{ ...MONO, fontSize: 10, color: pct >= 100 ? "#ef4444" : pct >= 90 ? G : DIM, fontWeight: 600 }}>{pct}%</span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.015em", lineHeight: 1, color }}>
                    {val}<span style={{ color: FAINT, fontSize: 11, fontWeight: 500 }}>/{doel}g</span>
                  </div>
                  <MacroBar pct={pct} color={color} />
                </div>
              )
            })}
          </div>
        </div>

        {/* Meal blocks */}
        {MEALS.map(meal => {
          const logs = byMeal[meal.id] || []
          const mealKcal = logs.reduce((s, f) => s + (f.kcal || 0), 0)
          return (
            <div key={meal.id} style={{ background: TILE, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "11px 14px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, borderBottom: `1px solid ${BORDER}` }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.005em" }}>{meal.label}</span>
                    <span style={{ ...MONO, fontSize: 10.5, color: mealKcal > 0 ? DIM : FAINT, fontWeight: 500 }}>{mealKcal} kcal</span>
                  </div>
                </div>
                <button onClick={() => setAddFoodMeal(meal)}
                  style={{ width: 26, height: 26, borderRadius: 7, border: `1px solid ${BD2}`, background: "transparent", color: DIM, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", lineHeight: 1, fontWeight: 300 }}>+</button>
              </div>
              <div>
                {logs.map((f, i) => (
                  <div key={f.id} style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 11, borderTop: i > 0 ? `1px solid ${BORDER}` : "none" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: `linear-gradient(135deg,#2a3a32,#1a2620)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ ...MONO, fontSize: 11, fontWeight: 600, color: "#9ad1a8" }}>{Math.round(f.kcal)}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 500, letterSpacing: "-0.005em", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: f.done ? FAINT : TEXT, textDecoration: f.done ? "line-through" : "none" }}>{f.product_name}</span>
                        {f.source && <SourceBadge source={f.source} />}
                      </div>
                      <p style={{ ...MONO, fontSize: 10.5, color: FAINT, margin: 0 }}>
                        <span style={{ color: DIM, fontWeight: 500 }}>{f.kcal} kcal</span>
                        {f.eiwitten > 0 && <><span style={{ margin: "0 5px" }}>·</span>E {f.eiwitten}g</>}
                        {f.portie_gram && <><span style={{ margin: "0 5px" }}>·</span>{f.portie_gram}g</>}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }}>
                      <div onClick={() => toggleFoodDone(f.id, f.done)}
                        style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${f.done ? G : BD3}`, background: f.done ? G : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#061a0c" }}>
                        {f.done && <svg width={10} height={10} viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 2.5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" /></svg>}
                      </div>
                      <button onClick={() => deleteFoodLog(f.id)}
                        style={{ background: "none", border: "none", color: FAINT, fontSize: 14, cursor: "pointer", padding: "0 2px", lineHeight: 1 }}>×</button>
                    </div>
                  </div>
                ))}
                <div onClick={() => setAddFoodMeal(meal)}
                  style={{ padding: "11px 14px", display: "flex", alignItems: "center", gap: 11, color: FAINT, fontSize: 13, fontWeight: 500, borderTop: logs.length > 0 ? `1px solid ${BORDER}` : "none", cursor: "pointer" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, border: `1px dashed ${BD3}`, display: "flex", alignItems: "center", justifyContent: "center", color: FAINT, fontSize: 18, fontWeight: 300 }}>+</div>
                  Product toevoegen
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // ── SUB-TAB: WEEKMENU ────────────────────────────────────────
  function WeekmenuTab() {
    if (loadingPlan) return <p style={{ color: FAINT, fontSize: 13, textAlign: "center", padding: "40px 0" }}>Laden...</p>

    if (!mealPlan) {
      return (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div style={{ background: TILE, border: `1px solid rgba(34,197,94,0.3)`, borderRadius: 14, padding: "24px 20px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 20% 0%,rgba(34,197,94,0.10),transparent 60%)", pointerEvents: "none" }} />
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, justifyContent: "center", marginBottom: 10 }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: G, color: "#061a0c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>✦</div>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Weekmenu genereren</span>
              </div>
              <p style={{ color: DIM, fontSize: 13, lineHeight: 1.5, margin: "0 0 18px" }}>Laat AI een persoonlijk weekmenu samenstellen op basis van jouw macro-doelen en voorkeuren.</p>
              <button onClick={() => setAiGenModal(true)}
                style={{ padding: "12px 24px", borderRadius: 11, border: "none", background: G, color: "#061a0c", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                ✦ Maak mijn weekmenu
              </button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Week strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 5 }}>
          {DAYS_SHORT.map((d, i) => {
            const day = mealPlan?.plan?.[DAYS_FULL[i]]
            const dayKcal = day ? Object.values(day).flat().reduce((s, r) => s + (r.kcal || 0), 0) : 0
            const isActive = i === selectedDay
            return (
              <div key={d} onClick={() => setSelectedDay(i)}
                style={{ aspectRatio: "1/1.25", background: isActive ? G : dayKcal > 0 ? "rgba(34,197,94,0.12)" : "transparent", border: `1px solid ${isActive ? G : dayKcal > 0 ? "rgba(34,197,94,0.40)" : BORDER}`, borderRadius: 9, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, position: "relative", cursor: "pointer" }}>
                <span style={{ ...MONO, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: isActive ? "#0a3315" : FAINT }}>{d}</span>
                <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em", color: isActive ? "#061a0c" : dayKcal > 0 ? G : TEXT }}>{i + 1}</span>
                {dayKcal > 0 && <span style={{ ...MONO, fontSize: 8.5, color: isActive ? "#0a3315" : FAINT, position: "absolute", bottom: 5 }}>{dayKcal}</span>}
              </div>
            )
          })}
        </div>

        {/* Day macro summary */}
        {dayTotals && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, padding: "11px 12px", background: TILE2, border: `1px solid ${BORDER}`, borderRadius: 11 }}>
            {[
              { l: "Kcal",  v: Math.round(dayTotals.kcal),         u: "",  color: G    },
              { l: "Eiwit", v: Math.round(dayTotals.eiwitten),      u: "g", color: PROT },
              { l: "Koolh", v: Math.round(dayTotals.koolhydraten),  u: "g", color: CARB },
              { l: "Vet",   v: Math.round(dayTotals.vetten),        u: "g", color: FAT  },
            ].map(({ l, v, u, color }) => (
              <div key={l} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <p style={{ ...MONO, fontSize: 8.5, letterSpacing: "0.2em", color: FAINT, textTransform: "uppercase", margin: 0 }}>{l}</p>
                <p style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1, margin: 0, color }}>
                  {v}<span style={{ ...MONO, fontSize: 9, color: FAINT, fontWeight: 500, marginLeft: 2 }}>{u}</span>
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Meals for selected day */}
        {dayPlan && MEALS.map(meal => {
          const recipes = dayPlan[meal.id] || []
          if (recipes.length === 0) return null
          return (
            <div key={meal.id}>
              <p style={{ ...MONO, fontSize: 9.5, letterSpacing: "0.22em", color: FAINT, textTransform: "uppercase", margin: "0 0 8px 2px" }}>{meal.label}</p>
              {recipes.map((r, i) => (
                <div key={i} style={{ background: TILE, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden", display: "flex", alignItems: "stretch", marginBottom: 8 }}>
                  <div style={{ width: 80, flexShrink: 0, background: `linear-gradient(135deg,#3a3422 20%,#241f12)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    <div style={{ position: "absolute", top: 6, left: 6, ...MONO, fontSize: 8, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", padding: "2px 5px", background: "rgba(0,0,0,0.4)", borderRadius: 3 }}>AI</div>
                    <span style={{ fontSize: 26, opacity: 0.5 }}>🍽</span>
                  </div>
                  <div style={{ flex: 1, padding: "11px 14px", display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                    <p style={{ ...MONO, fontSize: 9, letterSpacing: "0.22em", color: FAINT, textTransform: "uppercase", margin: 0 }}>{meal.label}</p>
                    <p style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: "-0.005em", lineHeight: 1.2, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.naam}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: "auto", flexWrap: "wrap" }}>
                      <span style={{ ...MONO, fontSize: 10.5, color: G, fontWeight: 600 }}>{r.kcal} kcal</span>
                      {r.bereidingstijd > 0 && <span style={{ ...MONO, fontSize: 9.5, color: FAINT }}>⏱ {r.bereidingstijd} min</span>}
                      <button onClick={() => { setRecipeView(r); setRecipeMeal(meal.label) }}
                        style={{ ...MONO, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: G, padding: "4px 9px", border: `1px solid rgba(34,197,94,0.4)`, borderRadius: 4, fontWeight: 700, marginLeft: "auto", background: "rgba(34,197,94,0.08)", cursor: "pointer" }}>
                        Bekijk →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        })}

        {/* Regenerate */}
        <button onClick={() => setAiGenModal(true)}
          style={{ marginTop: 4, padding: "12px 16px", borderRadius: 11, border: `1px solid ${BD2}`, background: "transparent", color: DIM, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          ✦ Regenereer weekmenu
        </button>
      </div>
    )
  }

  // ── SUB-TAB: BOODSCHAPPEN ────────────────────────────────────
  function BoodschappenTab() {
    if (loadingPlan) return <p style={{ color: FAINT, fontSize: 13, textAlign: "center", padding: "40px 0" }}>Laden...</p>

    if (!mealPlan) {
      return (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <p style={{ color: FAINT, fontSize: 14 }}>Maak eerst een weekmenu aan om de boodschappenlijst te genereren.</p>
          <button onClick={() => setSubTab("weekmenu")}
            style={{ marginTop: 12, padding: "10px 20px", borderRadius: 10, border: "none", background: G, color: "#061a0c", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            Naar weekmenu →
          </button>
        </div>
      )
    }

    if (shoppingList.length === 0) {
      return (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <p style={{ color: FAINT, fontSize: 14, marginBottom: 12 }}>Weekmenu heeft nog geen ingrediënten.</p>
          <p style={{ color: FAINT, fontSize: 13 }}>Genereer het weekmenu opnieuw — ingrediënten worden automatisch toegevoegd.</p>
          <button onClick={() => setSubTab("weekmenu")}
            style={{ marginTop: 16, padding: "10px 20px", borderRadius: 10, border: "none", background: G, color: "#061a0c", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            Naar weekmenu →
          </button>
        </div>
      )
    }

    const total      = shoppingList.reduce((s, g) => s + g.items.length, 0)
    // haveIt default = true (all start checked = "I have this")
    const toKopen    = shoppingList.reduce((s, g) =>
      s + g.items.filter(item => !(checkedItems[`${g.cat}_${item.naam}`] ?? true)).length, 0)
    const firstNeed  = shoppingList.flatMap(g =>
      g.items.filter(item => !(checkedItems[`${g.cat}_${item.naam}`] ?? true)).map(i => i.naam)
    )[0] || ""

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Header */}
        <div style={{ background: TILE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
            <span style={{ ...MONO, fontSize: 10, letterSpacing: "0.22em", color: FAINT, textTransform: "uppercase" }}>Te kopen</span>
            <span style={{ ...MONO, fontSize: 10, color: toKopen > 0 ? G : DIM, fontWeight: 600 }}>{toKopen}/{total}</span>
          </div>
          <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>{toKopen} producten</span>
          <div style={{ height: 5, background: BORDER, borderRadius: 3, overflow: "hidden", marginTop: 8 }}>
            <div style={{ height: "100%", width: `${total > 0 ? Math.round(toKopen / total * 100) : 0}%`, background: G, borderRadius: 3, transition: "width 0.3s ease" }} />
          </div>
          <p style={{ ...MONO, fontSize: 10, color: FAINT, margin: "8px 0 0", letterSpacing: "0.1em" }}>
            Vink af wat je al in huis hebt
          </p>
        </div>

        {/* Categories */}
        {shoppingList.map(({ cat, items }) => (
          <div key={cat} style={{ background: TILE, border: `1px solid ${BORDER}`, borderRadius: 13, overflow: "hidden" }}>
            <div style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(34,197,94,0.06)", color: G, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>
                  {CAT_ICONS[cat] || "🛒"}
                </div>
                {cat}
              </div>
              <span style={{ ...MONO, fontSize: 10, color: FAINT, letterSpacing: "0.18em" }}>{items.length}</span>
            </div>
            <div>
              {items.map((item, i) => {
                const key    = `${cat}_${item.naam}`
                const haveIt = checkedItems[key] ?? true   // true = already have = crossed out
                return (
                  <div key={i} style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: 10, fontSize: 13, borderTop: i > 0 ? `1px solid ${BORDER}` : "none" }}>
                    <div onClick={() => updateCheckedItem(key)}
                      style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${haveIt ? G : BD3}`, background: haveIt ? G : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#061a0c", cursor: "pointer" }}>
                      {haveIt && <svg width={10} height={10} viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 2.5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </div>
                    <span style={{ flex: 1, lineHeight: 1.2, color: haveIt ? FAINT : TEXT, textDecoration: haveIt ? "line-through" : "none" }}>{item.naam}</span>
                    <span style={{ ...MONO, fontSize: 10.5, color: haveIt ? FAINT : DIM, flexShrink: 0 }}>{item.q}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* CTAs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
          {/* Primary: Copy */}
          <button onClick={copyShoppingList}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 16px", background: copied ? "rgba(34,197,94,0.15)" : G, color: copied ? G : "#061a0c", border: copied ? `1px solid ${G}` : "none", borderRadius: 11, fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all 0.2s" }}>
            {copied ? "✓ Gekopieerd!" : "Kopieer boodschappenlijst"}
          </button>

          {/* Secondary: AH + Jumbo — search on first unchecked item */}
          <div style={{ display: "flex", gap: 8 }}>
            <a href={`https://www.ah.nl/zoeken?query=${encodeURIComponent(firstNeed)}`} target="_blank" rel="noreferrer"
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "9px 10px", background: "transparent", color: FAINT, border: `1px solid ${BD2}`, borderRadius: 9, textDecoration: "none", fontWeight: 600, fontSize: 11, opacity: firstNeed ? 1 : 0.4, pointerEvents: firstNeed ? "auto" : "none" }}>
              <span style={{ fontSize: 13 }}>🛒</span> Albert Heijn
            </a>
            <a href={`https://www.jumbo.com/zoeken?searchTerms=${encodeURIComponent(firstNeed)}`} target="_blank" rel="noreferrer"
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "9px 10px", background: "transparent", color: FAINT, border: `1px solid ${BD2}`, borderRadius: 9, textDecoration: "none", fontWeight: 600, fontSize: 11, opacity: firstNeed ? 1 : 0.4, pointerEvents: firstNeed ? "auto" : "none" }}>
              <span style={{ fontSize: 13 }}>🛒</span> Jumbo
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Modals */}
      {addFoodMeal && <AddFoodModal meal={addFoodMeal} onClose={() => setAddFoodMeal(null)} onAdd={addFoodLog} />}
      {recipeView  && <RecipeView  recipe={recipeView} mealLabel={recipeMeal} onClose={() => setRecipeView(null)} />}
      {aiGenModal  && <AiGenModal  onClose={() => !aiGenLoading && setAiGenModal(false)} onGenerate={generateMealPlan} loading={aiGenLoading} error={aiGenError} prefs={aiPrefs} setPrefs={setAiPrefs} />}

      {/* Sub-nav */}
      <div style={{ padding: "4px 22px 14px", display: "flex", gap: 4 }}>
        {[
          { id: "vandaag",       label: "Vandaag" },
          { id: "weekmenu",      label: "Weekmenu" },
          { id: "boodschappen",  label: "Boodschappen" },
        ].map(({ id, label }) => (
          <button key={id} onClick={() => setSubTab(id)}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 6px", borderRadius: 8, fontSize: 12, fontWeight: 600, color: subTab === id ? TEXT : FAINT, background: subTab === id ? TILE : "transparent", border: `1px solid ${subTab === id ? BD2 : BORDER}`, cursor: "pointer", position: "relative" }}>
            {label}
            {subTab === id && <div style={{ position: "absolute", left: 14, right: 14, bottom: -1, height: 2, background: G, borderRadius: 1 }} />}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: "8px 22px", paddingBottom: TAB_H + 32, overflowY: "auto" }}>
        {subTab === "vandaag"      && <VandaagTab />}
        {subTab === "weekmenu"     && <WeekmenuTab />}
        {subTab === "boodschappen" && <BoodschappenTab />}
      </div>
    </>
  )
}
