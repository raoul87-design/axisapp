import { supabaseAdmin } from "../../../../lib/supabase"

export async function POST(request) {
  const { coach_email, client_email, pre_data } = await request.json()

  if (!coach_email) {
    return Response.json({ error: "coach_email vereist" }, { status: 400 })
  }

  const code = Array.from(crypto.getRandomValues(new Uint8Array(6)))
    .map(b => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36])
    .join("")

  const { error } = await supabaseAdmin.from("invite_links").insert({
    coach_email,
    code,
    gebruikt:     false,
    client_email: client_email || null,
    pre_data:     pre_data     || null,
  })

  if (error) {
    console.error("[invite/create] insert failed:", error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ code })
}
