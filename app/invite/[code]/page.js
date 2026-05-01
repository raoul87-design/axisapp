"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "../../../lib/supabase"

const GREEN = "#22c55e"
const BG    = "#0f0f0f"
const CARD  = "#1a1a1a"

const GOALS = ["Afvallen", "Aankomen", "Spiermassa", "Fitter worden"]
const GOAL_SUGGESTIONS = {
  "Afvallen":      ["30 min wandelen of fietsen", "Onder 1800 kcal blijven vandaag", "1,5 liter water drinken"],
  "Aankomen":      ["45 min krachttraining", "Minstens 150g eiwit eten vandaag", "Extra maaltijd voor het slapengaan"],
  "Spiermassa":    ["1 uur gym — compound oefeningen", "160g eiwit halen vandaag", "8 uur slapen"],
  "Fitter worden": ["20 min bewegen — wandelen telt ook", "Geen snacks na 20:00", "Vroeg naar bed — voor 23:00"],
}

function classifyCommitment(text) {
  const t = (text || "").toLowerCase()
  if (/sport|loop|lopen|fiets|gym|zwem|wandel|yoga|train|hardloop|stap|krachttraining|padel|voetbal|basket|tennis|dans|rennen|beweging|fitness/.test(t)) return "beweging"
  if (/eet|kcal|calorie|voeding|kook|groente|proteïne|eiwit|water|drinken|maaltijd|ontbijt|lunch|dieet|macro/.test(t)) return "voeding"
  return "overig"
}

function getNLDate() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" })
}

export default function InvitePage() {
  const { code } = useParams()
  const router   = useRouter()

  const [status, setStatus]         = useState("loading")
  const [coachEmail, setCoachEmail] = useState("")
  const [preData, setPreData]       = useState(null)

  const [user, setUser] = useState(null)

  const [signupEmail,    setSignupEmail]    = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [signupError,    setSignupError]    = useState("")
  const [signingUp,      setSigningUp]      = useState(false)

  // Full flow onboarding state
  const [step,             setStep]             = useState(0)
  const [selectedGoal,     setSelectedGoal]     = useState("")
  const [currentWeight,    setCurrentWeight]    = useState("")
  const [targetWeight,     setTargetWeight]     = useState("")
  const [trainingLocation, setTrainingLocation] = useState("")
  const [fitnessLevel,     setFitnessLevel]     = useState("")
  const [commitmentText,   setCommitmentText]   = useState("")
  const [whatsappInput,    setWhatsappInput]    = useState("")
  const [finishing,        setFinishing]        = useState(false)

  useEffect(() => {
    async function validate() {
      const { data, error } = await supabase
        .from("invite_links")
        .select("coach_email, gebruikt, client_email, pre_data")
        .eq("code", code)
        .single()

      if (error || !data) { setStatus("invalid"); return }
      if (data.gebruikt)  { setStatus("used");    return }
      setCoachEmail(data.coach_email)
      setPreData(data.pre_data || null)
      if (data.client_email) setSignupEmail(data.client_email)
      setStatus("ready")
    }
    validate()
  }, [code])

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u && step === 0) setStep(1)
    })
    return () => listener.subscription.unsubscribe()
  }, [step])

  async function handleSignUp(e) {
    e.preventDefault()
    setSignupError("")
    setSigningUp(true)
    const { error } = await supabase.auth.signUp({ email: signupEmail, password: signupPassword })
    if (error) { setSignupError(error.message); setSigningUp(false); return }
  }

  // ── Full flow helpers ────────────────────────────────────────

  async function saveGoal() {
    const payload = {
      goal: selectedGoal,
      current_weight: currentWeight ? parseFloat(currentWeight) : null,
      target_weight:  targetWeight  ? parseFloat(targetWeight)  : null,
    }
    const { data: existing } = await supabase.from("users").select("id").eq("auth_user_id", user.id).single()
    if (existing) {
      await supabase.from("users").update(payload).eq("auth_user_id", user.id)
    } else {
      await supabase.from("users").insert({ ...payload, auth_user_id: user.id })
    }
  }

  async function saveTrainingLocation() {
    await supabase.from("users").update({ training_location: trainingLocation }).eq("auth_user_id", user.id)
  }

  async function saveFitnessLevel() {
    await supabase.from("users").update({ fitness_level: fitnessLevel }).eq("auth_user_id", user.id)
  }

  async function saveCommitment(text) {
    const t = text || commitmentText
    if (!t) return
    await supabase.from("commitments").insert({
      text: t, user_id: user.id, date: getNLDate(), done: false, category: classifyCommitment(t),
    })
  }

  // ── Simplified flow finish (pre_data set by coach) ───────────

  async function finishSimplified(whatsapp) {
    setFinishing(true)
    try {
      const formatted = whatsapp && (whatsapp.startsWith("whatsapp:") ? whatsapp : `whatsapp:${whatsapp}`)
      const payload = {
        naam:               preData.naam              || null,
        doelen:             preData.doelen             || [],
        training_locations: preData.training_locations || [],
        fitness_level:      preData.fitness_level      || null,
        current_weight:     preData.current_weight     || null,
        target_weight:      preData.target_weight      || null,
        sport_frequentie:   preData.sport_frequentie   || null,
        coach_email:        coachEmail,
        role:               "client",
        ...(formatted ? { whatsapp_number: formatted } : {}),
      }
      const { data: existing } = await supabase.from("users").select("id").eq("auth_user_id", user.id).maybeSingle()
      if (existing) {
        await supabase.from("users").update(payload).eq("auth_user_id", user.id)
      } else {
        await supabase.from("users").insert({ ...payload, auth_user_id: user.id })
      }
      await supabase.from("invite_links").update({ gebruikt: true }).eq("code", code)
      router.replace("/home")
    } catch (err) {
      console.error("Simplified finish error:", err)
      setFinishing(false)
    }
  }

  // ── Full flow finish ─────────────────────────────────────────

  async function finishOnboarding(whatsapp) {
    setFinishing(true)
    try {
      if (whatsapp) {
        const formatted = whatsapp.startsWith("whatsapp:") ? whatsapp : `whatsapp:${whatsapp}`
        await supabase.from("users")
          .upsert({ whatsapp_number: formatted, auth_user_id: user.id }, { onConflict: "whatsapp_number" })
      }
      await supabase.from("users")
        .update({ coach_email: coachEmail, role: "client" })
        .eq("auth_user_id", user.id)
      await supabase.from("invite_links")
        .update({ gebruikt: true })
        .eq("code", code)
      router.replace("/home")
    } catch (err) {
      console.error("Finishing onboarding failed:", err)
      setFinishing(false)
    }
  }

  // ── Styles ───────────────────────────────────────────────────

  const totalSteps = preData ? 2 : 6
  const inputStyle = {
    width: "100%", padding: "13px 14px", borderRadius: 8,
    border: `1px solid #333`, background: "#111", color: "#fff",
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
  const optionBtn = (selected) => ({
    padding: "14px", borderRadius: 8,
    border: `2px solid ${selected ? GREEN : "#333"}`,
    background: selected ? "#0a1a0f" : "#111",
    color: selected ? GREEN : "#fff",
    fontSize: 15, cursor: "pointer", textAlign: "left",
    fontWeight: selected ? "bold" : "normal",
  })

  // ── Render states ────────────────────────────────────────────

  if (status === "loading") {
    return <Screen><p style={{ color: "#555" }}>Invite laden...</p></Screen>
  }
  if (status === "invalid") {
    return <Screen><p style={{ color: "#ef4444", marginBottom: 8 }}>Ongeldige invite link.</p><p style={{ color: "#555", fontSize: 14 }}>Vraag je coach om een nieuwe link.</p></Screen>
  }
  if (status === "used") {
    return <Screen><p style={{ color: "#ef4444", marginBottom: 8 }}>Deze invite link is al gebruikt.</p><p style={{ color: "#555", fontSize: 14 }}>Heb je al een account? <a href="/login" style={{ color: GREEN }}>Log in</a></p></Screen>
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG, padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: 420, background: CARD, padding: 40, borderRadius: 12 }}>

        {step > 0 && (
          <p style={{ color: "#555", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 32 }}>
            Stap {step} van {totalSteps}
          </p>
        )}

        {/* ── Stap 0 — Account aanmaken ── */}
        {step === 0 && (
          <>
            <div style={{ marginBottom: 28 }}>
              <p style={{ color: GREEN, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Je bent uitgenodigd</p>
              <h2 style={{ fontSize: 22, color: "#fff", marginBottom: 8 }}>Maak je account aan</h2>
              <p style={{ color: "#888", fontSize: 14 }}>Je coach heeft je toegang gegeven tot AXIS.</p>
            </div>
            <form onSubmit={handleSignUp} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>E-mailadres</p>
                <input type="email" required value={signupEmail} onChange={e => setSignupEmail(e.target.value)}
                  placeholder="jij@email.com" style={inputStyle} />
              </div>
              <div>
                <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Wachtwoord</p>
                <input type="password" required value={signupPassword} onChange={e => setSignupPassword(e.target.value)}
                  placeholder="Minimaal 6 tekens" style={inputStyle} />
              </div>
              {signupError && <p style={{ color: "#ef4444", fontSize: 13 }}>{signupError}</p>}
              <button type="submit" disabled={signingUp} style={{ ...btnPrimary, opacity: signingUp ? 0.6 : 1 }}>
                {signingUp ? "Account aanmaken..." : "Account aanmaken →"}
              </button>
            </form>
            <p style={{ color: "#444", fontSize: 12, marginTop: 16, textAlign: "center" }}>
              Al een account? <a href="/login" style={{ color: GREEN }}>Log in</a>
            </p>
          </>
        )}

        {/* ══ SIMPLIFIED FLOW (preData ingevuld door coach) ══════ */}

        {/* Stap 1 — Bevestig gegevens */}
        {preData && step === 1 && (
          <>
            <h2 style={{ marginBottom: 8, fontSize: 22, color: "#fff" }}>Jouw gegevens</h2>
            <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>Je coach heeft dit al voor je ingevuld. Klopt alles?</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
              {[
                preData.naam                   && { label: "Naam",           value: preData.naam },
                preData.doelen?.length         && { label: "Doelen",         value: preData.doelen.join(", ") },
                preData.fitness_level          && { label: "Niveau",         value: preData.fitness_level },
                preData.training_locations?.length && { label: "Locaties",   value: preData.training_locations.join(", ") },
                preData.sport_frequentie       && { label: "Frequentie",     value: `${preData.sport_frequentie}× per week` },
                preData.current_weight         && { label: "Huidig gewicht", value: `${preData.current_weight} kg` },
                preData.target_weight          && { label: "Doelgewicht",    value: `${preData.target_weight} kg` },
              ].filter(Boolean).map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderRadius: 8, background: "#111", border: "1px solid #222" }}>
                  <span style={{ color: "#555", fontSize: 13 }}>{label}</span>
                  <span style={{ color: "#fff", fontSize: 13 }}>{value}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setStep(2)} style={btnPrimary}>Ziet er goed uit →</button>
          </>
        )}

        {/* Stap 2 — WhatsApp (simplified) */}
        {preData && step === 2 && (
          <>
            <h2 style={{ marginBottom: 8, fontSize: 22, color: "#fff" }}>Blijf op koers via WhatsApp</h2>
            <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>AXIS stuurt je dagelijks een check-in.<br />Geen app nodig — gewoon reageren.</p>
            <input autoFocus value={whatsappInput} onChange={e => setWhatsappInput(e.target.value)}
              placeholder="+31612345678" style={{ ...inputStyle, marginBottom: 12 }} />
            <button onClick={() => !finishing && whatsappInput && finishSimplified(whatsappInput)}
              disabled={finishing || !whatsappInput}
              style={{ ...btnPrimary, marginBottom: 10, opacity: (finishing || !whatsappInput) ? 0.5 : 1, cursor: (finishing || !whatsappInput) ? "default" : "pointer" }}>
              {finishing ? "Bezig..." : "Koppel WhatsApp →"}
            </button>
            <button onClick={() => !finishing && finishSimplified(null)} disabled={finishing} style={btnGhost}>
              Sla over, ik gebruik de app
            </button>
          </>
        )}

        {/* ══ FULL FLOW (geen pre_data) ══════════════════════════ */}

        {/* Stap 1 — Doel */}
        {!preData && step === 1 && (
          <>
            <h2 style={{ marginBottom: 8, fontSize: 22, color: "#fff" }}>Wat is je doel?</h2>
            <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>Kies het doel waar je nu op focust.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {GOALS.map(g => (
                <button key={g} onClick={() => setSelectedGoal(g)} style={optionBtn(selectedGoal === g)}>{g}</button>
              ))}
            </div>
            <button onClick={() => selectedGoal && setStep(2)} style={{ ...btnPrimary, opacity: selectedGoal ? 1 : 0.4, cursor: selectedGoal ? "pointer" : "default" }}>
              Volgende →
            </button>
          </>
        )}

        {/* Stap 2 — Gewicht */}
        {!preData && step === 2 && (
          <>
            <h2 style={{ marginBottom: 8, fontSize: 22, color: "#fff" }}>Jouw gewicht</h2>
            <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>Optioneel — helpt AXIS je voortgang bij te houden.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              <div>
                <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Huidig gewicht (kg)</p>
                <input type="number" value={currentWeight} onChange={e => setCurrentWeight(e.target.value)} placeholder="bijv. 78" style={inputStyle} />
              </div>
              <div>
                <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Doelgewicht (kg)</p>
                <input type="number" value={targetWeight} onChange={e => setTargetWeight(e.target.value)} placeholder="bijv. 72" style={inputStyle} />
              </div>
            </div>
            <button onClick={async () => { await saveGoal(); setStep(3) }} style={btnPrimary}>Volgende →</button>
            <button onClick={async () => { await saveGoal(); setStep(3) }} style={btnGhost}>Sla over</button>
          </>
        )}

        {/* Stap 3 — Trainingslocatie */}
        {!preData && step === 3 && (
          <>
            <h2 style={{ marginBottom: 8, fontSize: 22, color: "#fff" }}>Waar train je?</h2>
            <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>AXIS past de coaching aan op jouw situatie.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {["Gym", "Thuis", "Buiten", "Wisselend"].map(loc => (
                <button key={loc} onClick={() => setTrainingLocation(loc)} style={optionBtn(trainingLocation === loc)}>{loc}</button>
              ))}
            </div>
            <button onClick={async () => { if (!trainingLocation) return; await saveTrainingLocation(); setStep(4) }}
              style={{ ...btnPrimary, opacity: trainingLocation ? 1 : 0.4, cursor: trainingLocation ? "pointer" : "default" }}>
              Volgende →
            </button>
          </>
        )}

        {/* Stap 4 — Fitnessniveau */}
        {!preData && step === 4 && (
          <>
            <h2 style={{ marginBottom: 8, fontSize: 22, color: "#fff" }}>Wat is je niveau?</h2>
            <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>Zodat de coach je uitdaagt op jouw niveau.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {["Beginner", "Gemiddeld", "Gevorderd"].map(lvl => (
                <button key={lvl} onClick={() => setFitnessLevel(lvl)} style={optionBtn(fitnessLevel === lvl)}>{lvl}</button>
              ))}
            </div>
            <button onClick={async () => { if (!fitnessLevel) return; await saveFitnessLevel(); setStep(5) }}
              style={{ ...btnPrimary, opacity: fitnessLevel ? 1 : 0.4, cursor: fitnessLevel ? "pointer" : "default" }}>
              Volgende →
            </button>
          </>
        )}

        {/* Stap 5 — Eerste commitment */}
        {!preData && step === 5 && (
          <>
            <h2 style={{ marginBottom: 8, fontSize: 22, color: "#fff" }}>Wat ga jij vandaag doen?</h2>
            <p style={{ color: "#888", fontSize: 14, marginBottom: 20 }}>Kies een suggestie of typ je eigen commitment.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {(GOAL_SUGGESTIONS[selectedGoal] || []).map(s => (
                <button key={s} onClick={async () => { await saveCommitment(s); setStep(6) }}
                  style={{ padding: "13px 14px", borderRadius: 8, border: `1px solid #333`, background: "#111", color: "#fff", fontSize: 14, cursor: "pointer", textAlign: "left" }}>
                  {s}
                </button>
              ))}
            </div>
            <p style={{ color: "#555", fontSize: 12, marginBottom: 8 }}>Of typ zelf:</p>
            <input autoFocus value={commitmentText} onChange={e => setCommitmentText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && commitmentText) { saveCommitment(); setStep(6) } }}
              placeholder="bijv. 30 minuten sporten"
              style={{ ...inputStyle, marginBottom: 12 }} />
            <button onClick={async () => { if (!commitmentText) return; await saveCommitment(); setStep(6) }}
              style={{ ...btnPrimary, opacity: commitmentText ? 1 : 0.4, cursor: commitmentText ? "pointer" : "default" }}>
              Dit is mijn commitment →
            </button>
          </>
        )}

        {/* Stap 6 — WhatsApp (full flow) */}
        {!preData && step === 6 && (
          <>
            <h2 style={{ marginBottom: 8, fontSize: 22, color: "#fff" }}>Blijf op koers via WhatsApp</h2>
            <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>AXIS stuurt je dagelijks een check-in.<br />Geen app nodig — gewoon reageren.</p>
            <input autoFocus value={whatsappInput} onChange={e => setWhatsappInput(e.target.value)}
              placeholder="+31612345678" style={{ ...inputStyle, marginBottom: 12 }} />
            <button onClick={() => !finishing && finishOnboarding(whatsappInput)}
              disabled={finishing || !whatsappInput}
              style={{ ...btnPrimary, marginBottom: 10, opacity: (finishing || !whatsappInput) ? 0.5 : 1, cursor: (finishing || !whatsappInput) ? "default" : "pointer" }}>
              {finishing ? "Bezig..." : "Koppel WhatsApp (aanbevolen)"}
            </button>
            <button onClick={() => !finishing && finishOnboarding(null)} disabled={finishing} style={btnGhost}>
              Sla over, ik gebruik de app
            </button>
          </>
        )}

      </div>
    </div>
  )
}

function Screen({ children }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f0f0f", padding: 24 }}>
      <div style={{ background: "#1a1a1a", padding: 40, borderRadius: 12, maxWidth: 420, width: "100%", textAlign: "center" }}>
        {children}
      </div>
    </div>
  )
}
