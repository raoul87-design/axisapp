"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Login() {

  const [email, setEmail] = useState("");

  async function signIn() {

    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) {
      alert("Fout: " + error.message)
    } else {
      alert("Check your email for the login link");
    }

  }

  return (
    <div
      style={{
        backgroundColor: "#0f0f0f",
        color: "white",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >

      <h1 style={{ fontSize: 40 }}>AXIS</h1>

      <input
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          padding: "12px 16px",
          marginTop: 20,
          borderRadius: 8,
          border: "1px solid #333",
          background: "#1a1a1a",
          color: "white",
          width: 260,
        }}
      />

      <button
        onClick={signIn}
        style={{
          marginTop: 16,
          padding: "12px 20px",
          borderRadius: 8,
          border: "none",
          background: "#22c55e",
          color: "black",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        Login
      </button>

    </div>
  );
}