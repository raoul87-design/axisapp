import { supabaseAdmin as supabase } from "../../../../lib/supabase"

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return Response.json({ error: "code vereist" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("invite_links")
    .select("coach_email, gebruikt, client_email, pre_data")
    .eq("code", code)
    .single()

  if (error || !data) {
    console.error("[invite/validate] niet gevonden:", code, error?.message)
    return Response.json({ error: "invalid" }, { status: 404 })
  }

  return Response.json(data)
}
