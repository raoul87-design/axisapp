import { supabaseAdmin } from "../../../../lib/supabase"

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  const date   = searchParams.get("date")

  if (!userId || !date) return Response.json({ logs: [] })

  const { data, error } = await supabaseAdmin
    .from("food_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("[food/log] GET error:", error.message)
    return Response.json({ logs: [], error: error.message })
  }

  return Response.json({ logs: data || [] })
}

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
      console.error("[food/log] POST error:", error.message)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ log: data })
  } catch (err) {
    console.error("[food/log] POST error:", err.message)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const { id, done } = await request.json()

    const { data, error } = await supabaseAdmin
      .from("food_logs")
      .update({ done })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[food/log] PATCH error:", error.message)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ log: data })
  } catch (err) {
    console.error("[food/log] PATCH error:", err.message)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) return Response.json({ error: "Missing id" }, { status: 400 })

    const { error } = await supabaseAdmin
      .from("food_logs")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("[food/log] DELETE error:", error.message)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ ok: true })
  } catch (err) {
    console.error("[food/log] DELETE error:", err.message)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
