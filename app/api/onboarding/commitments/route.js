import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request) {
  const { goalTitle, goalType, likes } = await request.json()

  if (!goalTitle) {
    return Response.json({ error: "goalTitle is required" }, { status: 400 })
  }

  const likesStr = likes?.length > 0 ? likes.join(", ") : "algemeen sporten"

  const prompt = `Genereer precies 3 korte, concrete dagelijkse commitments voor iemand met dit doel: "${goalTitle}".
Doeltype: ${goalType || "gezonder leven"}.
Interesses: ${likesStr}.

Regels:
- Elke commitment is 1 actie die vandaag gedaan kan worden
- Maximaal 8 woorden per commitment
- Geen nummering of bullets, alleen de tekst
- Nederlands, actief geformuleerd
- Geef precies 3 commitments terug, elk op een nieuwe regel`

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    })
    const raw = response.content[0].text.trim()
    const commitments = raw
      .split("\n")
      .map(s => s.replace(/^[\d\.\-\*]+\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 3)
    return Response.json({ commitments })
  } catch (err) {
    console.error("[onboarding/commitments]", err.message)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
