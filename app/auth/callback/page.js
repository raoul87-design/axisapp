"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../../lib/supabase"

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code")

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(() => {
        router.replace("/")
      })
    } else {
      router.replace("/")
    }
  }, [])

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0f0f0f",
      color: "#fff",
      fontFamily: "sans-serif"
    }}>
      Inloggen...
    </div>
  )
}
