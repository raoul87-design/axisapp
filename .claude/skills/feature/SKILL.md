---
name: feature
description: Bouw een nieuwe feature in AXIS van begin tot eind. Gebruik deze skill altijd als Raoul een nieuwe functionaliteit wil toevoegen, of vraagt om iets te bouwen wat nog niet bestaat. Loopt automatisch door alle lagen: frontend, API route, Supabase tabel/RLS, en WhatsApp integratie indien nodig.
allowed-tools: Read, Grep, Bash(git *)
disable-model-invocation: false
---

# Nieuwe feature bouwen voor AXIS

## Stap 1 — Begrijp de feature

Beantwoord deze vragen voor je begint (haal uit de prompt of vraag Raoul):

1. Wat moet de gebruiker kunnen doen? (vanuit gebruikersperspectief)
2. Wie gebruikt dit — coach, client, of beiden?
3. Komt het via de app (frontend) of via WhatsApp, of beide?
4. Is er nieuwe data opslag nodig?

## Stap 2 — Plan de lagen

AXIS heeft altijd deze lagen. Vink af welke relevant zijn:

```
□ Frontend component (Next.js pagina of component)
□ API route (/api/...)
□ Supabase tabel of kolom (→ gebruik /migrate)
□ RLS policy (→ controleer UUID vs TEXT)
□ WhatsApp integratie (webhook aanpassen)
□ Cron job aanpassing
□ AI coach context aanpassen
```

Benoem expliciet welke lagen je gaat bouwen en welke niet.

## Stap 3 — Bouw minimaal en gefocust

**Één wijziging per laag.** Geen extra refactoring. Geen "terwijl ik toch bezig ben".

Als je een bug ziet die niet gerelateerd is aan de feature: benoem hem, maar fix hem niet nu.

### Frontend
- Dark theme: zwarte achtergrond (`#0F0F0F`), groene accenten (`#22C55E`)
- Mobile-first — de app wordt primair op telefoon gebruikt
- Gebruik bestaande componenten waar mogelijk

### API routes
- Gebruik altijd `supabaseAdmin` (service role key) — nooit anon key server-side
- Valideer input voor je de database in gaat
- Return duidelijke error messages

### Supabase
- Gebruik `/migrate` skill voor nieuwe tabellen of kolommen
- Wacht altijd op "succes" bevestiging voor je verdergaat

### WhatsApp
- Verwerkvolgorde is strict: `reflection check → short-ack → delay → parseCheckin → AI`
- Voeg nieuwe intent detectie toe VOOR de AI stap
- Test altijd met een echt WhatsApp bericht na de push

## Stap 4 — Schrijf de code

Schrijf complete, werkende code. Geen placeholders, geen TODO comments.

Schrijf code comments in het Nederlands.

## Stap 5 — SQL als dat nodig is

Als er een nieuwe tabel of kolom nodig is: gebruik de `/migrate` skill workflow. Ga niet verder met de feature code totdat Raoul "succes" heeft bevestigd.

## Stap 6 — Push

Gebruik de `/push` skill om te committen en pushen.

## Stap 7 — Testinstructie

Geef Raoul altijd een concrete testinstructie:
- Wat moet hij doen in de app?
- Wat moet hij via WhatsApp sturen?
- Wat moet hij zien als het werkt?
- Wat moet hij controleren als het niet werkt?
