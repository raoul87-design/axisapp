import Anthropic from "@anthropic-ai/sdk"
import { supabaseAdmin } from "../../../../lib/supabase"

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const DAYS = ["maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag", "zondag"]

// Normalize short field names (eiwit/koolh/vet) → full names (eiwitten/koolhydraten/vetten)
const normalize = r => ({
  naam:          r.naam                              || "",
  kcal:          r.kcal                              || 0,
  eiwitten:      r.eiwitten      ?? r.eiwit          ?? 0,
  koolhydraten:  r.koolhydraten  ?? r.koolh          ?? 0,
  vetten:        r.vetten        ?? r.vet            ?? 0,
  bereidingstijd: r.bereidingstijd                   ?? 0,
  ingredienten:  r.ingredienten                      ?? [],
})

export async function POST(request) {
  try {
    const { userId, weekStart, kcalDoel, eiwittenDoel, koolhydratenDoel, vettenDoel, prefs } = await request.json()

    const prompt = `Generate the meal plan in Dutch. All meal names must be in Dutch (Netherlands).
Respond with ONLY valid JSON, no markdown, no backticks, no explanation. The JSON must be complete and valid.

7-day meal plan. Macros/day: ${kcalDoel}kcal, ${eiwittenDoel}g protein, ${koolhydratenDoel}g carbs, ${vettenDoel}g fat.
Goal: ${prefs?.doel || "maintain"}. Max prep: ${prefs?.tijd || "30"}min.${prefs?.likes ? ` Notes: ${prefs.likes}.` : ""}

3 meals per day (ontbijt/lunch/diner), each an array with 1 object: {"naam":"string","kcal":number,"eiwit":number,"koolh":number,"vet":number}

{"maandag":{"ontbijt":[...],"lunch":[...],"diner":[...]},"dinsdag":{...},"woensdag":{...},"donderdag":{...},"vrijdag":{...},"zaterdag":{...},"zondag":{...}}`

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    })

    const raw = message.content[0].text
    console.log("[generate-week] raw AI output length:", raw.length)

    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON in response")

    let plan
    try {
      plan = JSON.parse(jsonMatch[0])
    } catch (parseErr) {
      console.error("[generate-week] JSON parse error:", parseErr.message)
      console.error("[generate-week] raw output:", raw)
      throw new Error(`JSON parse failed: ${parseErr.message}`)
    }

    for (const day of DAYS) {
      if (!plan[day]) throw new Error(`Missing day: ${day}`)
      for (const meal of ["ontbijt", "lunch", "diner"]) {
        plan[day][meal] = (plan[day][meal] || []).map(normalize)
      }
    }

    console.log("[generate-week] insert | user_id:", userId, "| week_start:", weekStart)

    const { data, error } = await supabaseAdmin
      .from("meal_plans")
      .upsert({ user_id: userId, week_start: weekStart, plan }, { onConflict: "user_id,week_start" })
      .select()
      .single()

    console.log("[generate-week] insert result | data:", data ? "ok (id=" + data.id + ")" : "null", "| error:", error?.message ?? "geen")

    if (error) {
      console.error("[generate-week] insert failed:", JSON.stringify(error))
      return Response.json({ error: "Weekmenu kon niet worden opgeslagen: " + error.message }, { status: 500 })
    }

    return Response.json({ plan: data })
  } catch (err) {
    console.error("[generate-week] error:", err.message)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
