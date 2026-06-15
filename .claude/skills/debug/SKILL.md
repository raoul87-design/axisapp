---
name: debug
description: Debuggen van problemen in AXIS — met name WhatsApp webhook, Supabase queries, RLS policies, cron jobs en Vercel errors. Gebruik deze skill altijd als er iets niet werkt, een bericht niet aankomt, een query faalt, of als Raoul een error meldt. Stel gerichte diagnostische vragen voor je conclusies trekt.
allowed-tools: Read, Grep, Bash(git log *), Bash(git diff *)
disable-model-invocation: false
---

# Debug workflow voor AXIS

## Stap 1 — Categoriseer het probleem

Vraag of bepaal direct welke categorie:

**A) WhatsApp bericht komt niet aan / verkeerde reactie**
**B) Supabase query faalt of geeft verkeerde data**
**C) RLS policy blokkeert of laat te veel door**
**D) Cron job doet niets of dubbel**
**E) Vercel build of runtime error**
**F) Frontend toont verkeerde data**

## Stap 2A — WhatsApp debugging

De verwerkingsvolgorde in AXIS is STRICT. Controleer altijd in deze volgorde:

```
1. reflection check
2. short-ack check  
3. delay
4. parseCheckin
5. AI
```

Stel Raoul deze vragen:
- Wat stuurde de gebruiker precies?
- Wat verwacht je dat er gebeurt?
- Wat gebeurt er wel (stilte / foutmelding / verkeerd antwoord)?
- Is het een reflectie-bericht (Ja/Nee) of een normaal bericht?

Zoek in de codebase:
```
Grep voor: awaiting_reflection
Grep voor: parseCheckin
Grep voor: /api/whatsapp
```

Vertel Raoul om Vercel logs te checken (alleen laatste uur beschikbaar):
→ vercel.com → axisapp → Functions → /api/whatsapp → bekijk logs

## Stap 2B — Supabase query debugging

Controleer altijd:
1. Wordt `supabaseAdmin` gebruikt (server-side) of anon key (frontend)?
2. Wat is het user_id type in deze tabel? (UUID of TEXT — zie CLAUDE.md)
3. Is RLS ingeschakeld op deze tabel?

Vraag Raoul de exacte error te plakken.

Genereer een test query die Raoul handmatig in Supabase SQL Editor kan uitvoeren om te isoleren of het een RLS of query probleem is.

## Stap 2C — RLS debugging

```sql
-- Test: zet RLS tijdelijk uit om te bevestigen dat dat het probleem is
-- NOOIT in productie zonder toestemming van Raoul
SELECT * FROM public.[tabel] WHERE user_id = '[id]';
```

Controleer:
- Gebruikt de policy `auth.uid()` of `auth.uid()::text`?
- Klopt dit met het kolom type (UUID vs TEXT)?
- Is er een `SECURITY DEFINER` functie nodig? (users tabel vereist dit)

## Stap 2D — Cron job debugging

Vier actieve crons op cron.org:
- 08:00 → /api/cron/morning
- 20:00 → /api/cron/evening  
- 23:59 → /api/cron/midnight
- elk uur → /api/cron/reminders

Controleer:
- Wordt de auth header meegestuurd? `x-cron-secret: axis-cron-2024-xk9p`
- Zijn er dubbele berichten? Dan overlappen twee crons elkaar
- Check Vercel logs op het exacte tijdstip van de cron

## Stap 2E — Vercel error debugging

Vraag Raoul de exacte error uit Vercel logs te plakken. Zoek dan in de codebase naar de relevante route.

Meest voorkomende oorzaken in AXIS:
- Import pad fout na verplaatsen van bestanden
- Environment variable ontbreekt in Vercel dashboard
- `tool_use` / `tool_result` imbalans in Anthropic API history

## Stap 3 — Hypothese en fix

Formuleer één hypothese. Schrijf de minimale fix. Doe niet meer dan nodig.

Geef altijd aan:
- Wat de waarschijnlijke oorzaak is
- Wat de fix doet
- Hoe Raoul kan bevestigen dat het werkt
