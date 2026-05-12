"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"
import { AxisLogo } from "../../components/AxisLogo"

const GREEN = "#22c55e"

const inputStyle = {
  padding: "12px 16px", marginTop: 12, borderRadius: 8,
  border: "1px solid #333", background: "#1a1a1a", color: "white",
  width: 260, fontSize: 15, outline: "none", boxSizing: "border-box",
}

export default function Login() {
  const [email,     setEmail]     = useState("")
  const [password,  setPassword]  = useState("")
  const [isForgot,  setIsForgot]  = useState(false)
  const [error,     setError]     = useState("")
  const [message,   setMessage]   = useState("")
  const router = useRouter()

  async function handleForgot() {
    setError("")
    setMessage("")
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset`,
      })
      if (error) setError(error.message)
      else setMessage("Check je e-mail voor de reset link.")
    } catch (e) {
      setError(`Netwerkfout: ${e.message}`)
    }
  }

  async function handleLogin() {
    setError("")
    setMessage("")
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); return }
    const { data: profile } = await supabase.from("users").select("role").eq("auth_user_id", data.user.id).maybeSingle()
    router.replace(profile?.role === "coach" ? "/dashboard" : "/home")
  }

  return (
    <div style={{
      backgroundColor: "#0f0f0f", color: "white", minHeight: "100vh",
      display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column",
    }}>
      <div style={{ marginBottom: 8 }}><AxisLogo variant="loader" size={40} /></div>
      <p style={{ color: "#888", fontSize: 13, marginBottom: 24 }}>
        {isForgot ? "Wachtwoord vergeten" : "Log in op je account"}
      </p>

      <input
        type="email" placeholder="E-mailadres"
        value={email} onChange={e => setEmail(e.target.value)}
        onKeyDown={e => e.key === "Enter" && (isForgot ? handleForgot() : handleLogin())}
        style={inputStyle}
      />

      {!isForgot && (
        <input
          type="password" placeholder="Wachtwoord"
          value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          style={inputStyle}
        />
      )}

      {error   && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 12, maxWidth: 260 }}>{error}</p>}
      {message && <p style={{ color: GREEN,     fontSize: 13, marginTop: 12, maxWidth: 260 }}>{message}</p>}

      <button
        onClick={isForgot ? handleForgot : handleLogin}
        style={{
          marginTop: 16, padding: "12px 20px", borderRadius: 8, border: "none",
          background: GREEN, color: "black", fontWeight: "bold", cursor: "pointer",
          width: 284, fontSize: 15,
        }}>
        {isForgot ? "Reset link versturen" : "Inloggen"}
      </button>

      <p style={{ marginTop: 16, color: "#888", fontSize: 13 }}>
        Nog geen account?{" "}
        <a href="/signup" style={{ color: GREEN, textDecoration: "none" }}>Aanmelden</a>
      </p>

      <p
        onClick={() => { setIsForgot(f => !f); setError(""); setMessage("") }}
        style={{ marginTop: 8, color: "#555", fontSize: 12, cursor: "pointer" }}>
        {isForgot ? "Terug naar inloggen" : "Wachtwoord vergeten?"}
      </p>
    </div>
  )
}
