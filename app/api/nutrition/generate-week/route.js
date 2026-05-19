import Anthropic from "@anthropic-ai/sdk"
import { supabaseAdmin } from "../../../../lib/supabase"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const DAYS = ["maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag", "zondag"]

export async function POST(request) {
  try {
    const { userId, weekStart, kcalDoel, eiwittenDoel, koolhydratenDoel, vettenDoel, prefs } = await request.json()

    const prompt = `Je bent een Nederlandse voedingsdeskundige. Maak een volledig weekmenu voor 7 dagen.

Doelen per dag:
- Calorieën: ${kcalDoel} kcal
- Eiwitten: ${eiwittenDoel}g
- Koolhydraten: ${koolhydratenDoel}g
- Vetten: ${vettenDoel}g

Voorkeuren: ${prefs?.doel || "gezond eten"}, ${prefs?.likes || "geen specifieke wensen"}, bereidingstijd: max ${prefs?.tijd || "30"} minuten.

Geef een JSON object terug met deze exacte structuur (geen uitleg, alleen JSON):
{
  "maandag": {
    "ontbijt": [{"naam": "string", "kcal": number, "eiwitten": number, "koolhydraten": number, "vetten": number, "bereidingstijd": number, "beschrijving": "string", "ingredienten": [{"naam": "string", "hoeveelheid": "string", "eenheid": "string", "categorie": "string"}]}],
    "lunch": [...],
    "diner": [...],
    "snacks": [{"naam": "string", "kcal": number, "eiwitten": number, "koolhydraten": number, "vetten": number, "bereidingstijd": 0, "beschrijving": "string", "ingredienten": [...]}]
  },
  "dinsdag": {...},
  "woensdag": {...},
  "donderdag": {...},
  "vrijdag": {...},
  "zaterdag": {...},
  "zondag": {...}
}

Categorieën voor ingrediënten: Groente, Fruit, Vlees, Vis, Zuivel, Granen, Noten & Zaden, Sauzen & Kruiden, Overig.
Zorg dat de macro's per dag dicht bij de doelen blijven. Gebruik Nederlandse gerechtnamen. Varieer dagelijks.`

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 8000,
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
