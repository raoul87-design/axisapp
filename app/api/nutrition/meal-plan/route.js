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

    console.log("[meal-plan] user_id:", userId, "| week_start:", weekStart, "| rijen gevonden:", data ? 1 : 0)
    if (!data) {
      // Debug: check what user_ids exist in meal_plans to catch ID mismatch
      const { data: all } = await supabaseAdmin.from("meal_plans").select("user_id, week_start").limit(10)
      console.log("[meal-plan] bestaande rijen in meal_plans:", JSON.stringify(all))
    }
    return Response.json({ plan: data || null })
  } catch (err) {
    console.error("[meal-plan] error:", err.message)
    return Response.json({ plan: null })
  }
}
