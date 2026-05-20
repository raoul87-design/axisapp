import Anthropic from "@anthropic-ai/sdk"

export const maxDuration = 30

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request) {
  try {
    const { naam, mealLabel, kcal, eiwitten, koolhydraten, vetten } = await request.json()

    const prompt = `Recept voor "${naam}" (${mealLabel}). Macros: ~${kcal}kcal, ~${eiwitten}g eiwit, ~${koolhydraten}g koolh, ~${vetten}g vet.
Antwoord ALLEEN met dit JSON object:
{"bereidingstijd":number,"beschrijving":"string","ingredienten":[{"naam":"string","hoeveelheid":"string","eenheid":"string"}]}`

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    })

    const raw = message.content[0].text
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON in response")
    const recipe = JSON.parse(jsonMatch[0])

    return Response.json({ recipe })
  } catch (err) {
    console.error("[generate-recipe] error:", err.message)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
