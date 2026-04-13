"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function handleForgot() {
    setError("")
    setMessage("")
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`
    })
    if (error) {
      setError(error.message)
    } else {
      setMessage("Check je e-mail voor de reset link.")
    }
  }

  async function handleSubmit() {
    setError("")
    setMessage("")

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        alert("Account aangemaakt! Je kunt nu inloggen.")
        setIsSignUp(false)
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        router.replace("/")
      }
    }
  }

  const inputStyle = {
    padding: "12px 16px",
    marginTop: 12,
    borderRadius: 8,
    border: "1px solid #333",
    background: "#1a1a1a",
    color: "white",
    width: 260,
    fontSize: 15,
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
      <p style={{ color: "#888", fontSize: 13, marginBottom: 24 }}>
        {isForgot ? "Wachtwoord vergeten" : isSignUp ? "Maak een account aan" : "Log in op je account"}
      </p>

      <input
        type="email"
        placeholder="E-mailadres"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && (isForgot ? handleForgot() : handleSubmit())}
        style={inputStyle}
      />

      {!isForgot && (
        <input
          type="password"
          placeholder="Wachtwoord"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          style={inputStyle}
        />
      )}

      {error && (
        <p style={{ color: "#ef4444", fontSize: 13, marginTop: 12, maxWidth: 260 }}>
          {error}
        </p>
      )}

      {message && (
        <p style={{ color: "#22c55e", fontSize: 13, marginTop: 12, maxWidth: 260 }}>
          {message}
        </p>
      )}

      <button
        onClick={isForgot ? handleForgot : handleSubmit}
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
        {isForgot ? "Reset link versturen" : isSignUp ? "Account aanmaken" : "Inloggen"}
      </button>

      {!isForgot && (
        <p
          onClick={() => { setIsSignUp(!isSignUp); setError(""); setMessage("") }}
          style={{ marginTop: 16, color: "#888", fontSize: 13, cursor: "pointer" }}
        >
          {isSignUp ? "Al een account? Inloggen" : "Nog geen account? Aanmelden"}
        </p>
      )}

      <p
        onClick={() => { setIsForgot(!isForgot); setError(""); setMessage("") }}
        style={{ marginTop: 8, color: "#555", fontSize: 12, cursor: "pointer" }}
      >
        {isForgot ? "Terug naar inloggen" : "Wachtwoord vergeten?"}
      </p>

    </div>
  );
}
