import { waitUntil } from "@vercel/functions"
import twilio from "twilio"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@supabase/supabase-js"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const supabase = createClient(
  "https://zdqrrprjkddlxszmtcmx.supabase.co",
  process.env.SUPABASE_SERVICE_KEY || "sb_publishable__cdXODEiCbsHvycy6uuB_g_SIIgI6YH"
)

// Voedings- en caloriekennis — toegevoegd aan alle system prompts
const NUTRITION_KNOWLEDGE = `

VOEDING & CALORIETEKORT:

De wetenschappelijke basis:
- Gewichtsverlies = meer calorieën verbranden dan je eet. Geen uitzonderingen.
- Een tekort van 300-500 kcal per dag = 0,3-0,5 kg verlies per week. Duurzaam tempo.
- Te groot tekort (>1000 kcal) = spierverlies, vermoeidheid, niet volhoudbaar
- Geen enkel dieet werkt anders dan via calorietekort — keto, intermittent fasting, low carb werken alleen als ze een tekort creëren
- Bewegen verhoogt verbranding maar voeding bepaalt 80% van het resultaat

Aanpak bij afvallen:
- Bereken onderhoudscalorieën (TDEE) als basis
- Stel een tekort in van 300-500 kcal
- Focus op eiwitten (1.6-2g per kg lichaamsgewicht) voor spierbehoud
- Consistentie over weken telt, niet perfectie op één dag
- Als iemand een plateau heeft: controleer of het tekort nog klopt

Wat je vrijuit bespreekt:
- Caloriebalans, kcal doelen, macro's ✅
- Voortgang op voedingsdoelen ✅
- Algemene tips gebaseerd op James Smith en sportwetenschap ✅
- Motiveren en bijsturen op basis van metrics ✅
- Calorietekort uitleggen en toepassen ✅

Verwijs WEL naar een professional bij:
- Medische voedingsvragen (ziektes, aandoeningen)
- Eetstoornissen of extreme restrictie
- Allergieën en intoleranties behandelen

Gebruik dit kader proactief als iemand wil afvallen of vragen heeft over voeding. Blijf binnen het domein van gezonde, actieve mensen die hun doelen willen bereiken.`

// Toon-toevoeging voor alle WhatsApp system prompts
const WA_TONE = `

Schrijf als een echte coach die een WhatsApp stuurt.
- Korte zinnen, geen opsommingen
- Soms een tegenvraag in plaats van een antwoord
- Af en toe een kleine imperfectie in de zin
- Geen perfect gestructureerde alinea's
- Maximaal 2-3 zinnen
- Gebruik 'je' constructies zoals een mens: 'Goed bezig' in plaats van 'Dat is goed gedaan'
- Nooit beginnen met 'Geweldig!' of 'Fantastisch!'`

const SYSTEM_PROMPTS = {
  brutal: `Je bent een harde discipline coach. Je bent direct, confronterend en zonder medelijden.
Je spreekt de waarheid, ook als het pijn doet. Spreek de gebruiker aan met jij/je.${WA_TONE}`,

  hard: `Je bent een strenge discipline coach. Je bent eerlijk en direct, maar respectvol.
Je houdt de gebruiker scherp. Spreek de gebruiker aan met jij/je.${WA_TONE}`,

  medium: `Je bent een begeleidende discipline coach. Je bent motiverend en direct.
Je helpt de gebruiker focussen. Spreek de gebruiker aan met jij/je.${WA_TONE}`,

  soft: `Je bent een warme discipline coach. Je bent bemoedigend en positief.
Je viert voortgang en houdt het momentum vast. Spreek de gebruiker aan met jij/je.${WA_TONE}`,
}

function getTone(streak, missedDays) {
  if (missedDays >= 4) return "brutal"
  if (missedDays >= 2) return "hard"
  if (streak >= 7) return "soft"
  if (streak >= 3) return "medium"
  return "medium"
}

function normalizeNumber(raw) {
  return raw.replace(/^(whatsapp:)0/, "$1+31")
}

function getNLDate() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" })
}

// ── Data helpers ──────────────────────────────────────────────

async function getUserData(whatsappNumber) {
  const { data, error } = await supabase
    .from("users")
    .select("id, auth_user_id, name, streak, missed_days, awaiting_reflection")
    .eq("whatsapp_number", whatsappNumber)
    .single()

  if (error) {
    console.log("Geen gebruiker gevonden voor:", whatsappNumber)
    return null
  }
  return data
}

async function saveWhatsappNumber(whatsappNumber) {
  const { error } = await supabase
    .from("users")
    .upsert({ whatsapp_number: whatsappNumber }, { onConflict: "whatsapp_number" })

  if (error) {
    console.error("Fout bij opslaan WhatsApp nummer:", error.message)
  } else {
    console.log("WhatsApp nummer opgeslagen:", whatsappNumber)
  }
}

// Haal de laatste 10 gespreksmomenten op (5 user + 5 assistant, gesorteerd oud→nieuw)
async function getConversationHistory(publicUserId) {
  if (!publicUserId) return []
  const { data, error } = await supabase
    .from("conversations")
    .select("role, content")
    .eq("user_id", publicUserId)
    .order("created_at", { ascending: false })
    .limit(10)

  if (error) {
    console.error("Conversation history ophalen mislukt:", error.message)
    return []
  }

  // Omkeren naar oud→nieuw en zorgen voor geldige alternerende volgorde
  const sorted = (data || []).reverse()
  const valid = []
  let lastRole = null
  for (const msg of sorted) {
    if (msg.role !== lastRole) {
      valid.push({ role: msg.role, content: msg.content })
      lastRole = msg.role
    }
  }
  // Anthropic vereist dat de array begint met 'user'
  while (valid.length > 0 && valid[0].role !== "user") valid.shift()
  return valid
}

// Sla één gespreksbericht op in de conversations tabel
async function saveConversation(publicUserId, role, content) {
  if (!publicUserId) return
  const { error } = await supabase
    .from("conversations")
    .insert({ user_id: publicUserId, role, content })
  if (error) console.error("Conversation opslaan mislukt:", error.message)
  else console.log("Conversation opgeslagen | role:", role)
}

// Haal client-specifieke context op: commitments, gewicht, kcal
async function getClientContext(userData) {
  const userId = userData?.auth_user_id
  if (!userId) return { recentCommits: [], latestWeight: null, latestKcal: null }

  const [
    { data: recentCommits },
    { data: weightData },
    { data: kcalData },
  ] = await Promise.all([
    supabase.from("commitments")
      .select("text, date, done")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(3),
    supabase.from("metrics")
      .select("waarde, datum")
      .eq("user_id", userId)
      .in("type", ["gewicht", "weight"])
      .order("datum", { ascending: false })
      .limit(1),
    supabase.from("metrics")
      .select("waarde, datum")
      .eq("user_id", userId)
      .in("type", ["voeding", "calorie", "kcal"])
      .order("datum", { ascending: false })
      .limit(1),
  ])

  return {
    recentCommits: recentCommits || [],
    latestWeight:  weightData?.[0] ?? null,
    latestKcal:    kcalData?.[0]   ?? null,
  }
}

// Bouw een rijke system prompt met clientcontext en geheugeninstructies
function buildSystemPrompt(tone, userData, clientContext) {
  const name       = userData?.name || null
  const streak     = userData?.streak     ?? 0
  const missedDays = userData?.missed_days ?? 0

  const commitLines = clientContext.recentCommits.length > 0
    ? clientContext.recentCommits
        .map(c => `- ${c.date}: "${c.text}" (${c.done ? "afgerond" : "niet afgerond"})`)
        .join("\n")
    : "Geen recente commitments beschikbaar"

  const weightLine = clientContext.latestWeight
    ? `${clientContext.latestWeight.waarde} (${clientContext.latestWeight.datum})`
    : "Onbekend"

  const kcalLine = clientContext.latestKcal
    ? `${clientContext.latestKcal.waarde} (${clientContext.latestKcal.datum})`
    : "Onbekend"

  const contextBlock = `

CLIENTCONTEXT:
${name ? `Naam: ${name}` : ""}
Streak: ${streak} ${streak === 1 ? "dag" : "dagen"}
Gemiste dagen: ${missedDays}
Recente commitments:
${commitLines}
Laatste gewicht: ${weightLine}
Laatste kcal/voeding: ${kcalLine}

Je hebt toegang tot de gespreksgeschiedenis van deze client. Gebruik dit om:
- Te onthouden wat de client eerder heeft gezegd
- Patronen te herkennen (altijd moe op maandag, struggelt met voeding in het weekend)
- Persoonlijker te reageren op basis van naam en situatie
- Niet dezelfde vragen twee keer te stellen`

  return `${SYSTEM_PROMPTS[tone]}${NUTRITION_KNOWLEDGE}${contextBlock}`
}

// ── WhatsApp verzenden ────────────────────────────────────────

async function sendWhatsApp(to, body) {
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  const message = await client.messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
    to,
    body,
  })
  console.log("Twilio SID:", message.sid, "| Status:", message.status)
}

// ── Bericht parseren ──────────────────────────────────────────

async function parseCheckin(body) {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Analyseer dit WhatsApp bericht van een fitness/discipline app gebruiker.
Splits het op in losse onderdelen en classificeer elk onderdeel.

Geef terug als JSON array. Elk object heeft:
- "categorie": "COMMITMENT" | "METRIC" | "VRAAG" | "REFLECTIE" | "OVERIG"
- Voor METRIC ook: "metric_type" (kies uit: gewicht/kcal/eiwitten/koolhydraten/vetten/bloeddruk/hartslag/slaap/anders) en "waarde" (de waarde als string, bijv. "76kg" of "2000 kcal")
- Voor alle andere categorieën ook: "tekst" (de originele tekst van dit onderdeel)

Regels — lees deze zorgvuldig:

COMMITMENT = alles wat met beweging of een actie/plan te maken heeft:
- Alle vormen van sport en beweging: hardlopen, fietsen, zwemmen, wandelen, sporten, gym, krachttraining, yoga, padellen, voetbal, stretchen, dansen, klimmen, roeien, skiën, etc.
- Ook als er een getal bij staat: "10.000 stappen", "5km hardlopen", "1 uur fietsen", "45 min yoga"
- Stappen met een doelgetal = COMMITMENT (geen METRIC!)
- Andere acties/plannen voor vandaag: mediteren, lezen, koud douchen, vroeg opstaan, etc.

METRIC = uitsluitend metingen van je lichaam of inname (geen beweging!):
- Gewicht in kg: "76kg", "75.5 kg"
- Calorie-inname: "2000 kcal", "1800 cal"
- Macros: eiwitten (g), koolhydraten (g), vetten (g)
- Biometrie: bloeddruk, hartslag
- Slaap: aantal uren geslapen (niet plan om te slapen)

VRAAG = bevat een vraagteken of is duidelijk een vraag

REFLECTIE = alleen een kaal "ja" of "nee" (of "yes"/"no") als antwoord op een check-out vraag

OVERIG = alles wat niet in bovenstaande categorieën past

Voorbeelden:
- "76kg" → [{"categorie":"METRIC","metric_type":"gewicht","waarde":"76kg"}]
- "10.000 stappen" → [{"categorie":"COMMITMENT","tekst":"10.000 stappen"}]
- "5km hardlopen, 2000 kcal" → [{"categorie":"COMMITMENT","tekst":"5km hardlopen"},{"categorie":"METRIC","metric_type":"kcal","waarde":"2000 kcal"}]
- "1 uur fietsen, gewicht 78kg, 150g eiwit" → [{"categorie":"COMMITMENT","tekst":"1 uur fietsen"},{"categorie":"METRIC","metric_type":"gewicht","waarde":"78kg"},{"categorie":"METRIC","metric_type":"eiwitten","waarde":"150g"}]
- "Hoeveel water?" → [{"categorie":"VRAAG","tekst":"Hoeveel water?"}]
- "ja" → [{"categorie":"REFLECTIE","tekst":"ja"}]

Bericht: "${body.replace(/"/g, "'")}"

Antwoord ALLEEN met de JSON array, geen andere tekst.`,
      },
    ],
  })

  const raw = response.content[0].text.trim()
  console.log("Claude parseCheckin raw:", raw)

  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Hardcoded override: alles met "stappen" = altijd COMMITMENT
      return parsed.map(item => {
        const isMetric = item.categorie === "METRIC"
        const type     = (item.metric_type || "").toLowerCase()
        const waarde   = (item.waarde || "").toLowerCase()
        const tekst    = (item.tekst   || "").toLowerCase()
        const hasStap  = type.includes("stap") || waarde.includes("stap") || tekst.includes("stap")
        if (isMetric && hasStap) {
          const display = item.waarde || item.tekst || ""
          console.log(`[OVERRIDE] "${display}" — METRIC(${item.metric_type}) → COMMITMENT`)
          return { categorie: "COMMITMENT", tekst: display }
        }
        return item
      })
    }
  } catch (e) {
    console.error("JSON parse fout:", e.message, "| raw:", raw)
  }

  return [{ categorie: "OVERIG", tekst: body }]
}

// Bouw het overzichtsbericht op basis van opgeslagen items
function buildConfirmation(savedItems) {
  const METRIC_ICONS  = { gewicht: "⚖️", kcal: "🍽️", voeding: "🍽️", eiwitten: "🥩", koolhydraten: "🍞", vetten: "🫒", bloeddruk: "🩺", hartslag: "❤️", slaap: "😴", anders: "📊" }
  const METRIC_LABELS = { gewicht: "Gewicht", kcal: "Kcal", voeding: "Kcal", eiwitten: "Eiwitten", koolhydraten: "Koolhydraten", vetten: "Vetten", bloeddruk: "Bloeddruk", hartslag: "Hartslag", slaap: "Slaap", anders: "Meting" }

  const lines = savedItems
    .map((item) => {
      if (item.categorie === "METRIC") {
        const type = item.metric_type || "anders"
        return `${METRIC_ICONS[type] || "📊"} ${METRIC_LABELS[type] || type}: ${item.waarde}`
      }
      if (item.categorie === "COMMITMENT") return `💪 ${item.tekst}`
      return null
    })
    .filter(Boolean)

  if (lines.length === 0) return null
  return `✅ Check-in ontvangen:\n${lines.join("\n")}\n\nGo! 🔥`
}

// ── Handlers ──────────────────────────────────────────────────

async function handleReflection(from, body, userData) {
  console.log("=== [3] REFLECTIE VERWERKEN ===")
  const { streak, missed_days: missedDays, auth_user_id: authUserId, id } = userData
  const normalized = body.trim().toLowerCase()
  const completed  = normalized === "ja" || normalized === "yes"

  if (authUserId) {
    await supabase.from("reflections").insert({ user_id: authUserId, completed, answer: body })
    console.log("Reflectie opgeslagen:", completed)
  }

  const newStreak     = completed ? streak + 1 : 0
  const newMissedDays = completed ? 0 : missedDays + 1
  await supabase
    .from("users")
    .update({ streak: newStreak, missed_days: newMissedDays, awaiting_reflection: false })
    .eq("id", id)

  console.log("Streak bijgewerkt:", newStreak, "| MissedDays:", newMissedDays)

  const reply = completed
    ? `Geweldig! 🔥 Streak staat nu op ${newStreak} ${newStreak === 1 ? "dag" : "dagen"}. Morgen weer!`
    : `Oké, eerlijk is eerlijk. Morgen is een nieuwe kans — wat ga jij anders doen?`

  await sendWhatsApp(from, reply)
  console.log("Reflectie reply verstuurd")
}

async function handleVraag(from, body, userData, history, clientContext) {
  console.log("=== [3] VRAAG BEANTWOORDEN ===")
  const tone       = getTone(userData?.streak ?? 0, userData?.missed_days ?? 0)
  const systemPrompt = buildSystemPrompt(tone, userData, clientContext)
  const messages   = [...history, { role: "user", content: body }]

  const aiResponse = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 512,
    system: systemPrompt,
    messages,
  })
  const reply = aiResponse.content[0].text

  // Geheugen opslaan
  await Promise.all([
    saveConversation(userData?.id, "user", body),
    saveConversation(userData?.id, "assistant", reply),
  ])

  await sendWhatsApp(from, reply)
}

async function handleOverig(from) {
  console.log("=== [3] OVERIG — VRIENDELIJK ANTWOORD ===")
  await sendWhatsApp(
    from,
    `Hmm, ik weet niet goed wat ik daarmee moet. Stuur me een commitment voor vandaag, een meting, of stel een vraag!`
  )
}

// ── Hoofdflow ─────────────────────────────────────────────────

async function handleMessage(from, body) {
  try {
    console.log("=== [2] GEBRUIKER OPHALEN / OPSLAAN ===")
    await saveWhatsappNumber(from)

    const userData = await getUserData(from)
    const streak          = userData?.streak          ?? 0
    const missedDays      = userData?.missed_days     ?? 0
    const tone            = getTone(streak, missedDays)
    const awaitingReflection = userData?.awaiting_reflection ?? false

    console.log("Streak:", streak, "| MissedDays:", missedDays, "| Toon:", tone)
    console.log("Awaiting reflection:", awaitingReflection)

    // Menselijke vertraging: 30-90 seconden (vereist Vercel Pro timeout > 90s)
    const delaySec = Math.floor(Math.random() * 61) + 30
    console.log(`=== [DELAY] ${delaySec}s ===`)
    await new Promise(r => setTimeout(r, delaySec * 1000))

    // Reflectie heeft prioriteit — geen AI, geen geheugen nodig
    if (awaitingReflection) {
      await handleReflection(from, body, userData)
      return
    }

    // Parse het bericht (override zit al in parseCheckin)
    console.log("=== [3] BERICHT PARSEN ===")
    console.log("Ruwe berichttekst voor classificatie:", body)
    const items = await parseCheckin(body)
    console.log("Items na classificatie + override:", JSON.stringify(items))

    const metrics     = items.filter((i) => i.categorie === "METRIC")
    const commitments = items.filter((i) => i.categorie === "COMMITMENT")
    const vragen      = items.filter((i) => i.categorie === "VRAAG")

    console.log(`Metrics: ${metrics.length} | Commitments: ${commitments.length} | Vragen: ${vragen.length}`)

    // Enkelvoudige speciale gevallen
    if (items.length === 1) {
      if (vragen.length === 1) {
        // Laad geheugen + context parallel
        const [history, clientContext] = await Promise.all([
          getConversationHistory(userData?.id),
          getClientContext(userData),
        ])
        await handleVraag(from, body, userData, history, clientContext)
        return
      }
      if (items[0].categorie === "REFLECTIE" || items[0].categorie === "OVERIG") {
        await handleOverig(from)
        return
      }
      // Enkel commitment → AI coach reply met geheugen
      if (commitments.length === 1 && metrics.length === 0) {
        console.log("=== [4] ENKEL COMMITMENT — AI COACH REPLY MET GEHEUGEN ===")
        const userId = userData?.auth_user_id
        const today  = getNLDate()

        console.log("auth_user_id:", userId)
        console.log("Saving commitment:", commitments[0].tekst, "| date:", today)

        if (!userId) {
          console.error("Geen auth_user_id — commitment niet opgeslagen")
          await sendWhatsApp(from, "Koppel eerst je account via de app om je commitments bij te houden.")
          return
        }

        const [insertResult, history, clientContext] = await Promise.all([
          supabase.from("commitments").insert({ user_id: userId, text: commitments[0].tekst, date: today, done: false }),
          getConversationHistory(userData?.id),
          getClientContext(userData),
        ])

        if (insertResult.error) {
          console.error("Commitment INSERT error:", insertResult.error.message, "| code:", insertResult.error.code, "| details:", insertResult.error.details)
        } else {
          console.log("Commitment saved OK | user_id:", userId, "| text:", commitments[0].tekst)
        }

        const systemPrompt = buildSystemPrompt(tone, userData, clientContext)
        const messages     = [...history, { role: "user", content: body }]

        const aiResponse = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 256,
          system: systemPrompt,
          messages,
        })
        const reply = aiResponse.content[0].text

        await Promise.all([
          saveConversation(userData?.id, "user", body),
          saveConversation(userData?.id, "assistant", reply),
        ])

        await sendWhatsApp(from, reply)
        return
      }
    }

    // Multi-part of bevat metrics → alles opslaan + bevestiging (geen AI)
    console.log("=== [4] MULTI-PART CHECK-IN VERWERKEN ===")
    const userId = userData?.auth_user_id
    const today  = getNLDate()

    if (!userId) {
      console.error("Geen auth_user_id beschikbaar — data kan niet opgeslagen worden voor app-zichtbaarheid")
      await sendWhatsApp(from, "Koppel eerst je account via de app om je check-ins bij te houden.")
      return
    }
    const savedItems = []

    for (const item of metrics) {
      const { error } = await supabase.from("metrics").insert({
        user_id: userId,
        type:    item.metric_type || "anders",
        waarde:  item.waarde,
        datum:   today,
      })
      if (error) console.error("Metric opslaan mislukt:", error.message)
      else { console.log("Metric opgeslagen | type:", item.metric_type, "| waarde:", item.waarde); savedItems.push(item) }
    }

    for (const item of commitments) {
      console.log("Saving commitment (multi-part):", item.tekst, "| user_id:", userId)
      const { error } = await supabase.from("commitments").insert({
        user_id: userId,
        text:    item.tekst,
        date:    today,
        done:    false,
      })
      if (error) console.error("Commitment INSERT error:", error.message, "| code:", error.code, "| details:", error.details)
      else { console.log("Commitment saved OK:", item.tekst); savedItems.push(item) }
    }

    const confirmation = buildConfirmation(savedItems)
    if (confirmation) await sendWhatsApp(from, confirmation)
    else await handleOverig(from)

  } catch (error) {
    console.error("=== [ERROR] ===")
    console.error("Naam:", error.name)
    console.error("Bericht:", error.message)
    console.error("Status:", error.status)
    console.error("Volledige error:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
  }
}

export async function POST(request) {
  const formData = await request.formData()

  const from = normalizeNumber(formData.get("From"))
  const body = formData.get("Body")

  console.log("=== [1] BERICHT ONTVANGEN ===")
  console.log("Van:", from)
  console.log("Tekst:", body)

  waitUntil(handleMessage(from, body))

  return new Response(null, { status: 200 })
}
