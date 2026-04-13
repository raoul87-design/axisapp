"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../../lib/supabase"

export default function ResetPassword() {
  const [password, setPassword] = useState("")
  const [ready, setReady] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code")

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          setError("Link ongeldig of verlopen. Vraag een nieuwe aan.")
        } else {
          setReady(true)
        }
      })
    } else {
      setError("Geen reset code gevonden in de URL.")
    }
  }, [])

  async function handleReset() {
    setError("")
    if (password.length < 6) {
      setError("Wachtwoord moet minimaal 6 tekens zijn.")
      return
    }

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
    } else {
      alert("Wachtwoord opgeslagen! Je wordt ingelogd.")
      router.replace("/")
    }
  }

  return (
    <div style={{
      backgroundColor: "#0f0f0f",
      color: "white",
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "column",
    }}>
      <h1 style={{ fontSize: 40, marginBottom: 8 }}>AXIS</h1>
      <p style={{ color: "#888", fontSize: 13, marginBottom: 24 }}>Nieuw wachtwoord instellen</p>

      {error && (
        <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 16, maxWidth: 260 }}>
          {error}
        </p>
      )}

      {ready && (
        <>
          <input
            type="password"
            placeholder="Nieuw wachtwoord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleReset()}
            autoFocus
            style={{
              padding: "12px 16px",
              borderRadius: 8,
              border: "1px solid #333",
              background: "#1a1a1a",
              color: "white",
              width: 260,
              fontSize: 15,
            }}
          />

          <button
            onClick={handleReset}
            style={{
              marginTop: 16,
              padding: "12px 20px",
              borderRadius: 8,
              border: "none",
              background: "#22c55e",
              color: "black",
              fontWeight: "bold",
              cursor: "pointer",
              width: 284,
              fontSize: 15,
            }}
          >
            Wachtwoord opslaan
          </button>
        </>
      )}

      {!ready && !error && (
        <p style={{ color: "#888", fontSize: 13 }}>Bezig met verifiëren...</p>
      )}
    </div>
  )
}
