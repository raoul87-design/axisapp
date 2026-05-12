"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"

const GREEN = "#22c55e"

const inputStyle = {
  width: "100%", padding: "13px 14px", borderRadius: 8,
  border: "1px solid #333", background: "#111", color: "#fff",
  fontSize: 15, boxSizing: "border-box", outline: "none",
}

export default function SignupPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [error,    setError]    = useState("")
  const [loading,  setLoading]  = useState(false)

  async function handleSignup(e) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const { data, error: authErr } = await supabase.auth.signUp({ email, password })
    if (authErr) { setError(authErr.message); setLoading(false); return }
    await supabase.from("users").insert({
      auth_user_id:         data.user.id,
      role:                 "b2c",
      has_coach:            false,
      onboarding_completed: false,
    })
    router.replace("/home")
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f0f0f", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: 420, background: "#1a1a1a", padding: 40, borderRadius: 12 }}>

        <div style={{ marginBottom: 28 }}>
          <p style={{ color: GREEN, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 12px" }}>AXIS</p>
          <h2 style={{ fontSize: 22, color: "#fff", margin: "0 0 8px" }}>Maak je account aan</h2>
          <p style={{ color: "#888", fontSize: 14, margin: 0 }}>Start jouw accountability journey.</p>
        </div>

        <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>E-mailadres</p>
            <input
              type="email" required
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="jij@email.com" style={inputStyle}
            />
          </div>
          <div>
            <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Wachtwoord</p>
            <input
              type="password" required minLength={6}
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Minimaal 6 tekens" style={inputStyle}
            />
          </div>
          {error && <p style={{ color: "#ef4444", fontSize: 13, margin: 0 }}>{error}</p>}
          <button
            type="submit" disabled={loading}
            style={{ width: "100%", padding: "14px", background: GREEN, border: "none", borderRadius: 8, fontWeight: "bold", cursor: loading ? "default" : "pointer", fontSize: 15, color: "#000", opacity: loading ? 0.6 : 1 }}>
            {loading ? "Account aanmaken..." : "Maak account aan →"}
          </button>
        </form>

        <p style={{ color: "#444", fontSize: 12, marginTop: 20, textAlign: "center" }}>
          Al een account?{" "}
          <a href="/login" style={{ color: GREEN, textDecoration: "none" }}>Log in</a>
        </p>

      </div>
    </div>
  )
}
