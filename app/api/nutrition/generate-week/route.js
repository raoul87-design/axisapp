import Anthropic from "@anthropic-ai/sdk"
import { supabaseAdmin } from "../../../../lib/supabase"

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const DAYS = ["maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag", "zondag"]

export async function POST(request) {
  try {
    const { userId, weekStart, kcalDoel, eiwittenDoel, koolhydratenDoel, vettenDoel, prefs } = await request.json()

    const prompt = `Maak een 7-daags weekmenu in JSON. Alleen JSON, geen uitleg.

Macro doelen/dag: ${kcalDoel}kcal, ${eiwittenDoel}g eiwit, ${koolhydratenDoel}g koolh, ${vettenDoel}g vet.
Doel: ${prefs?.doel || "onderhouden"}. Tijd: max ${prefs?.tijd || "30"}min. ${prefs?.likes ? `Extra: ${prefs.likes}.` : ""}

Schema per dag (4 velden: ontbijt/lunch/diner/snacks, elk een array met 1 recept):
{"naam":"string","kcal":number,"eiwitten":number,"koolhydraten":number,"vetten":number,"bereidingstijd":number,"ingredienten":[{"naam":"string","hoeveelheid":"string","eenheid":"string","categorie":"string"}]}

Categorieën: Groente, Fruit, Vlees, Vis, Zuivel, Granen, Noten & Zaden, Sauzen & Kruiden, Overig.

Geef exact dit JSON object:
{"maandag":{"ontbijt":[...],"lunch":[...],"diner":[...],"snacks":[...]},"dinsdag":{...},"woensdag":{...},"donderdag":{...},"vrijdag":{...},"zaterdag":{...},"zondag":{...}}`

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 6000,
      messages: [{ role: "user", content: prompt }],
    })

    const raw = message.content[0].text
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON in response")
    const plan = JSON.parse(jsonMatch[0])

    // Validate all 7 days present
    for (const day of DAYS) {
      if (!plan[day]) throw new Error(`Missing day: ${day}`)
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
