import twilio from "twilio"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@supabase/supabase-js"

// Vereiste migratie (eenmalig uitvoeren in Supabase SQL editor):
//   ALTER TABLE users ADD COLUMN IF NOT EXISTS kcal_nudge_sent_at TIMESTAMPTZ;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const supabase = createClient(
  "https://zdqrrprjkddlxszmtcmx.supabase.co",
  process.env.SUPABASE_SERVICE_KEY || "sb_publishable__cdXODEiCbsHvycy6uuB_g_SIIgI6YH"
)

function firstName(name) {
  if (!name?.trim()) return null
  return name.trim().split(/\s+/)[0]
}

// Geeft YYYY-MM-DD terug in Amsterdam timezone, optioneel N dagen terug
function getNLDate(daysAgo = 0) {
  const d = new Date()
  if (daysAgo) d.setDate(d.getDate() - daysAgo)
  return d.toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" })
}

export async function GET(request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 })
  }

  console.log("=== [MIDNIGHT CHECK] START ===")

  const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  const results = { streakResets: 0, kcalNudges: 0 }

  try {
    // ── Deel 1: streak resets voor niet-gereageerde avond check-ins ──────────

    const { data: users, error } = await supabase
      .from("users")
      .select("id, streak, missed_days, awaiting_reflection, whatsapp_number, name")
      .eq("awaiting_reflection", true)

    if (error) {
      console.error("Fout bij ophalen users:", error.message)
      return new Response("DB error", { status: 500 })
    }

    console.log(`${users.length} users hebben niet gereageerd op avond check-in`)

    for (const user of users) {
      const newMissedDays = (user.missed_days ?? 0) + 1

      await supabase
        .from("users")
        .update({ streak: 0, missed_days: newMissedDays, awaiting_reflection: false })
        .eq("id", user.id)

      console.log(`User ${user.id}: streak → 0, missed_days → ${newMissedDays}`)

      if (user.whatsapp_number) {
        try {
          const fn = firstName(user.name)
          const greeting = fn ? `Hey ${fn}` : "Hey"
          await twilioClient.messages.create({
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            to: user.whatsapp_number,
            body: `${greeting}, geen check-out gisteren — streak gereset. Vandaag opnieuw beginnen. Kleine stappen tellen.`,
          })
          results.streakResets++
          console.log(`Streak reset bericht verstuurd naar ${user.whatsapp_number}`)
        } catch (err) {
          console.error(`WhatsApp fout voor ${user.whatsapp_number}:`, err.message)
        }
      }
    }

    // ── Deel 2: proactieve kcal nudge ─────────────────────────────────────────
    //
    // Trigger: 3 aaneengesloten dagen met kcal data die allemaal onder kcal_doel liggen
    // Limiet:  maximaal 1 bericht per 7 dagen per client (kcal_nudge_sent_at kolom)

    console.log("=== [KCAL NUDGE] START ===")

    const { data: kcalUsers, error: kcalError } = await supabase
      .from("users")
      .select("id, auth_user_id, name, whatsapp_number, kcal_doel, missed_days, streak, kcal_nudge_sent_at")
      .not("kcal_doel", "is", null)
      .not("whatsapp_number", "is", null)

    if (kcalError) {
      console.error("Fout bij ophalen kcal users:", kcalError.message)
    } else {
      console.log(`${kcalUsers.length} users met kcal doel`)
      const sevenDaysAgo = getNLDate(7)

      for (const user of kcalUsers) {
        if (!user.auth_user_id) continue

        // Rate limit: sla over als er < 7 dagen geleden al een nudge is verstuurd
        if (user.kcal_nudge_sent_at) {
          const daysSince = (Date.now() - new Date(user.kcal_nudge_sent_at).getTime()) / 86400000
          if (daysSince < 7) {
            console.log(`User ${user.id}: nudge ${Math.floor(daysSince)}d geleden — overgeslagen`)
            continue
          }
        }

        // Haal kcal metrics van de afgelopen 7 dagen op
        const { data: rawMetrics, error: mErr } = await supabase
          .from("metrics")
          .select("waarde, datum")
          .eq("user_id", user.auth_user_id)
          .in("type", ["voeding", "calorie", "kcal"])
          .gte("datum", sevenDaysAgo)
          .order("datum", { ascending: false })

        if (mErr) {
          console.error(`Metrics fout user ${user.id}:`, mErr.message)
          continue
        }

        // Bouw datum → hoogste kcal waarde map (meerdere entries per dag → max)
        const dayMap = {}
        for (const m of rawMetrics || []) {
          const val = parseFloat(String(m.waarde).replace(/[^\d.]/g, ""))
          if (!isNaN(val)) {
            dayMap[m.datum] = Math.max(dayMap[m.datum] ?? 0, val)
          }
        }

        // Minimaal 3 dagwaarden nodig
        const dates = Object.keys(dayMap).sort().reverse()
        if (dates.length < 3) continue

        // De 3 recentste datums moeten aaneengesloten zijn
        const [d0, d1, d2] = dates
        const consecutive =
          (new Date(d0) - new Date(d1)) / 86400000 === 1 &&
          (new Date(d1) - new Date(d2)) / 86400000 === 1

        if (!consecutive) {
          console.log(`User ${user.id}: top-3 datums niet aaneengesloten (${d0}, ${d1}, ${d2})`)
          continue
        }

        // Alle 3 dagen onder het kcal doel?
        const allBelow = [d0, d1, d2].every(d => dayMap[d] < user.kcal_doel)
        if (!allBelow) continue

        const avg    = Math.round((dayMap[d0] + dayMap[d1] + dayMap[d2]) / 3)
        const tekort = Math.round(user.kcal_doel - avg)
        const fn     = firstName(user.name)

        console.log(`User ${user.id}: 3 aaneengesloten dagen avg ${avg}/${user.kcal_doel} kcal — nudge genereren`)

        try {
          const aiResponse = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 150,
            system: `Je bent een directe discipline coach die een WhatsApp stuurt.
Schrijf maximaal 2-3 korte zinnen. Geen opsommingen. Gebruik 'je'.
Nooit beginnen met 'Geweldig!', 'Fantastisch!' of andere hype-woorden.
Soms een doorvraag in plaats van een antwoord. Menselijk taalgebruik.`,
            messages: [{
              role: "user",
              content: `${fn ? `Naam: ${fn}. ` : ""}3 aaneengesloten dagen het kcal doel van ${user.kcal_doel} kcal niet gehaald. Gemiddelde was ${avg} kcal — ${tekort} kcal onder het doel per dag. Stuur een korte, directe opmerking over dit patroon.${fn ? ` Gebruik de voornaam maximaal één keer.` : ""}`,
            }],
          })

          const nudgeText = aiResponse.content[0].text.trim()
          console.log(`Nudge user ${user.id}: "${nudgeText}"`)

          await twilioClient.messages.create({
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            to: user.whatsapp_number,
            body: nudgeText,
          })

          const { error: updateErr } = await supabase
            .from("users")
            .update({ kcal_nudge_sent_at: new Date().toISOString() })
            .eq("id", user.id)

          if (updateErr) {
            console.error(`kcal_nudge_sent_at update mislukt (migratie uitgevoerd?):`, updateErr.message)
          }

          results.kcalNudges++
          console.log(`Kcal nudge verstuurd naar ${user.whatsapp_number}`)
        } catch (err) {
          console.error(`Nudge fout user ${user.id}:`, err.message)
        }
      }
    }

    console.log(`=== [MIDNIGHT CHECK] KLAAR — streakResets: ${results.streakResets}, kcalNudges: ${results.kcalNudges} ===`)
    return new Response(
      JSON.stringify(results),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Cron error:", error.message)
    return new Response("Internal error", { status: 500 })
  }
}
