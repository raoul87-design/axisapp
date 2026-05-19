import { supabaseAdmin } from "../../../../lib/supabase"

export async function GET(request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user) {
    console.error("[dashboard/clients] token verify failed:", authErr?.message)
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, auth_user_id, whatsapp_number, name, streak, missed_days, awaiting_reflection, kcal_doel")
    .eq("coach_email", user.email)
    .order("id", { ascending: true })

  if (error) {
    console.error("[dashboard/clients] query failed:", error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }

  console.log("[dashboard/clients] coach:", user.email, "| clients:", data?.length ?? 0)
  return Response.json({ clients: data || [] })
}
