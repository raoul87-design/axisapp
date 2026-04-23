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

function classifyCommitmentCategory(text) {
  const t = (text || "").toLowerCase()
  if (/sport|loop|lopen|fiets|gym|zwem|wandel|yoga|train|hardloop|stap|krachttraining|padel|voetbal|basket|tennis|dans|rennen|beweging|fitness/.test(t)) return "beweging"
  if (/eet|kcal|calorie|voeding|kook|groente|proteïne|eiwit|water|drinken|maaltijd|ontbijt|lunch|dieet|macro/.test(t)) return "voeding"
  return "overig"
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
    .select("id, auth_user_id, name, streak, missed_days, awaiting_reflection, training_location, fitness_level, kcal_doel, eiwitten_doel, koolhydraten_doel, vetten_doel")
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

const DAILY_QUESTION_LIMIT = 5

// Tel het aantal vragen (user-rol) dat vandaag al beantwoord is voor deze user
async function getDailyQuestionCount(publicUserId) {
  if (!publicUserId) return 0
  const today = getNLDate()
  const { count, error } = await supabase
    .from("conversations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", publicUserId)
    .eq("role", "user")
    .gte("created_at", `${today}T00:00:00+02:00`)
  if (error) {
    console.error("Dagelijks vraag-count ophalen mislukt:", error.message)
    return 0 // fail open — geen onterechte blokkering
  }
  return count ?? 0
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

  const today = getNLDate()

  const [
    { data: recentCommits },
    { data: weightData },
    { data: kcalData },
  ] = await Promise.all([
    supabase.from("commitments")
      .select("text, date, done")
      .eq("user_id", userId)
      .eq("date", today),
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

  const today = getNLDate()

  const contextBlock = `

CLIENTCONTEXT:
${name ? `Naam: ${name}` : ""}
Huidige streak (rechtstreeks uit database): ${streak} ${streak === 1 ? "dag" : "dagen"} — gebruik dit getal exact, verzin geen andere waarde
Gemiste dagen (rechtstreeks uit database): ${missedDays} — gebruik dit getal exact
Trainingslocatie: ${userData?.training_location || "onbekend"}
Fitnessniveau: ${userData?.fitness_level || "onbekend"}
Commitments van vandaag (${today}):
${commitLines}
Laatste gewicht: ${weightLine}
Laatste kcal/voeding: ${kcalLine}

Je hebt toegang tot de gespreksgeschiedenis van deze client. Gebruik dit om:
- Te onthouden wat de client eerder heeft gezegd
- Patronen te herkennen (altijd moe op maandag, struggelt met voeding in het weekend)
- Persoonlijker te reageren op basis van naam en situatie
- Niet dezelfde vragen twee keer te stellen

GEBRUIK VAN DE NAAM:
${name ? `De client heet ${name}. Gebruik de voornaam maximaal 1x per gesprek — aan het begin of bij een belangrijk moment. Niet bij elk bericht herhalen.` : "Naam onbekend — spreek de client niet bij naam aan."}
${userData?.kcal_doel ? `
VOEDINGSDOEL CLIENT:
Kcal doel: ${userData.kcal_doel} kcal/dag${userData.eiwitten_doel ? `\nEiwitten doel: ${userData.eiwitten_doel}g/dag` : ""}${userData.koolhydraten_doel ? `\nKoolhydraten doel: ${userData.koolhydraten_doel}g/dag` : ""}${userData.vetten_doel ? `\nVetten doel: ${userData.vetten_doel}g/dag` : ""}

Als de client kcal of macros instuurt — vergelijk altijd met dit doel:
- Bij afvallen: onder het kcal doel = goed, boven het doel = vriendelijk aanspreken en bijsturen
- Bij aankomen/spiermassa: boven het doel = goed, onder het doel = aanmoedigen om meer te eten
- Noem het verschil concreet: "Je zat ${userData.kcal_doel} kcal, dat is X onder/boven je doel"
- Houd het kort en direct, max 2 zinnen over voeding` : ""}`

  const scopeBlock = `

SCOPE — WAT AXIS DOET:
- Dagelijkse check-in via WhatsApp (08:00)
- Commitments bijhouden en afvinken
- Metrics opslaan: gewicht, kcal, stappen
- Avond reflectie (20:00)
- Reminders instellen op verzoek: "Herinner me elke dag om 19:00 aan creatine" of "Herinner me morgen om 09:00 aan mijn afspraak"
- Vragen beantwoorden over sport, voeding en discipline

WAT AXIS NIET DOET:
- Agenda beheren
- Afspraken inplannen met anderen
- Workouts of voedingsschema's maken
- Medisch advies geven
- Berichten sturen naar anderen

Als iemand iets vraagt buiten dit domein: leg vriendelijk uit wat AXIS wel kan doen en stuur het gesprek terug naar commitment, metrics of coaching.`

  return `${SYSTEM_PROMPTS[tone]}${NUTRITION_KNOWLEDGE}${contextBlock}${scopeBlock}`
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
- "categorie": "COMMITMENT" | "METRIC" | "VRAAG" | "REFLECTIE" | "REMINDER" | "STOP_REMINDER" | "REMINDER_LIJST" | "OVERIG"
- Voor METRIC ook: "metric_type" (kies uit: gewicht/kcal/eiwitten/koolhydraten/vetten/bloeddruk/hartslag/slaap/anders) en "waarde" (de waarde als string, bijv. "76kg" of "2000 kcal")
- Voor COMMITMENT ook: "tekst" als bondige actie (max 8 woorden) — verwijder dagaanduidingen ("vandaag", "vandaag ga ik", "ga ik"), verbindingswoorden ("daarom", "dus"), en houd alleen de kern. Bijv. "30 min hardlopen" niet "Vandaag ga ik 30 min hardlopen"
- Voor REMINDER ook: "tijd" (HH:MM formaat, bijv. "19:00"), "tekst" (kort wat de reminder is, bijv. "creatine innemen"), "eenmalig" (true als het om een specifieke datum gaat, false voor dagelijks), en "datum" (alleen bij eenmalig=true: gebruik "morgen", "overmorgen", een weekdagnaam zoals "vrijdag", of een datum als "2026-04-25" — null bij dagelijkse reminders)
- Voor STOP_REMINDER ook: "tekst" (optioneel — wat gestopt moet worden, bijv. "creatine")
- Voor alle andere categorieën ook: "tekst" (de originele tekst van dit onderdeel)

Regels — lees deze zorgvuldig:

COMMITMENT = een actie die iemand VAN PLAN IS te gaan doen (toekomst of intentie):
- Alle vormen van sport en beweging: hardlopen, fietsen, zwemmen, wandelen, sporten, gym, krachttraining, yoga, padellen, voetbal, stretchen, dansen, klimmen, roeien, skiën, etc.
- Ook als er een getal bij staat: "10.000 stappen", "5km hardlopen", "1 uur fietsen", "45 min yoga"
- Stappen met een doelgetal = COMMITMENT (geen METRIC!)
- Andere acties/plannen voor vandaag: mediteren, lezen, koud douchen, vroeg opstaan, etc.

GEEN COMMITMENT — classificeer als OVERIG of VRAAG:
- Klachten of pijn: "ik heb last van mijn rug", "ik ben moe", "mijn knie doet pijn"
- Verhalen over het verleden: "ik heb gisteren gesport", "ik heb tuinwerk gedaan", "ik ben wezen wandelen"
- Mededelingen zonder actie-intentie: "ik heb slecht geslapen", "het was een drukke dag"
- Alles met een vraagteken → VRAAG, nooit COMMITMENT

RUSTDAG = bewuste dag van rust of herstel (geen sport, geen training):
- Sleutelwoorden: "rustdag", "dagje rust", "rust vandaag", "hersteldag", "recovery", "geen sport", "geen training", "dag vrij", "rusten vandaag"
- Geef terug als: {"categorie":"RUSTDAG","tekst":"Rustdag"}
- Let op: RUSTDAG kan gecombineerd worden met METRIC in hetzelfde bericht

METRIC = uitsluitend metingen van je lichaam of inname (geen beweging!):
- Gewicht in kg: "76kg", "75.5 kg"
- Calorie-inname: "2000 kcal", "1800 cal"
- Macros: eiwitten (g), koolhydraten (g), vetten (g)
- Biometrie: bloeddruk, hartslag
- Slaap: aantal uren geslapen (niet plan om te slapen)

VRAAG = bevat een vraagteken of is duidelijk een vraag

REFLECTIE = alleen een kaal "ja" of "nee" (of "yes"/"no") als antwoord op een check-out vraag

REMINDER = verzoek om een herinnering in te stellen (dagelijks of eenmalig):
- Sleutelwoorden: "herinner me", "reminder", "remind me", "stuur me een reminder", "elke dag om"
- Vereist een tijdstip in het bericht
- Dagelijks (eenmalig=false, datum=null): "Herinner me elke dag om 19:00 aan creatine", "Reminder om 07:30 voor mijn medicatie"
- Eenmalig (eenmalig=true): bevat een specifieke dag of datum: "morgen", "overmorgen", een weekdagnaam, of een concrete datum
- Voorbeelden eenmalig: "Herinner me morgen om 09:00 aan mijn afspraak", "Reminder vrijdag om 14:00 voor tandarts", "Stuur me overmorgen om 10:00 een bericht"

STOP_REMINDER = verzoek om een specifieke reminder of alle reminders te stoppen:
- Sleutelwoorden: "stop reminder", "verwijder reminder", "reminder uit", "geen reminder meer", "zet reminder uit", "stop alle reminders", "verwijder al mijn reminders"
- Voeg "alle": true toe als het om alle reminders gaat, anders "alle": false

REMINDER_LIJST = verzoek om een overzicht van actieve reminders:
- Sleutelwoorden: "welke reminders", "toon reminders", "mijn reminders", "wat zijn mijn reminders", "reminder overzicht"

OVERIG = alles wat niet in bovenstaande categorieën past

Voorbeelden:
- "76kg" → [{"categorie":"METRIC","metric_type":"gewicht","waarde":"76kg"}]
- "10.000 stappen" → [{"categorie":"COMMITMENT","tekst":"10.000 stappen"}]
- "5km hardlopen, 2000 kcal" → [{"categorie":"COMMITMENT","tekst":"5km hardlopen"},{"categorie":"METRIC","metric_type":"kcal","waarde":"2000 kcal"}]
- "1 uur fietsen, gewicht 78kg, 150g eiwit" → [{"categorie":"COMMITMENT","tekst":"1 uur fietsen"},{"categorie":"METRIC","metric_type":"gewicht","waarde":"78kg"},{"categorie":"METRIC","metric_type":"eiwitten","waarde":"150g"}]
- "Hoeveel water?" → [{"categorie":"VRAAG","tekst":"Hoeveel water?"}]
- "ja" → [{"categorie":"REFLECTIE","tekst":"ja"}]
- "rustdag" → [{"categorie":"RUSTDAG","tekst":"Rustdag"}]
- "Dagje rust. Gewicht is 78.2 en 1750 kcal" → [{"categorie":"RUSTDAG","tekst":"Rustdag"},{"categorie":"METRIC","metric_type":"gewicht","waarde":"78.2kg"},{"categorie":"METRIC","metric_type":"kcal","waarde":"1750 kcal"}]
- "Herinner me elke dag om 19:00 aan creatine" → [{"categorie":"REMINDER","tijd":"19:00","tekst":"creatine innemen","eenmalig":false,"datum":null}]
- "Stuur me om 07:30 een reminder voor mijn medicatie" → [{"categorie":"REMINDER","tijd":"07:30","tekst":"medicatie innemen","eenmalig":false,"datum":null}]
- "Herinner me morgen om 09:00 aan mijn afspraak" → [{"categorie":"REMINDER","tijd":"09:00","tekst":"afspraak","eenmalig":true,"datum":"morgen"}]
- "Reminder vrijdag om 14:00 voor tandarts" → [{"categorie":"REMINDER","tijd":"14:00","tekst":"tandarts","eenmalig":true,"datum":"vrijdag"}]
- "Stuur me overmorgen om 10:00 een bericht over mijn medicatie" → [{"categorie":"REMINDER","tijd":"10:00","tekst":"medicatie","eenmalig":true,"datum":"overmorgen"}]
- "Stop de creatine reminder" → [{"categorie":"STOP_REMINDER","tekst":"creatine","alle":false}]
- "Zet de 19:00 reminder uit" → [{"categorie":"STOP_REMINDER","tekst":"19:00","alle":false}]
- "Stop alle reminders" → [{"categorie":"STOP_REMINDER","tekst":"","alle":true}]
- "Verwijder al mijn reminders" → [{"categorie":"STOP_REMINDER","tekst":"","alle":true}]
- "Welke reminders heb ik?" → [{"categorie":"REMINDER_LIJST","tekst":""}]
- "Toon mijn reminders" → [{"categorie":"REMINDER_LIJST","tekst":""}]
- "Ik heb last van mijn rug na tuinwerk" → [{"categorie":"OVERIG","tekst":"Ik heb last van mijn rug na tuinwerk"}]
- "Ik ben gisteren gaan hardlopen" → [{"categorie":"OVERIG","tekst":"Ik ben gisteren gaan hardlopen"}]
- "Ik heb slecht geslapen vannacht" → [{"categorie":"OVERIG","tekst":"Ik heb slecht geslapen vannacht"}]
- "Het was een drukke dag" → [{"categorie":"OVERIG","tekst":"Het was een drukke dag"}]

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
      if (item.categorie === "RUSTDAG")   return `😴 Rustdag genoteerd`
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

  console.log("=== [MESSAGES NAAR ANTHROPIC] ===", JSON.stringify(messages, null, 2))

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

async function handleOverig(from, body, userData, history = []) {
  console.log("=== [3] OVERIG — AI DOORVRAAG ===")
  const tone = getTone(userData?.streak ?? 0, userData?.missed_days ?? 0)
  const messages = [...history, { role: "user", content: body }]

  console.log("=== [MESSAGES NAAR ANTHROPIC] ===", JSON.stringify(messages, null, 2))

  const aiResponse = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 128,
    system: `${SYSTEM_PROMPTS[tone]}

Je ontvangt een bericht dat je niet precies begrijpt of dat buiten het domein van AXIS valt.

Als het buiten het domein valt (reminders, agenda, taken buiten fitness): leg vriendelijk maar duidelijk uit wat AXIS wel en niet doet. Zeg: "Dat kan ik niet voor je doen — AXIS is geen reminder app. Wat ik wel doe: elke ochtend om 08:00 stuur ik je een check-in. Stuur me dan je commitment voor die dag."

Als het onduidelijk is maar binnen het domein zou kunnen vallen: reageer menselijk en nieuwsgierig. Stel één korte doorvraag. Geen opsommingen, geen uitleg over wat je kunt doen.`,
    messages,
  })
  const reply = aiResponse.content[0].text
  await Promise.all([
    saveConversation(userData?.id, "user", body),
    saveConversation(userData?.id, "assistant", reply),
  ])
  await sendWhatsApp(from, reply)
}

function resolveDate(datum) {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Amsterdam" }))
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const d = (datum || "").toLowerCase().trim()
  if (d === "morgen") {
    today.setDate(today.getDate() + 1)
    return today.toISOString().slice(0, 10)
  }
  if (d === "overmorgen") {
    today.setDate(today.getDate() + 2)
    return today.toISOString().slice(0, 10)
  }
  const weekdays = { maandag: 1, dinsdag: 2, woensdag: 3, donderdag: 4, vrijdag: 5, zaterdag: 6, zondag: 0 }
  if (weekdays[d] !== undefined) {
    const target = weekdays[d]
    const current = today.getDay()
    let diff = target - current
    if (diff <= 0) diff += 7
    today.setDate(today.getDate() + diff)
    return today.toISOString().slice(0, 10)
  }
  // Already an ISO date string or unrecognized — return as-is if it looks like a date
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d
  return null
}

function datumLabel(isoDate) {
  if (!isoDate) return null
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Amsterdam" }))
  const todayStr = now.toISOString().slice(0, 10)
  const tomorrowStr = new Date(new Date(now).setDate(now.getDate() + 1)).toISOString().slice(0, 10)
  if (isoDate === tomorrowStr) return "morgen"
  const date = new Date(isoDate)
  return date.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Amsterdam" })
}

async function handleReminder(from, item, userData) {
  console.log("=== [3] REMINDER AANMAKEN ===")
  const userId = userData?.id
  if (!userId) {
    await sendWhatsApp(from, "Koppel eerst je account via de app om reminders in te stellen.")
    return
  }

  const { tijd, tekst, eenmalig } = item
  if (!tijd || !tekst) {
    await sendWhatsApp(from, "Ik kon de tijd of tekst van je reminder niet herkennen. Probeer: \"Herinner me elke dag om 19:00 aan creatine\"")
    return
  }

  const isEenmalig = !!eenmalig
  const datum = isEenmalig ? resolveDate(item.datum) : null

  if (isEenmalig && !datum) {
    await sendWhatsApp(from, "Ik kon de datum niet herkennen. Probeer: \"Herinner me morgen om 09:00 aan mijn afspraak\"")
    return
  }

  const { error } = await supabase
    .from("reminders")
    .insert({ user_id: userId, tekst, tijd, actief: true, eenmalig: isEenmalig, datum })

  if (error) {
    console.error("Reminder INSERT error:", error.message)
    await sendWhatsApp(from, "Er ging iets mis bij het aanmaken van je reminder. Probeer het opnieuw.")
    return
  }

  console.log("Reminder opgeslagen:", tekst, "om", tijd, "| eenmalig:", isEenmalig, "| datum:", datum)

  if (isEenmalig) {
    const label = datumLabel(datum)
    await sendWhatsApp(from, `✅ Eenmalige reminder aangemaakt — ik stuur je ${label} om ${tijd} een berichtje over ${tekst}.`)
  } else {
    await sendWhatsApp(from, `✅ Reminder aangemaakt — ik stuur je elke dag om ${tijd} een berichtje over ${tekst}.`)
  }
}

async function handleStopReminder(from, item, userData) {
  console.log("=== [3] REMINDER STOPPEN ===")
  const userId = userData?.id
  if (!userId) {
    await sendWhatsApp(from, "Koppel eerst je account via de app.")
    return
  }

  const stopAlle = !!item.alle
  const tekst = item.tekst?.trim()

  let query = supabase.from("reminders").update({ actief: false }).eq("user_id", userId).eq("actief", true)
  if (!stopAlle && tekst) {
    query = query.ilike("tekst", `%${tekst}%`)
  }

  const { error } = await query
  if (error) {
    console.error("Reminder stop error:", error.message)
    await sendWhatsApp(from, "Er ging iets mis. Probeer het opnieuw.")
    return
  }

  console.log(`Reminder(s) gestopt voor user: ${userId} | alle: ${stopAlle}`)
  if (stopAlle) {
    await sendWhatsApp(from, "✅ Alle reminders gestopt.")
  } else {
    const label = tekst || "reminder"
    await sendWhatsApp(from, `✅ Reminder ${label} gestopt.`)
  }
}

async function handleReminderLijst(from, userData) {
  console.log("=== [3] REMINDER LIJST ===")
  const userId = userData?.id
  if (!userId) {
    await sendWhatsApp(from, "Koppel eerst je account via de app.")
    return
  }

  const { data, error } = await supabase
    .from("reminders")
    .select("tekst, tijd, eenmalig, datum")
    .eq("user_id", userId)
    .eq("actief", true)
    .order("tijd", { ascending: true })

  if (error) {
    console.error("Reminder lijst error:", error.message)
    await sendWhatsApp(from, "Er ging iets mis. Probeer het opnieuw.")
    return
  }

  if (!data || data.length === 0) {
    await sendWhatsApp(from, "Je hebt geen actieve reminders.")
    return
  }

  const lines = data.map(r => {
    if (r.eenmalig) {
      const label = datumLabel(r.datum) || r.datum || "eenmalig"
      return `- ${label} ${r.tijd} — ${r.tekst} (eenmalig)`
    }
    return `- ${r.tijd} — ${r.tekst} (dagelijks)`
  })

  const reply = `📋 Jouw actieve reminders:\n${lines.join("\n")}\n\nStuur 'stop [naam]' om een reminder uit te zetten.`
  await sendWhatsApp(from, reply)
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

    const metrics      = items.filter((i) => i.categorie === "METRIC")
    const commitments  = items.filter((i) => i.categorie === "COMMITMENT")
    const vragen       = items.filter((i) => i.categorie === "VRAAG")
    const rustdagen    = items.filter((i) => i.categorie === "RUSTDAG")
    const reminders      = items.filter((i) => i.categorie === "REMINDER")
    const stopReminders  = items.filter((i) => i.categorie === "STOP_REMINDER")
    const reminderLijst  = items.filter((i) => i.categorie === "REMINDER_LIJST")

    console.log(`Metrics: ${metrics.length} | Commitments: ${commitments.length} | Vragen: ${vragen.length} | Rustdagen: ${rustdagen.length} | Reminders: ${reminders.length} | StopReminders: ${stopReminders.length} | ReminderLijst: ${reminderLijst.length}`)

    // Reminder intents — altijd direct afhandelen
    if (reminderLijst.length > 0) {
      await handleReminderLijst(from, userData)
      return
    }
    if (reminders.length > 0) {
      for (const item of reminders) {
        await handleReminder(from, item, userData)
      }
      return
    }
    if (stopReminders.length > 0) {
      await handleStopReminder(from, stopReminders[0], userData)
      return
    }

    // Enkelvoudige speciale gevallen
    if (items.length === 1) {
      if (vragen.length === 1) {
        // Dagelijkse vragenlimiet controleren
        const questionCount = await getDailyQuestionCount(userData?.id)
        console.log(`Dagelijks vraag-count: ${questionCount}/${DAILY_QUESTION_LIMIT}`)
        if (questionCount >= DAILY_QUESTION_LIMIT) {
          console.log("Vragenlimiet bereikt — bericht geblokkeerd")
          await sendWhatsApp(from, "Je hebt vandaag je vragenlimiet bereikt. Open de AXIS app voor meer coaching.")
          return
        }
        // Laad geheugen + context parallel
        const [history, clientContext] = await Promise.all([
          getConversationHistory(userData?.id),
          getClientContext(userData),
        ])
        await handleVraag(from, body, userData, history, clientContext)
        return
      }
      if (items[0].categorie === "REFLECTIE" || items[0].categorie === "OVERIG") {
        const history = await getConversationHistory(userData?.id)
        await handleOverig(from, body, userData, history)
        return
      }
      // Enkel rustdag → opslaan als commitment + AI reactie over herstel
      if (rustdagen.length === 1 && metrics.length === 0 && commitments.length === 0) {
        console.log("=== [4] RUSTDAG — OPSLAAN + AI REPLY ===")
        const userId = userData?.auth_user_id
        const today  = getNLDate()
        if (userId) {
          const { error } = await supabase.from("commitments").insert({
            user_id: userId, text: "Rustdag", date: today, done: false, category: "herstel",
          })
          if (error) console.error("Rustdag INSERT error:", error.message)
          else console.log("Rustdag commitment opgeslagen")
        }
        const [history, clientContext] = await Promise.all([
          getConversationHistory(userData?.id),
          getClientContext(userData),
        ])
        const systemPrompt = buildSystemPrompt(tone, userData, clientContext) +
          `\n\nDe client meldt een rustdag. Bevestig in 1-2 zinnen dat rust essentieel is voor herstel en progressie. Vraag daarna vriendelijk of ze nog hun gewicht of calorieën willen doorgeven.`
        const aiResponse = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 200,
          system: systemPrompt,
          messages: [...history, { role: "user", content: body }],
        })
        const reply = aiResponse.content[0].text
        await Promise.all([
          saveConversation(userData?.id, "user", body),
          saveConversation(userData?.id, "assistant", reply),
        ])
        await sendWhatsApp(from, reply)
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
          supabase.from("commitments").insert({ user_id: userId, text: commitments[0].tekst, date: today, done: false, category: classifyCommitmentCategory(commitments[0].tekst) }),
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

    for (const item of rustdagen) {
      console.log("Saving rustdag (multi-part) | user_id:", userId)
      const { error } = await supabase.from("commitments").insert({
        user_id: userId, text: "Rustdag", date: today, done: false, category: "herstel",
      })
      if (error) console.error("Rustdag INSERT error:", error.message)
      else { console.log("Rustdag opgeslagen"); savedItems.push(item) }
    }

    for (const item of commitments) {
      console.log("Saving commitment (multi-part):", item.tekst, "| user_id:", userId)
      const { error } = await supabase.from("commitments").insert({
        user_id:  userId,
        text:     item.tekst,
        date:     today,
        done:     false,
        category: classifyCommitmentCategory(item.tekst),
      })
      if (error) console.error("Commitment INSERT error:", error.message, "| code:", error.code, "| details:", error.details)
      else { console.log("Commitment saved OK:", item.tekst); savedItems.push(item) }
    }

    const confirmation = buildConfirmation(savedItems)
    if (confirmation) await sendWhatsApp(from, confirmation)
    else {
      const history = await getConversationHistory(userData?.id)
      await handleOverig(from, body, userData, history)
    }

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
