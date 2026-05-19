"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "../../../lib/supabase"

const GREEN = "#22c55e"
const BG    = "#0f0f0f"
const CARD  = "#1a1a1a"

export default function InvitePage() {
  const { code } = useParams()
  const router   = useRouter()

  const [status,        setStatus]        = useState("loading")
  const [coachEmail,    setCoachEmail]    = useState("")
  const [preData,       setPreData]       = useState(null)
  const [signupEmail,   setSignupEmail]   = useState("")
  const [signupPassword,setSignupPassword]= useState("")
  const [signupError,   setSignupError]   = useState("")
  const [signingUp,     setSigningUp]     = useState(false)

  useEffect(() => {
    async function validate() {
      const res = await fetch(`/api/invite/validate?code=${encodeURIComponent(code)}`)
      if (!res.ok) { setStatus("invalid"); return }
      const data = await res.json()
      if (data.gebruikt) { setStatus("used"); return }
      setCoachEmail(data.coach_email)
      setPreData(data.pre_data || null)
      if (data.client_email) setSignupEmail(data.client_email)
      setStatus("ready")
    }
    validate()
  }, [code])

  async function handleSignUp(e) {
    e.preventDefault()
    setSignupError("")
    setSigningUp(true)

    const { data: authData, error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: { emailRedirectTo: "https://app.axisapp.nl/home" },
    })

    if (error) {
      setSignupError(error.message)
      setSigningUp(false)
      return
    }

    const authUser = authData?.user
    if (!authUser) {
      setSignupError("Controleer je e-mail voor een bevestigingslink.")
      setSigningUp(false)
      return
    }

    try {
      const { data: inviteRow } = await supabase
        .from("invite_links")
        .select("coach_email, pre_data")
        .eq("code", code)
        .maybeSingle()

      const resolvedCoachEmail = inviteRow?.coach_email || coachEmail
      const resolvedPreData    = inviteRow?.pre_data    || preData

      console.log("[invite] coach_email uit invite_links:", resolvedCoachEmail)

      const payload = {
        auth_user_id:         authUser.id,
        naam:                 resolvedPreData?.naam                          || null,
        training_locations:   resolvedPreData?.training_locations?.length
                                ? resolvedPreData.training_locations : [],
        fitness_level:        resolvedPreData?.fitness_level                 || null,
        target_weight:        resolvedPreData?.target_weight                 || null,
        sport_frequentie:     resolvedPreData?.sport_frequentie              || null,
        coach_email:          resolvedCoachEmail,
        role:                 "client",
        has_coach:            true,
        onboarding_completed: false,
      }

      const { data: existing } = await supabase
        .from("users").select("id").eq("auth_user_id", authUser.id).maybeSingle()

      if (existing) {
        await supabase.from("users").update(payload).eq("id", existing.id)
      } else {
        await supabase.from("users").insert(payload)
      }

      await supabase.from("invite_links").update({ gebruikt: true }).eq("code", code)
      router.replace("/home")
    } catch (err) {
      console.error("Invite finish error:", err)
      setSignupError("Er ging iets mis. Probeer opnieuw.")
      setSigningUp(false)
    }
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

  if (status === "loading") {
    return <Screen><p style={{ color: "#555" }}>Invite laden...</p></Screen>
  }
  if (status === "invalid") {
    return (
      <Screen>
        <p style={{ color: "#ef4444", marginBottom: 8 }}>Ongeldige invite link.</p>
        <p style={{ color: "#555", fontSize: 14 }}>Vraag je coach om een nieuwe link.</p>
      </Screen>
    )
  }
  if (status === "used") {
    return (
      <Screen>
        <p style={{ color: "#ef4444", marginBottom: 8 }}>Deze invite link is al gebruikt.</p>
        <p style={{ color: "#555", fontSize: 14 }}>
          Heb je al een account?{" "}
          <a href="/login" style={{ color: GREEN }}>Log in</a>
        </p>
      </Screen>
    )
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG, padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: 420, background: CARD, padding: 40, borderRadius: 12 }}>

        <div style={{ marginBottom: 28 }}>
          <p style={{ color: GREEN, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>
            Je bent uitgenodigd
          </p>
          <h2 style={{ fontSize: 22, color: "#fff", marginBottom: 8 }}>Maak je account aan</h2>
          <p style={{ color: "#888", fontSize: 14 }}>Je coach heeft je toegang gegeven tot AXIS.</p>
        </div>

        {signingUp ? (
          <p style={{ color: "#555", textAlign: "center", padding: "20px 0" }}>Account aanmaken...</p>
        ) : (
          <form onSubmit={handleSignUp} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>E-mailadres</p>
              <input
                type="email" required
                value={signupEmail} onChange={e => setSignupEmail(e.target.value)}
                placeholder="jij@email.com" style={inputStyle}
              />
            </div>
            <div>
              <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Wachtwoord</p>
              <input
                type="password" required
                value={signupPassword} onChange={e => setSignupPassword(e.target.value)}
                placeholder="Minimaal 6 tekens" style={inputStyle}
              />
            </div>
            {signupError && <p style={{ color: "#ef4444", fontSize: 13 }}>{signupError}</p>}
            <button type="submit" style={btnPrimary}>Account aanmaken →</button>
          </form>
        )}

        <p style={{ color: "#444", fontSize: 12, marginTop: 16, textAlign: "center" }}>
          Al een account?{" "}
          <a href="/login" style={{ color: GREEN }}>Log in</a>
        </p>

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
