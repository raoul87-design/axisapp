import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request) {
  try {
    const { messages, streak, missedDays, commitment } = await request.json()

    const contextLines = [
      `Streak: ${streak} ${streak === 1 ? "dag" : "dagen"}.`,
      missedDays > 0 ? `Gemiste dagen: ${missedDays}.` : null,
      commitment ? `Commitment van vandaag: "${commitment}".` : null,
    ].filter(Boolean).join(" ")

    const system = `Je bent AXIS, een persoonlijke discipline coach.
Je praat één-op-één met de gebruiker. ${contextLines}
Wees direct, concreet en motiverend. Maximaal 3 zinnen. Spreek de gebruiker aan met jij/je. Geen bullet points.`

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      system,
      messages,
    })

    return Response.json({ content: response.content[0].text })
  } catch (error) {
    console.error("Chat error:", error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
