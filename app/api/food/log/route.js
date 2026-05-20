import { supabaseAdmin } from "../../../../lib/supabase"

export async function POST(request) {
  try {
    const { user_id, date, meal_type, product_name, kcal, eiwitten, koolhydraten, vetten, portie_gram, source } = await request.json()

    if (!user_id || !meal_type || !product_name) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("food_logs")
      .insert({
        user_id,
        date,
        meal_type,
        product_name,
        kcal:         kcal         || 0,
        eiwitten:     eiwitten     || 0,
        koolhydraten: koolhydraten || 0,
        vetten:       vetten       || 0,
        portie_gram:  portie_gram  || 100,
        source:       source       || "EIGEN",
        done:         false,
      })
      .select()
      .single()

    if (error) {
      console.error("[food/log] insert error:", error.message)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ log: data })
  } catch (err) {
    console.error("[food/log] error:", err.message)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
