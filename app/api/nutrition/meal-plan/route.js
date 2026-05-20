import { supabaseAdmin } from "../../../../lib/supabase"

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const userId    = searchParams.get("userId")
  const weekStart = searchParams.get("weekStart")

  if (!userId || !weekStart) {
    return Response.json({ plan: null })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("meal_plans")
      .select("*")
      .eq("user_id", userId)
      .eq("week_start", weekStart)
      .maybeSingle()

    if (error) {
      console.error("[meal-plan] select error:", error.message)
      return Response.json({ plan: null })
    }

    console.log("[meal-plan] userId:", userId, "| weekStart:", weekStart, "| gevonden:", !!data)
    return Response.json({ plan: data || null })
  } catch (err) {
    console.error("[meal-plan] error:", err.message)
    return Response.json({ plan: null })
  }
}
