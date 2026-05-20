"use client"
import { useState, useEffect, useRef } from "react"
import { supabase } from "../../lib/supabase"
import { BrowserMultiFormatReader } from "@zxing/browser"

const MONO   = { fontFamily: "JetBrains Mono, monospace" }
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

const MEAL_IMAGES = {
  ontbijt: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400&q=80", // pancakes / ontbijt
  lunch:   "https://images.unsplash.com/photo-1540189549336-e6e99eb4b951?w=400&q=80", // salade bowl
  diner:   "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80", // bord met eten
  snacks:  "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80", // fruit / snacks
}

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
  const [q,          setQ]        = useState("")
  const [results,    setRes]      = useState([])
  const [loading,    setLoad]     = useState(false)
  const [searchErr,  setErr]      = useState("")
  const [scanning,   setScanning] = useState(false)
  const [selected,   setSelected] = useState(null)
  const [portie,     setPortie]   = useState("100")
  const [manual,     setManual]   = useState(false)
  const [form,       setForm]     = useState({ naam: "", kcal: "", eiwitten: "", koolhydraten: "", vetten: "", portie: "100" })
  const debounce     = useRef(null)
  const videoRef     = useRef(null)
  const controlsRef  = useRef(null)
  const [noScanner,     setNoScanner]     = useState(false)
  const [barcodeInput,  setBarcodeInput]  = useState("")

  function stopCamera() {
    try { controlsRef.current?.stop() } catch {}
    controlsRef.current = null
  }

  useEffect(() => {
    if (!scanning) { stopCamera(); return }
    let active = true
    const codeReader = new BrowserMultiFormatReader()
    codeReader.decodeFromVideoDevice(null, videoRef.current, (result, err) => {
      if (!active || !result) return
      active = false
      stopCamera()
      setScanning(false)
      handleBarcode(result.getText())
    }).then(controls => {
      if (!active) { try { controls.stop() } catch {} return }
      controlsRef.current = controls
    }).catch(() => {
      if (active) { setScanning(false); setNoScanner(true); setErr("Camera niet beschikbaar of toegang geweigerd.") }
    })
    return () => { active = false; stopCamera() }
  }, [scanning])

  function openScanner() {
    if (scanning) {
      setScanning(false)
    } else {
      setScanning(true)
      setNoScanner(false)
      setSelected(null)
      setRes([])
      setErr("")
    }
  }

  async function handleBarcode(code) {
    setLoad(true); setErr("")
    try {
      const d = await fetch(`/api/food/search?q=${encodeURIComponent(code)}`).then(r => r.json())
      if (d.products?.length) { setSelected(d.products[0]); setPortie("100"); setRes([]) }
      else setErr("Product niet gevonden voor deze barcode.")
    } catch { setErr("Barcode lookup mislukt.") }
    setLoad(false)
  }

  function onType(val) {
    setQ(val); setSelected(null); setRes([]); setErr("")
    clearTimeout(debounce.current)
    if (val.length >= 3) debounce.current = setTimeout(() => search(val), 500)
  }

  async function search(term) {
    setLoad(true)
    try {
      const d = await fetch(`/api/food/search?q=${encodeURIComponent(term)}`).then(r => r.json())
      setRes(d.products || [])
      if (d.error === "timeout") setErr("Zoeken duurt lang, probeer een kortere zoekterm.")
    } catch { setErr("Zoekopdracht mislukt. Probeer opnieuw.") }
    setLoad(false)
  }

  function calcMacros(p, g) {
    const f = (parseFloat(g) || 0) / 100
    return {
      kcal:         Math.round(p.kcal * f),
      eiwitten:     Math.round(p.eiwitten * f * 10) / 10,
      koolhydraten: Math.round(p.koolhydraten * f * 10) / 10,
      vetten:       Math.round(p.vetten * f * 10) / 10,
    }
  }

  function confirmAdd() {
    if (!selected) return
    const m = calcMacros(selected, portie)
    onAdd({ name: selected.name, ...m, portie: parseInt(portie) || 100, source: selected.source || "OPEN FOOD FACTS" }, meal.id)
  }

  function submitManual() {
    if (!form.naam || !form.kcal) return
    onAdd({ name: form.naam, kcal: parseInt(form.kcal) || 0, eiwitten: parseFloat(form.eiwitten) || 0, koolhydraten: parseFloat(form.koolhydraten) || 0, vetten: parseFloat(form.vetten) || 0, portie: parseInt(form.portie) || 100, source: "EIGEN" }, meal.id)
  }

  const macros = selected ? calcMacros(selected, portie) : null

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ width: "100%", maxWidth: 420, background: TILE, borderRadius: "20px 20px 0 0", border: `1px solid ${BD2}`, maxHeight: "88vh", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ padding: "16px 20px 10px", flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, background: BD3, borderRadius: 2, margin: "0 auto 14px" }} />
          <p style={{ ...MONO, color: DIM, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", margin: "0 0 10px" }}>{meal.label}</p>
          <div style={{ display: "flex", gap: 7 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <input value={q} onChange={e => onType(e.target.value)} autoFocus
                placeholder="Zoek product of scan barcode..."
                style={{ width: "100%", padding: "10px 36px 10px 13px", borderRadius: 10, border: `1px solid ${BD2}`, background: "#0a0a0a", color: TEXT, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              {loading && (
                <div style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, border: `2px solid ${BD3}`, borderTopColor: G, borderRadius: "50%", animation: "axisSpinSearch 0.7s linear infinite" }} />
              )}
            </div>
            <button onClick={openScanner}
              style={{ width: 42, height: 42, borderRadius: 10, border: `1px solid ${(scanning || noScanner) ? G : BD2}`, background: (scanning || noScanner) ? "rgba(34,197,94,0.12)" : "transparent", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              📷
            </button>
            <button onClick={() => { setManual(v => !v); setSelected(null) }}
              style={{ padding: "0 11px", height: 42, borderRadius: 10, border: `1px solid ${manual ? G : BD2}`, background: manual ? "rgba(34,197,94,0.1)" : "transparent", color: manual ? G : DIM, fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
              Handmatig
            </button>
          </div>

          {/* Fallback barcode input — shown when BarcodeDetector not available */}
          {noScanner && (
            <div style={{ marginTop: 10, padding: "10px 13px", background: "rgba(34,197,94,0.06)", border: `1px solid rgba(34,197,94,0.3)`, borderRadius: 10 }}>
              <p style={{ ...MONO, fontSize: 9.5, color: G, letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 8px" }}>Barcode scanner niet beschikbaar in deze browser</p>
              <div style={{ display: "flex", gap: 7 }}>
                <input autoFocus value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && barcodeInput.trim()) { setBarcodeInput(""); setNoScanner(false); handleBarcode(barcodeInput.trim()) } }}
                  placeholder="Voer barcode in (bijv. 8710398522191)"
                  style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: `1px solid ${BD2}`, background: "#0a0a0a", color: TEXT, fontSize: 13, outline: "none" }} />
                <button onClick={() => { if (barcodeInput.trim()) { const v = barcodeInput.trim(); setBarcodeInput(""); setNoScanner(false); handleBarcode(v) } }}
                  disabled={!barcodeInput.trim()}
                  style={{ padding: "0 14px", borderRadius: 8, border: "none", background: barcodeInput.trim() ? G : BD2, color: barcodeInput.trim() ? "#061a0c" : FAINT, fontWeight: 700, fontSize: 13, cursor: barcodeInput.trim() ? "pointer" : "default" }}>
                  Zoek
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px 20px 28px" }}>

          {/* Camera viewfinder */}
          {scanning && (
            <div style={{ marginBottom: 12, position: "relative", borderRadius: 12, overflow: "hidden", border: `1.5px solid rgba(34,197,94,0.5)` }}>
              <video ref={videoRef} playsInline muted style={{ width: "100%", display: "block", height: 180, objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                <div style={{ width: 200, height: 54, border: `2px solid ${G}`, borderRadius: 5, boxShadow: "0 0 0 1000px rgba(0,0,0,0.4)" }} />
              </div>
              <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, textAlign: "center", pointerEvents: "none" }}>
                <span style={{ ...MONO, fontSize: 9, letterSpacing: "0.2em", color: G, background: "rgba(0,0,0,0.7)", padding: "3px 9px", borderRadius: 4, textTransform: "uppercase" }}>Richt op barcode</span>
              </div>
            </div>
          )}


          {/* Manual form */}
          {manual && !scanning && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
              <input value={form.naam} onChange={e => setForm(f => ({ ...f, naam: e.target.value }))} placeholder="Productnaam *"
                style={{ padding: "10px 13px", borderRadius: 10, border: `1px solid ${BD2}`, background: "#0a0a0a", color: TEXT, fontSize: 13, outline: "none" }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { key: "kcal",         label: "Kcal *"     },
                  { key: "portie",       label: "Portie (g)" },
                  { key: "eiwitten",     label: "Eiwit (g)"  },
                  { key: "koolhydraten", label: "Koolh. (g)" },
                  { key: "vetten",       label: "Vet (g)"    },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <p style={{ ...MONO, color: FAINT, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 5px" }}>{label}</p>
                    <input type="number" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      style={{ width: "100%", padding: "8px 11px", borderRadius: 8, border: `1px solid ${BD2}`, background: "#0a0a0a", color: TEXT, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                  </div>
                ))}
              </div>
              <button onClick={submitManual} disabled={!form.naam || !form.kcal}
                style={{ padding: "12px 0", borderRadius: 11, border: "none", background: form.naam && form.kcal ? G : BD2, color: form.naam && form.kcal ? "#061a0c" : FAINT, fontWeight: 700, fontSize: 14, cursor: form.naam && form.kcal ? "pointer" : "default" }}>
                Toevoegen →
              </button>
            </div>
          )}

          {/* Selected product + portion adjuster */}
          {selected && !manual && (
            <div style={{ marginBottom: 12, padding: 14, background: "#0d0d0d", border: `1px solid ${BD2}`, borderRadius: 13 }}>
              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                {selected.image ? (
                  <img src={selected.image} alt="" style={{ width: 50, height: 50, borderRadius: 9, objectFit: "cover", flexShrink: 0, background: BD3 }} />
                ) : (
                  <div style={{ width: 50, height: 50, borderRadius: 9, background: BD3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🍽</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 600, margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selected.name}</p>
                  {selected.brand && <p style={{ ...MONO, fontSize: 10, color: FAINT, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selected.brand}</p>}
                </div>
                <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: FAINT, fontSize: 18, cursor: "pointer", padding: 0, alignSelf: "flex-start", lineHeight: 1, flexShrink: 0 }}>×</button>
              </div>

              {/* Portion */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "8px 12px", background: TILE, borderRadius: 9, border: `1px solid ${BORDER}` }}>
                <span style={{ ...MONO, fontSize: 9.5, color: FAINT, letterSpacing: "0.2em", textTransform: "uppercase", flex: 1 }}>Portie</span>
                <input type="number" value={portie} onChange={e => setPortie(e.target.value)} min="1"
                  style={{ width: 64, padding: "5px 8px", borderRadius: 7, border: `1px solid ${BD2}`, background: "#0a0a0a", color: TEXT, fontSize: 15, fontWeight: 700, outline: "none", textAlign: "center" }} />
                <span style={{ ...MONO, fontSize: 10, color: DIM }}>gram</span>
              </div>

              {/* Live macros */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 5, marginBottom: 13 }}>
                {[
                  { l: "Kcal",  v: macros.kcal,         color: G    },
                  { l: "Eiwit", v: macros.eiwitten,      color: PROT },
                  { l: "Koolh", v: macros.koolhydraten,  color: CARB },
                  { l: "Vet",   v: macros.vetten,        color: FAT  },
                ].map(({ l, v, color }) => (
                  <div key={l} style={{ textAlign: "center", padding: "8px 4px", background: TILE, borderRadius: 8, border: `1px solid ${BORDER}` }}>
                    <p style={{ ...MONO, fontSize: 8.5, color: FAINT, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.14em" }}>{l}</p>
                    <p style={{ fontSize: 15, fontWeight: 800, color, margin: 0, letterSpacing: "-0.01em" }}>{v}</p>
                  </div>
                ))}
              </div>

              <button onClick={confirmAdd}
                style={{ width: "100%", padding: "12px 0", borderRadius: 11, border: "none", background: G, color: "#061a0c", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Toevoegen →
              </button>
            </div>
          )}

          {/* Error */}
          {searchErr && <p style={{ color: "#fca5a5", fontSize: 12, textAlign: "center", padding: "8px 0" }}>{searchErr}</p>}

          {/* Hints */}
          {!loading && !searchErr && q.length > 0 && q.length < 3 && !selected && (
            <p style={{ ...MONO, color: FAINT, fontSize: 11, textAlign: "center", padding: "10px 0", letterSpacing: "0.1em" }}>Typ minimaal 3 tekens om te zoeken</p>
          )}
          {!loading && !searchErr && q.length >= 3 && results.length === 0 && !selected && (
            <p style={{ color: FAINT, fontSize: 13, textAlign: "center", padding: "20px 0" }}>Geen resultaten gevonden. Probeer handmatige invoer.</p>
          )}

          {/* Search results */}
          {!selected && results.map((p, i) => (
            <div key={i} onClick={() => { setSelected(p); setPortie("100"); setRes([]) }}
              style={{ padding: "10px 0", borderBottom: `1px solid ${BORDER}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 11 }}>
              {p.image ? (
                <img src={p.image} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", flexShrink: 0, background: BD3 }} />
              ) : (
                <div style={{ width: 44, height: 44, borderRadius: 8, background: BD3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🍽</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 2px", color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                {p.brand && <p style={{ ...MONO, fontSize: 9.5, color: FAINT, margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.brand}</p>}
                <p style={{ ...MONO, fontSize: 10, color: FAINT, margin: 0 }}>
                  <span style={{ color: DIM, fontWeight: 600 }}>{p.kcal} kcal</span>
                  <span style={{ margin: "0 4px" }}>·</span>E {p.eiwitten}g
                  <span style={{ margin: "0 4px" }}>·</span>K {p.koolhydraten}g
                  <span style={{ margin: "0 4px" }}>·</span>V {p.vetten}g
                  <span style={{ color: FAINT }}> /100g</span>
                </p>
              </div>
              <span style={{ color: G, fontSize: 16, flexShrink: 0 }}>›</span>
            </div>
          ))}
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
    try {
      const res = await fetch(`/api/food/log?userId=${encodeURIComponent(uid)}&date=${getNLDate()}`)
      const d   = await res.json()
      setFoodLogs(d.logs || [])
    } catch (err) {
      console.error("[loadFoodLogs] error:", err.message)
    }
    setLoadingLogs(false)
  }

  async function loadMealPlan() {
    setLoadingPlan(true)
    const monday = getMondayNL()
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) { setLoadingPlan(false); return }
      const res = await fetch(`/api/nutrition/meal-plan?weekStart=${monday}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const d = await res.json()
      setMealPlan(d.plan || null)
    } catch (err) {
      console.error("[loadMealPlan] error:", err.message)
    }
    setLoadingPlan(false)
  }

  useEffect(() => {
    if (uid) loadFoodLogs()
    loadMealPlan()
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
      // default false = "still need to buy"; true = "I have this at home"
      const next = { ...prev, [key]: !(prev[key] ?? false) }
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
      const needed = items.filter(item => !(checkedItems[`${cat}_${item.naam}`] ?? false))
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

  // Only count eaten items (done = true) toward kcal/macros
  const totals = foodLogs.filter(f => f.done).reduce((a, f) => ({
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

  async function logWeekMenuItem(mealId, item) {
    if (!uid) return
    const res = await fetch("/api/food/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id:      uid,
        date:         getNLDate(),
        meal_type:    mealId,
        product_name: item.naam,
        kcal:         item.kcal         || 0,
        eiwitten:     item.eiwitten     || 0,
        koolhydraten: item.koolhydraten || 0,
        vetten:       item.vetten       || 0,
        portie_gram:  100,
        source:       "WEEKMENU",
        done:         true,
      }),
    })
    const d = await res.json()
    if (d.error) { console.error("[logWeekMenuItem] error:", d.error); return }
    loadFoodLogs()
  }

  async function toggleFoodDone(id, current) {
    const newDone = !current
    setFoodLogs(prev => prev.map(f => f.id === id ? { ...f, done: newDone } : f))
    fetch("/api/food/log", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, done: newDone }),
    }).catch(err => console.error("[toggleFoodDone]", err.message))
  }

  async function deleteFoodLog(id) {
    setFoodLogs(prev => prev.filter(f => f.id !== id))
    fetch(`/api/food/log?id=${encodeURIComponent(id)}`, { method: "DELETE" })
      .catch(err => console.error("[deleteFoodLog]", err.message))
  }

  async function generateMealPlan() {
    setAiGenLoading(true)
    setAiGenError("")
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) { setAiGenError("Niet ingelogd — herlaad de pagina."); setAiGenLoading(false); return }
      const monday = getMondayNL()
      const res = await fetch("/api/nutrition/generate-week", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ weekStart: monday, kcalDoel: doelKcal, eiwittenDoel: doelEiwit, koolhydratenDoel: doelKoolh, vettenDoel: doelVet, prefs: aiPrefs }),
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

  // Today's weekmenu (for Vandaag tab pre-fill)
  const todayDow = (() => { const d = new Date(getNLDate()).getDay(); return d === 0 ? 6 : d - 1 })()
  const todayWeekMenuMeals = mealPlan?.plan?.[DAYS_FULL[todayDow]] || null

  const dayTotals = dayPlan ? Object.values(dayPlan).flat().reduce((a, r) => ({
    kcal: a.kcal + (r.kcal || 0),
    eiwitten: a.eiwitten + (r.eiwitten || 0),
    koolhydraten: a.koolhydraten + (r.koolhydraten || 0),
    vetten: a.vetten + (r.vetten || 0),
  }), { kcal: 0, eiwitten: 0, koolhydraten: 0, vetten: 0 }) : null

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
          const logs    = byMeal[meal.id] || []
          const mealKcal = logs.reduce((s, f) => s + (f.kcal || 0), 0)

          // Weekmenu suggestions: items from today's plan not yet logged (no WEEKMENU entry for this meal)
          const wmItems     = todayWeekMenuMeals?.[meal.id] || []
          const wmLogged    = logs.some(f => f.source?.toUpperCase() === "WEEKMENU")
          const showWmItems = wmItems.length > 0 && !wmLogged

          return (
            <div key={meal.id} style={{ background: TILE, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
              {/* Meal header */}
              <div style={{ padding: "11px 14px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, borderBottom: `1px solid ${BORDER}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.005em" }}>{meal.label}</span>
                  <span style={{ ...MONO, fontSize: 10.5, color: mealKcal > 0 ? DIM : FAINT, fontWeight: 500 }}>{mealKcal} kcal</span>
                  {showWmItems && (
                    <span style={{ ...MONO, fontSize: 8.5, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(34,197,94,0.6)", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 4, padding: "1px 5px" }}>Weekmenu</span>
                  )}
                </div>
                <button onClick={() => setAddFoodMeal(meal)}
                  style={{ width: 26, height: 26, borderRadius: 7, border: `1px solid ${BD2}`, background: "transparent", color: DIM, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", lineHeight: 1, fontWeight: 300 }}>+</button>
              </div>

              <div>
                {/* Weekmenu suggestions (pre-fill, tap checkbox to mark as eaten) */}
                {showWmItems && wmItems.map((item, i) => (
                  <div key={`wm-${i}`} style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 11, borderTop: i > 0 ? `1px solid ${BORDER}` : "none", background: "rgba(34,197,94,0.03)" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, overflow: "hidden", position: "relative", opacity: 0.7 }}>
                      <img src={item.image || MEAL_IMAGES[meal.id]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ ...MONO, fontSize: 9, fontWeight: 700, color: "#9ad1a8", lineHeight: 1 }}>{Math.round(item.kcal || 0)}</span>
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 500, letterSpacing: "-0.005em", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: DIM }}>{item.naam}</span>
                        <SourceBadge source="WEEKMENU" />
                      </div>
                      <p style={{ ...MONO, fontSize: 10.5, color: FAINT, margin: 0 }}>
                        <span style={{ color: FAINT, fontWeight: 500 }}>{item.kcal || 0} kcal</span>
                        {item.eiwitten > 0 && <><span style={{ margin: "0 5px" }}>·</span>E {item.eiwitten}g</>}
                        {item.koolhydraten > 0 && <><span style={{ margin: "0 5px" }}>·</span>K {item.koolhydraten}g</>}
                        {item.vetten > 0 && <><span style={{ margin: "0 5px" }}>·</span>V {item.vetten}g</>}
                      </p>
                    </div>
                    <div onClick={() => logWeekMenuItem(meal.id, item)}
                      style={{ width: 22, height: 22, borderRadius: 6, border: `1.5px dashed rgba(34,197,94,0.4)`, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
                      title="Klik om als gegeten te markeren" />
                  </div>
                ))}

                {/* Logged food items */}
                {logs.map((f, i) => (
                  <div key={f.id} style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 11, borderTop: (i > 0 || showWmItems) ? `1px solid ${BORDER}` : "none" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, overflow: "hidden", position: "relative" }}>
                      <img src={f.image || MEAL_IMAGES[meal.id]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ ...MONO, fontSize: 9, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{Math.round(f.kcal)}</span>
                      </div>
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

                {/* + row */}
                <div onClick={() => setAddFoodMeal(meal)}
                  style={{ padding: "11px 14px", display: "flex", alignItems: "center", gap: 11, color: FAINT, fontSize: 13, fontWeight: 500, borderTop: (logs.length > 0 || showWmItems) ? `1px solid ${BORDER}` : "none", cursor: "pointer" }}>
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
                  <div style={{ width: 80, flexShrink: 0, position: "relative", overflow: "hidden" }}>
                    <img src={r.image || MEAL_IMAGES[meal.id]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.28)" }} />
                    <div style={{ position: "absolute", top: 6, left: 6, ...MONO, fontSize: 8, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.85)", padding: "2px 5px", background: "rgba(0,0,0,0.5)", borderRadius: 3 }}>AI</div>
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
    // haveIt default = false (all start unchecked = "still need to buy")
    const toKopen    = shoppingList.reduce((s, g) =>
      s + g.items.filter(item => !(checkedItems[`${g.cat}_${item.naam}`] ?? false)).length, 0)
    const firstNeed  = shoppingList.flatMap(g =>
      g.items.filter(item => !(checkedItems[`${g.cat}_${item.naam}`] ?? false)).map(i => i.naam)
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
                const haveIt = checkedItems[key] ?? false  // false = need to buy; true = already have = crossed out
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
