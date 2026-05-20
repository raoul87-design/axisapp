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

    const prompt = `7-daags weekmenu JSON. Alleen JSON, geen tekst.
Macros/dag: ${kcalDoel}kcal, ${eiwittenDoel}g eiwit, ${koolhydratenDoel}g koolh, ${vettenDoel}g vet.
Doel: ${prefs?.doel || "onderhouden"}. Max: ${prefs?.tijd || "30"}min.${prefs?.likes ? ` Extra: ${prefs.likes}.` : ""}

Per dag: ontbijt/lunch/diner/snacks, elk array met 1 object {"naam":"string","kcal":number,"eiwit":number,"koolh":number,"vet":number}

{"maandag":{"ontbijt":[...],"lunch":[...],"diner":[...],"snacks":[...]},"dinsdag":{...},"woensdag":{...},"donderdag":{...},"vrijdag":{...},"zaterdag":{...},"zondag":{...}}`

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    })

    const raw = message.content[0].text
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON in response")
    const plan = JSON.parse(jsonMatch[0])

    for (const day of DAYS) {
      if (!plan[day]) throw new Error(`Missing day: ${day}`)
      for (const meal of ["ontbijt", "lunch", "diner", "snacks"]) {
        plan[day][meal] = (plan[day][meal] || []).map(normalize)
      }
    }

    const { data, error } = await supabaseAdmin
      .from("meal_plans")
      .upsert({ user_id: userId, week_start: weekStart, plan }, { onConflict: "user_id,week_start" })
      .select()
      .single()

    if (error) {
      console.error("[generate-week] upsert error:", error.message)
      return Response.json({ plan: { user_id: userId, week_start: weekStart, plan } })
    }

    return Response.json({ plan: data })
  } catch (err) {
    console.error("[generate-week] error:", err.message)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
