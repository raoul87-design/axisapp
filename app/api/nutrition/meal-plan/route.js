import { supabaseAdmin } from "../../../../lib/supabase"

async function resolvePublicUserId(request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "").trim()
  if (!token) return { authUid: null, publicUid: null }

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user) {
    console.error("[meal-plan] auth.getUser failed:", authErr?.message)
    return { authUid: null, publicUid: null }
  }

  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("auth_user_id", user.id)
    .single()

  if (profileErr || !profile) {
    console.error("[meal-plan] users lookup failed for auth_uid:", user.id, profileErr?.message)
    return { authUid: user.id, publicUid: null }
  }

  console.log("[meal-plan] auth_uid:", user.id, "| public_uid:", profile.id)
  return { authUid: user.id, publicUid: profile.id }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const weekStart = searchParams.get("weekStart")

  if (!weekStart) return Response.json({ plan: null })

  const { publicUid } = await resolvePublicUserId(request)
  if (!publicUid) {
    console.error("[meal-plan] could not resolve public user ID")
    return Response.json({ plan: null })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("meal_plans")
      .select("*")
      .eq("user_id", publicUid)
      .eq("week_start", weekStart)
      .maybeSingle()

    if (error) {
      console.error("[meal-plan] select error:", error.message)
      return Response.json({ plan: null })
    }

    console.log("[meal-plan] week_start:", weekStart, "| rijen gevonden:", data ? 1 : 0)
    return Response.json({ plan: data || null })
  } catch (err) {
    console.error("[meal-plan] error:", err.message)
    return Response.json({ plan: null })
  }
}
