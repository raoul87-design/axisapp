import Anthropic from "@anthropic-ai/sdk"
import { supabaseAdmin } from "../../../../lib/supabase"

export const maxDuration = 90

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const DAYS       = ["maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag", "zondag"]
const MEAL_TYPES = ["ontbijt", "lunch", "diner"]

const normalize = r => ({
  naam:           r.naam                            || "",
  kcal:           r.kcal                            || 0,
  eiwitten:       r.eiwitten      ?? r.eiwit        ?? 0,
  koolhydraten:   r.koolhydraten  ?? r.koolh        ?? 0,
  vetten:         r.vetten        ?? r.vet          ?? 0,
  bereidingstijd: r.bereidingstijd                  ?? 0,
  ingredienten:   r.ingredienten                    ?? [],
  beschrijving:   r.beschrijving                    ?? "",
})

async function generateIngredients(plan) {
  const lines = []
  for (const day of DAYS) {
    for (const meal of MEAL_TYPES) {
      const item = plan[day]?.[meal]?.[0]
      if (item?.naam) {
        lines.push(`${day}_${meal}: ${item.naam} (${item.kcal}kcal, ${item.eiwitten}g eiwit)`)
      }
    }
  }

  const prompt = `Generate 3-5 ingredients per meal in Dutch. Use categories: "Groente & Fruit", "Vlees & Vis", "Zuivel", "Granen", "Overig".
Add bereidingstijd (number of minutes) and beschrijving (1 short sentence in Dutch).
Respond with ONLY valid JSON, no markdown, no explanation:
{"maandag_ontbijt":{"bereidingstijd":number,"beschrijving":"string","ingredienten":[{"naam":"string","hoeveelheid":number,"eenheid":"string","categorie":"string"}]},...all 21 keys}

Meals:
${lines.join("\n")}`

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 5000,
    messages: [{ role: "user", content: prompt }],
  })

  const raw = message.content[0].text
  console.log("[generate-week] ingredients raw length:", raw.length)
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error("No JSON in ingredients response")
  return JSON.parse(match[0])
}

async function resolvePublicUserId(request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "").trim()
  if (!token) return { authUid: null, publicUid: null }

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user) {
    console.error("[generate-week] auth.getUser failed:", authErr?.message)
    return { authUid: null, publicUid: null }
  }

  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("auth_user_id", user.id)
    .single()

  if (profileErr || !profile) {
    console.error("[generate-week] users lookup failed for auth_uid:", user.id, profileErr?.message)
    return { authUid: user.id, publicUid: null }
  }

  console.log("[generate-week] auth_uid:", user.id, "| public_uid:", profile.id)
  return { authUid: user.id, publicUid: profile.id }
}

export async function POST(request) {
  try {
    const { weekStart, kcalDoel, eiwittenDoel, koolhydratenDoel, vettenDoel, prefs } = await request.json()

    const { publicUid } = await resolvePublicUserId(request)
    if (!publicUid) {
      return Response.json({ error: "Authenticatie mislukt — probeer opnieuw in te loggen." }, { status: 401 })
    }

    // Step 1: Generate 7-day plan (names + macros only)
    const planPrompt = `Generate the meal plan in Dutch. All meal names must be in Dutch (Netherlands).
Respond with ONLY valid JSON, no markdown, no backticks, no explanation. The JSON must be complete and valid.

7-day meal plan. Macros/day: ${kcalDoel}kcal, ${eiwittenDoel}g protein, ${koolhydratenDoel}g carbs, ${vettenDoel}g fat.
Goal: ${prefs?.doel || "maintain"}. Max prep: ${prefs?.tijd || "30"}min.${prefs?.likes ? ` Notes: ${prefs.likes}.` : ""}

3 meals per day (ontbijt/lunch/diner), each an array with 1 object: {"naam":"string","kcal":number,"eiwit":number,"koolh":number,"vet":number}

{"maandag":{"ontbijt":[...],"lunch":[...],"diner":[...]},"dinsdag":{...},"woensdag":{...},"donderdag":{...},"vrijdag":{...},"zaterdag":{...},"zondag":{...}}`

    const planMsg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{ role: "user", content: planPrompt }],
    })

    const planRaw = planMsg.content[0].text
    console.log("[generate-week] plan raw length:", planRaw.length)

    const planMatch = planRaw.match(/\{[\s\S]*\}/)
    if (!planMatch) throw new Error("No JSON in plan response")

    let plan
    try {
      plan = JSON.parse(planMatch[0])
    } catch (parseErr) {
      console.error("[generate-week] plan parse error:", parseErr.message, "\nraw:", planRaw)
      throw new Error(`Plan JSON parse failed: ${parseErr.message}`)
    }

    for (const day of DAYS) {
      if (!plan[day]) throw new Error(`Missing day: ${day}`)
      for (const meal of MEAL_TYPES) {
        plan[day][meal] = (plan[day][meal] || []).map(normalize)
      }
    }

    // Step 2: Generate ingredients + beschrijving for all 21 meals in one batch call
    let ingredients = {}
    try {
      ingredients = await generateIngredients(plan)
      console.log("[generate-week] ingredients generated for", Object.keys(ingredients).length, "meals")
    } catch (ingErr) {
      console.error("[generate-week] ingredients batch error (non-fatal):", ingErr.message)
    }

    // Merge ingredients into plan
    for (const day of DAYS) {
      for (const meal of MEAL_TYPES) {
        const key = `${day}_${meal}`
        const extra = ingredients[key]
        if (extra && plan[day][meal][0]) {
          if (extra.ingredienten?.length > 0) plan[day][meal][0].ingredienten = extra.ingredienten
          if (extra.beschrijving)             plan[day][meal][0].beschrijving  = extra.beschrijving
          if (extra.bereidingstijd > 0)       plan[day][meal][0].bereidingstijd = extra.bereidingstijd
        }
      }
    }

    console.log("[generate-week] insert | user_id:", publicUid, "| week_start:", weekStart)

    const { data, error } = await supabaseAdmin
      .from("meal_plans")
      .upsert({ user_id: publicUid, week_start: weekStart, plan }, { onConflict: "user_id,week_start" })
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
