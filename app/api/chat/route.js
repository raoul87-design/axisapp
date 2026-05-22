import Anthropic from "@anthropic-ai/sdk"
import { supabaseAdmin } from "../../../lib/supabase"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function getNLDate() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" })
}

async function resolveUser(token) {
  if (!token) return null
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return null
  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("id, auth_user_id, name, goal, goal_title, goal_deadline, streak, missed_days, kcal_doel, eiwitten_doel, koolhydraten_doel, vetten_doel, target_weight, training_location, fitness_level")
    .eq("auth_user_id", user.id)
    .single()
  return profile || null
}

async function fetchContext(profile) {
  const today   = getNLDate()
  const authUid = profile.auth_user_id
  const pubUid  = profile.id

  const DAYS_NL  = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"]
  const todayKey = DAYS_NL[new Date().getDay()]

  const [
    { data: commitments },
    { data: foodLogs },
    { data: weightMetrics },
    { data: kcalMetrics },
    { data: reflections },
    mealPlanResult,
  ] = await Promise.all([
    supabaseAdmin.from("commitments").select("id, text, done").eq("user_id", authUid).eq("date", today).order("created_at", { ascending: true }),
    supabaseAdmin.from("food_logs").select("kcal, eiwitten").eq("user_id", pubUid).eq("date", today).eq("done", true),
    supabaseAdmin.from("metrics").select("waarde").eq("user_id", authUid).in("type", ["gewicht", "weight"]).order("datum", { ascending: false }).limit(1),
    supabaseAdmin.from("metrics").select("waarde").eq("user_id", authUid).in("type", ["voeding", "calorie", "kcal"]).order("datum", { ascending: false }).limit(1),
    supabaseAdmin.from("reflections").select("completed, answer").eq("user_id", authUid).order("created_at", { ascending: false }).limit(3),
    supabaseAdmin.from("meal_plans").select("plan").eq("user_id", pubUid).lte("week_start", today).order("week_start", { ascending: false }).limit(1).maybeSingle(),
  ])

  const foodLogKcal  = (foodLogs || []).reduce((s, f) => s + (Number(f.kcal)     || 0), 0)
  const foodLogEiwit = (foodLogs || []).reduce((s, f) => s + (Number(f.eiwitten) || 0), 0)
  const kcal_gegeten = foodLogKcal > 0
    ? Math.round(foodLogKcal)
    : (kcalMetrics?.[0] ? Number(kcalMetrics[0].waarde) : 0)

  const gewicht_vandaag = weightMetrics?.[0] ? Number(weightMetrics[0].waarde) : null

  let dagen_te_gaan = null
  if (profile.goal_deadline) {
    const deadline = new Date(profile.goal_deadline)
    const nowLocal = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Amsterdam" }))
    dagen_te_gaan = Math.max(0, Math.ceil((deadline - nowLocal) / 86400000))
  }

  const plan      = mealPlanResult?.data
  const todayMenu = plan?.plan?.[todayKey] ?? null
  const weekmenu_vandaag = todayMenu ? {
    ontbijt: todayMenu.ontbijt?.[0]?.naam ?? null,
    lunch:   todayMenu.lunch?.[0]?.naam   ?? null,
    diner:   todayMenu.diner?.[0]?.naam   ?? null,
  } : null

  return {
    commitments:   commitments   || [],
    kcal_gegeten,
    eiwit_gegeten: Math.round(foodLogEiwit),
    gewicht_vandaag,
    reflections:   reflections   || [],
    weekmenu_vandaag,
    dagen_te_gaan,
  }
}

function buildSystemPrompt(profile, ctx) {
  const today     = getNLDate()
  const naam      = profile.name        || "gebruiker"
  const doel      = profile.goal_title  || profile.goal || "niet ingesteld"
  const streak    = profile.streak      ?? 0
  const missed    = profile.missed_days ?? 0

  const deadlineStr = ctx.dagen_te_gaan !== null
    ? `Deadline: ${profile.goal_deadline} — nog ${ctx.dagen_te_gaan} dagen.`
    : ""

  const commitmentLines = ctx.commitments.length > 0
    ? ctx.commitments.map(c => `- ${c.text} (${c.done ? "✅ gedaan" : "⬜ open"})`).join("\n")
    : "Geen commitments vandaag"

  const kcalLine = profile.kcal_doel
    ? `${ctx.kcal_gegeten}/${profile.kcal_doel} kcal`
    : `${ctx.kcal_gegeten} kcal`

  const eiwitLine = profile.eiwitten_doel
    ? `${ctx.eiwit_gegeten}/${profile.eiwitten_doel}g eiwit`
    : `${ctx.eiwit_gegeten}g eiwit`

  const gewichtLine = ctx.gewicht_vandaag
    ? `${ctx.gewicht_vandaag} kg (doel: ${profile.target_weight ? profile.target_weight + " kg" : "niet ingesteld"})`
    : "niet gelogd vandaag"

  const reflectiesStr = ctx.reflections.length > 0
    ? ctx.reflections.map(r => `- ${r.completed ? "✅" : "❌"} "${r.answer}"`).join("\n")
    : "Geen recente reflecties"

  const weekmenuStr = ctx.weekmenu_vandaag
    ? `Weekmenu: ontbijt ${ctx.weekmenu_vandaag.ontbijt || "—"} | lunch ${ctx.weekmenu_vandaag.lunch || "—"} | diner ${ctx.weekmenu_vandaag.diner || "—"}`
    : ""

  return `Je bent de persoonlijke discipline coach van ${naam}.
Doel: ${doel}. ${deadlineStr}
Streak: ${streak} ${streak === 1 ? "dag" : "dagen"} | Gemiste dagen: ${missed}.

VANDAAG (${today}):
${commitmentLines}
Voeding: ${kcalLine}, ${eiwitLine}.
Gewicht: ${gewichtLine}.
${weekmenuStr}

RECENTE AVOND CHECK-INS:
${reflectiesStr}

FILOSOFIE — James Smith & gedragswetenschap:
- Consistentie verslaat perfectie altijd
- Calorietekort is de enige weg naar gewichtsverlies (300-500 kcal/dag = duurzaam)
- Slaap > beweging > consistentie > herstel > voeding

TOON:
- Direct en eerlijk, geen sugarcoating
- Maximaal 3 zinnen per antwoord
- Menselijk, gebruik 'je' constructies
- Geen opsommingen, geen uitroeptekens als opener
- Als je een actie uitvoert: bevestig in één zin

GRENZEN:
- Geen medisch advies of blessurebehandeling
- Buiten fitness/voeding/discipline domein: vriendelijk doorverwijzen

ACTIES — gebruik tools als de gebruiker dit vraagt:
- Gewicht opslaan: "ik weeg X", "weeg X", "sla X kg op" → save_weight
- Commitment toevoegen: "commitment X", "vandaag doe ik X", "voeg X toe" → add_commitment
- Commitment als gedaan markeren: "gedaan", "klaar", "commitment afgerond" → mark_commitment_done
- Voeding loggen: "voeding X kcal", "ik heb X kcal gegeten", "log X kcal" → log_food`
}

const COACH_TOOLS = [
  {
    name: "save_weight",
    description: "Sla het gewicht van de gebruiker op in de database",
    input_schema: {
      type: "object",
      properties: {
        gewicht: { type: "number", description: "Gewicht in kg, bijv. 76.5" },
      },
      required: ["gewicht"],
    },
  },
  {
    name: "add_commitment",
    description: "Voeg een nieuwe commitment toe voor vandaag",
    input_schema: {
      type: "object",
      properties: {
        tekst: { type: "string", description: "De commitment tekst, max 8 woorden, geen dagaanduidingen zoals 'vandaag'" },
      },
      required: ["tekst"],
    },
  },
  {
    name: "mark_commitment_done",
    description: "Markeer een commitment als gedaan. Gebruik de meest recente open commitment als tekst leeg is.",
    input_schema: {
      type: "object",
      properties: {
        tekst: { type: "string", description: "Optioneel: zoekterm in commitment tekst — leeg = meest recente open commitment" },
      },
      required: [],
    },
  },
  {
    name: "log_food",
    description: "Log handmatige voeding voor vandaag (kcal en optioneel eiwitten)",
    input_schema: {
      type: "object",
      properties: {
        kcal:     { type: "number", description: "Aantal calorieën" },
        eiwitten: { type: "number", description: "Gram eiwitten (optioneel)" },
      },
      required: ["kcal"],
    },
  },
]

async function executeTool(name, input, profile) {
  const today   = getNLDate()
  const authUid = profile.auth_user_id
  const pubUid  = profile.id

  console.log(`[chat/tool] ${name}`, input)

  if (name === "save_weight") {
    const { error } = await supabaseAdmin.from("metrics").insert({
      user_id: authUid, type: "gewicht", waarde: String(input.gewicht), datum: today,
    })
    if (error) { console.error("[chat/tool] save_weight error:", error.message); return { success: false } }
    console.log("[chat/tool] save_weight ok:", input.gewicht)
    return { success: true, gewicht: input.gewicht }
  }

  if (name === "add_commitment") {
    const { error } = await supabaseAdmin.from("commitments").insert({
      user_id: authUid, text: input.tekst, date: today, done: false, category: "overig",
    })
    if (error) { console.error("[chat/tool] add_commitment error:", error.message); return { success: false } }
    console.log("[chat/tool] add_commitment ok:", input.tekst)
    return { success: true, tekst: input.tekst }
  }

  if (name === "mark_commitment_done") {
    const { data: commits } = await supabaseAdmin
      .from("commitments").select("id, text")
      .eq("user_id", authUid).eq("date", today).eq("done", false)
      .order("created_at", { ascending: false })

    let match = null
    if (input.tekst?.trim()) {
      match = (commits || []).find(c => c.text.toLowerCase().includes(input.tekst.toLowerCase()))
    }
    if (!match) match = (commits || [])[0]

    if (!match) {
      console.log("[chat/tool] mark_commitment_done: geen open commitment gevonden")
      return { success: false, message: "Geen open commitment gevonden" }
    }

    const { error } = await supabaseAdmin.from("commitments").update({ done: true }).eq("id", match.id)
    if (error) { console.error("[chat/tool] mark_done error:", error.message); return { success: false } }
    console.log("[chat/tool] mark_done ok:", match.text)
    return { success: true, tekst: match.text }
  }

  if (name === "log_food") {
    const { error } = await supabaseAdmin.from("food_logs").insert({
      user_id:      pubUid,
      date:         today,
      meal_type:    "overig",
      product_name: "Handmatige invoer (coach)",
      kcal:         input.kcal     || 0,
      eiwitten:     input.eiwitten || 0,
      koolhydraten: 0,
      vetten:       0,
      portie_gram:  100,
      source:       "COACH",
      done:         true,
    })
    if (error) { console.error("[chat/tool] log_food error:", error.message); return { success: false } }
    console.log("[chat/tool] log_food ok:", input.kcal, "kcal")
    return { success: true, kcal: input.kcal }
  }

  return { success: false, message: "Onbekende tool" }
}

const FALLBACK_SYSTEM = `Je bent de AXIS discipline coach. Gebaseerd op James Smith en gedragswetenschap.
- Consistentie verslaat perfectie altijd
- Reageer als een menselijke coach — kort, direct, motiverend
- Maximaal 3 zinnen per antwoord
- Gebruik 'je' constructies, geen formele taal`

export async function POST(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "").trim()
    const { messages } = await request.json()

    const profile = token ? await resolveUser(token) : null

    let systemPrompt = FALLBACK_SYSTEM
    let tools        = undefined

    if (profile) {
      const ctx  = await fetchContext(profile)
      systemPrompt = buildSystemPrompt(profile, ctx)
      tools        = COACH_TOOLS
      console.log("[chat] context loaded | user:", profile.name, "| streak:", profile.streak)
    } else {
      console.log("[chat] no profile — using fallback prompt")
    }

    const firstResponse = await anthropic.messages.create({
      model:      "claude-sonnet-4-6",
      max_tokens: 512,
      system:     systemPrompt,
      messages,
      ...(tools ? { tools } : {}),
    })

    const toolUseBlock = firstResponse.content.find(c => c.type === "tool_use")

    if (toolUseBlock && profile) {
      const result = await executeTool(toolUseBlock.name, toolUseBlock.input, profile)

      // Send tool result back to Claude for the final human response
      const followUpMessages = [
        ...messages,
        { role: "assistant", content: firstResponse.content },
        {
          role: "user",
          content: [{
            type:        "tool_result",
            tool_use_id: toolUseBlock.id,
            content:     JSON.stringify(result),
          }],
        },
      ]

      const followUp = await anthropic.messages.create({
        model:      "claude-sonnet-4-6",
        max_tokens: 256,
        system:     systemPrompt,
        messages:   followUpMessages,
      })

      const replyText = followUp.content.find(c => c.type === "text")?.text || "Gedaan! ✅"
      return Response.json({
        content: replyText,
        action:  { tool: toolUseBlock.name, result },
      })
    }

    const text = firstResponse.content.find(c => c.type === "text")?.text || ""
    return Response.json({ content: text })

  } catch (error) {
    console.error("[chat] error:", error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
