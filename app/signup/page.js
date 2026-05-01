"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"

const GREEN = "#22c55e"
const BG    = "#0f0f0f"
const CARD  = "#1a1a1a"

const DOELEN_OPTIES     = ["Afvallen", "Spiermassa opbouwen", "Fitter worden", "Onderhouden"]
const LOCATIE_OPTIES    = ["Gym", "Thuis", "Buiten", "Op reis"]
const FREQUENTIE_OPTIES = [1, 2, 3, 4, 5]
const NIVEAU_OPTIES     = ["Beginner", "Gemiddeld", "Gevorderd"]

function getNLDate() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" })
}

const inputStyle = {
  width: "100%", padding: "13px 14px", borderRadius: 8,
  border: "1px solid #333", background: "#111", color: "#fff",
  fontSize: 15, boxSizing: "border-box", outline: "none",
}
const btnPrimary = {
  width: "100%", padding: "14px", background: GREEN, border: "none",
  borderRadius: 8, fontWeight: "bold", cursor: "pointer", fontSize: 15, color: "#000",
}
const btnGhost = {
  width: "100%", padding: "12px", background: "transparent", border: "none",
  color: "#888", cursor: "pointer", fontSize: 13,
}

function optionBtn(selected) {
  return {
    padding: "14px", borderRadius: 8,
    border: `2px solid ${selected ? GREEN : "#333"}`,
    background: selected ? "#0a1a0f" : "#111",
    color: selected ? GREEN : "#fff",
    fontSize: 15, cursor: "pointer", textAlign: "left",
    fontWeight: selected ? "bold" : "normal",
  }
}

function checkBtn(selected) {
  return {
    display: "flex", alignItems: "center", gap: 12, padding: "13px 16px",
    borderRadius: 8, border: `2px solid ${selected ? GREEN : "#333"}`,
    background: selected ? "#0a1a0f" : "#111",
    color: selected ? GREEN : "#fff",
    fontSize: 14, cursor: "pointer", textAlign: "left",
    fontWeight: selected ? "bold" : "normal", width: "100%",
  }
}

function SubLabel({ children }) {
  return <p style={{ color: "#555", fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>{children}</p>
}

function StepLabel({ step, total }) {
  return (
    <p style={{ color: "#555", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 32 }}>
      Stap {step} van {total}
    </p>
  )
}

export default function SignupPage() {
  const router = useRouter()

  const [step, setStep]           = useState(0)
  const [user, setUser]           = useState(null)

  // Step 0 — account
  const [email, setEmail]         = useState("")
  const [password, setPassword]   = useState("")
  const [authError, setAuthError] = useState("")
  const [signingUp, setSigningUp] = useState(false)

  // Step 1 — naam
  const [naam, setNaam]           = useState("")

  // Step 2 — doelen (multi)
  const [doelen, setDoelen]       = useState([])

  // Step 3 — gewicht
  const [huidigGewicht, setHuidigGewicht] = useState("")
  const [doelGewicht, setDoelGewicht]     = useState("")

  // Step 4 — locaties (multi)
  const [locaties, setLocaties]   = useState([])

  // Step 5 — frequentie
  const [frequentie, setFrequentie] = useState(0)

  // Step 6 — niveau
  const [niveau, setNiveau]       = useState("")

  // Step 7 — WhatsApp
  const [whatsapp, setWhatsapp]   = useState("")
  const [finishing, setFinishing] = useState(false)

  const TOTAL = 7

  function toggleItem(list, setList, item) {
    setList(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item])
  }

  async function handleSignup(e) {
    e.preventDefault()
    setAuthError("")
    setSigningUp(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { setAuthError(error.message); setSigningUp(false); return }
    setUser(data.user)
    setStep(1)
    setSigningUp(false)
  }

  async function saveToUsers(extra = {}) {
    if (!user) return
    const payload = {
      naam: naam.trim() || null,
      doelen,
      training_locations: locaties,
      sport_frequentie: frequentie || null,
      fitness_level: niveau || null,
      current_weight: huidigGewicht ? parseFloat(huidigGewicht) : null,
      target_weight:  doelGewicht   ? parseFloat(doelGewicht)   : null,
      role: "b2c",
      ...extra,
    }
    const { data: existing } = await supabase.from("users").select("id").eq("auth_user_id", user.id).maybeSingle()
    if (existing) {
      await supabase.from("users").update(payload).eq("auth_user_id", user.id)
    } else {
      await supabase.from("users").insert({ ...payload, auth_user_id: user.id })
    }
  }

  async function finish(withWhatsapp) {
    setFinishing(true)
    try {
      await saveToUsers()
      if (withWhatsapp) {
        const formatted = withWhatsapp.startsWith("whatsapp:") ? withWhatsapp : `whatsapp:${withWhatsapp}`
        await supabase.from("users").upsert({ whatsapp_number: formatted, auth_user_id: user.id }, { onConflict: "whatsapp_number" })
      }
      router.replace("/home")
    } catch (err) {
      console.error("Signup finish error:", err)
      setFinishing(false)
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG, padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: 440, background: CARD, padding: 40, borderRadius: 12 }}>

        {/* ── Stap 0 — Account aanmaken ── */}
        {step === 0 && (
          <>
            <div style={{ marginBottom: 28 }}>
              <p style={{ color: GREEN, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>AXIS</p>
              <h2 style={{ fontSize: 22, color: "#fff", marginBottom: 8 }}>Maak je account aan</h2>
              <p style={{ color: "#888", fontSize: 14 }}>Start jouw accountability journey.</p>
            </div>
            <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>E-mailadres</p>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="jij@email.com" style={inputStyle} />
              </div>
              <div>
                <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Wachtwoord</p>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Minimaal 6 tekens" style={inputStyle} />
              </div>
              {authError && <p style={{ color: "#ef4444", fontSize: 13 }}>{authError}</p>}
              <button type="submit" disabled={signingUp} style={{ ...btnPrimary, opacity: signingUp ? 0.6 : 1 }}>
                {signingUp ? "Account aanmaken..." : "Account aanmaken →"}
              </button>
            </form>
            <p style={{ color: "#444", fontSize: 12, marginTop: 16, textAlign: "center" }}>
              Al een account? <a href="/login" style={{ color: GREEN }}>Log in</a>
            </p>
          </>
        )}

        {step > 0 && <StepLabel step={step} total={TOTAL} />}

        {/* ── Stap 1 — Naam ── */}
        {step === 1 && (
          <>
            <h2 style={{ marginBottom: 8, fontSize: 22, color: "#fff" }}>Wat is je naam?</h2>
            <SubLabel>Zodat je coach en AI coach je persoonlijk kunnen aanspreken.</SubLabel>
            <input autoFocus value={naam} onChange={e => setNaam(e.target.value)}
              onKeyDown={e => e.key === "Enter" && naam.trim() && setStep(2)}
              placeholder="Voornaam en achternaam"
              style={{ ...inputStyle, marginBottom: 24 }} />
            <button onClick={() => naam.trim() && setStep(2)}
              style={{ ...btnPrimary, opacity: naam.trim() ? 1 : 0.4, cursor: naam.trim() ? "pointer" : "default" }}>
              Volgende →
            </button>
          </>
        )}

        {/* ── Stap 2 — Doelen ── */}
        {step === 2 && (
          <>
            <h2 style={{ marginBottom: 8, fontSize: 22, color: "#fff" }}>Wat wil jij bereiken?</h2>
            <SubLabel>Meerdere antwoorden mogelijk. We stemmen je check-ins en workouts af op jouw doelen.</SubLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {DOELEN_OPTIES.map(d => (
                <button key={d} onClick={() => toggleItem(doelen, setDoelen, d)} style={checkBtn(doelen.includes(d))}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{doelen.includes(d) ? "☑" : "☐"}</span>
                  {d}
                </button>
              ))}
            </div>
            <button onClick={() => doelen.length > 0 && setStep(3)}
              style={{ ...btnPrimary, opacity: doelen.length > 0 ? 1 : 0.4, cursor: doelen.length > 0 ? "pointer" : "default" }}>
              Volgende →
            </button>
          </>
        )}

        {/* ── Stap 3 — Gewicht ── */}
        {step === 3 && (
          <>
            <h2 style={{ marginBottom: 8, fontSize: 22, color: "#fff" }}>Jouw gewicht</h2>
            <SubLabel>Optioneel. We gebruiken dit om je voortgang bij te houden.</SubLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              <div>
                <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Huidig gewicht (kg)</p>
                <input type="number" value={huidigGewicht} onChange={e => setHuidigGewicht(e.target.value)}
                  placeholder="bijv. 78" style={inputStyle} />
              </div>
              <div>
                <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Doelgewicht (kg)</p>
                <input type="number" value={doelGewicht} onChange={e => setDoelGewicht(e.target.value)}
                  placeholder="bijv. 72" style={inputStyle} />
              </div>
            </div>
            <button onClick={() => setStep(4)} style={btnPrimary}>Volgende →</button>
            <button onClick={() => setStep(4)} style={btnGhost}>Sla over →</button>
          </>
        )}

        {/* ── Stap 4 — Trainingslocaties ── */}
        {step === 4 && (
          <>
            <h2 style={{ marginBottom: 8, fontSize: 22, color: "#fff" }}>Waar train jij?</h2>
            <SubLabel>Meerdere mogelijk. Zodat we workouts tonen die passen bij waar jij traint.</SubLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {LOCATIE_OPTIES.map(loc => (
                <button key={loc} onClick={() => toggleItem(locaties, setLocaties, loc)} style={checkBtn(locaties.includes(loc))}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{locaties.includes(loc) ? "☑" : "☐"}</span>
                  {loc}
                </button>
              ))}
            </div>
            <button onClick={() => locaties.length > 0 && setStep(5)}
              style={{ ...btnPrimary, opacity: locaties.length > 0 ? 1 : 0.4, cursor: locaties.length > 0 ? "pointer" : "default" }}>
              Volgende →
            </button>
          </>
        )}

        {/* ── Stap 5 — Sportfrequentie ── */}
        {step === 5 && (
          <>
            <h2 style={{ marginBottom: 8, fontSize: 22, color: "#fff" }}>Hoe vaak per week sport je?</h2>
            <SubLabel>Zodat we een passend trainingsschema samenstellen.</SubLabel>
            <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
              {FREQUENTIE_OPTIES.map(n => (
                <button key={n} onClick={() => setFrequentie(n)} style={{
                  flex: 1, minWidth: 56, padding: "16px 8px", borderRadius: 8,
                  border: `2px solid ${frequentie === n ? GREEN : "#333"}`,
                  background: frequentie === n ? "#0a1a0f" : "#111",
                  color: frequentie === n ? GREEN : "#fff",
                  fontSize: 18, fontWeight: "bold", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                }}>
                  {n}{n === 5 ? "+" : ""}x
                  <span style={{ fontSize: 10, color: frequentie === n ? GREEN : "#555", fontWeight: "normal" }}>p.w.</span>
                </button>
              ))}
            </div>
            <button onClick={() => frequentie > 0 && setStep(6)}
              style={{ ...btnPrimary, opacity: frequentie > 0 ? 1 : 0.4, cursor: frequentie > 0 ? "pointer" : "default" }}>
              Volgende →
            </button>
          </>
        )}

        {/* ── Stap 6 — Fitnessniveau ── */}
        {step === 6 && (
          <>
            <h2 style={{ marginBottom: 8, fontSize: 22, color: "#fff" }}>Wat is je niveau?</h2>
            <SubLabel>Zodat de AI coach op jouw niveau reageert.</SubLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {NIVEAU_OPTIES.map(lvl => (
                <button key={lvl} onClick={() => setNiveau(lvl)} style={optionBtn(niveau === lvl)}>{lvl}</button>
              ))}
            </div>
            <button onClick={async () => { if (!niveau) return; await saveToUsers(); setStep(7) }}
              style={{ ...btnPrimary, opacity: niveau ? 1 : 0.4, cursor: niveau ? "pointer" : "default" }}>
              Volgende →
            </button>
          </>
        )}

        {/* ── Stap 7 — WhatsApp ── */}
        {step === 7 && (
          <>
            <h2 style={{ marginBottom: 8, fontSize: 22, color: "#fff" }}>Blijf op koers via WhatsApp</h2>
            <SubLabel>Zo ontvang je elke ochtend om 08:00 je dagelijkse check-in. Geen app nodig — gewoon reageren.</SubLabel>
            <input autoFocus value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
              placeholder="+31612345678" style={{ ...inputStyle, marginBottom: 12 }} />
            <button onClick={() => !finishing && whatsapp && finish(whatsapp)}
              disabled={finishing || !whatsapp}
              style={{ ...btnPrimary, marginBottom: 10, opacity: (finishing || !whatsapp) ? 0.5 : 1, cursor: (finishing || !whatsapp) ? "default" : "pointer" }}>
              {finishing ? "Bezig..." : "Koppel WhatsApp →"}
            </button>
            <button onClick={() => !finishing && finish(null)} disabled={finishing} style={btnGhost}>
              Sla over, ik gebruik de app
            </button>
          </>
        )}

      </div>
    </div>
  )
}
