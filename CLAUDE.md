# AXIS — Claude Code Projectgeheugen

## Wie en wat
AXIS is een dagelijks accountability platform voor personal trainers en coaches.
Core loop: **Commit. Execute. Reflect. Recover.** — via WhatsApp + AI coach.
Founder: Raoul Steenkamp | KvK: 42061969 (eenmanszaak)

## Live URLs
- Marketing: https://axisapp.nl
- App: https://app.axisapp.nl
- Dashboard (admin): https://app.axisapp.nl/dashboard

## Stack
- **Frontend**: Next.js met Turbopack
- **Backend**: Supabase (auth + database + RLS)
- **AI**: Anthropic Claude API
- **WhatsApp**: Meta Cloud API direct (webhook: axisapp.nl/api/whatsapp)
- **Hosting**: Vercel (auto-deploy vanuit GitHub: raoul87-design/axisapp, branch main)
- **Email**: Brevo SMTP → hello@axisapp.nl
- **Payments**: Mollie (nog in te stellen)
- **Cron**: cron.org — secret: `axis-cron-2024-xk9p`

## Vaste gebruikers
| Naam | Rol | User ID | WhatsApp |
|------|-----|---------|----------|
| Raoul Steenkamp | Admin/Coach | `2839e519-cf08-4e23-9e3c-8e066125ce0b` | +31613002594 |
| Job Brinkman | Coach | `c8550829-fbdc-4c93-9cfc-...` | +31640684735 |
| Stefan te Narve | Test client | — | — |
| Reina Pons Cervera | Test client | — | — |
| Nick Bakker | Test client | — | — |
| Jurgen Zwart | Test client | — | — |
| Thomas Wesselink | Test client | — | — |

## User types
1. **B2B Coach** — betaalt maandelijks, beheert clients
2. **B2B Cliënt** — onder coach, geen betaling
3. **B2C gebruiker** — self-service, eigen product

## Werkwijze — ALTIJD volgen

### Taal
Alle prompts en code comments schrijf je in het **Nederlands**.

### Scope
Maak **alleen de gevraagde wijziging** — geen extra refactoring, geen "terwijl ik toch bezig ben". Als je iets anders ziet dat aandacht verdient, benoem het maar doe het niet.

### SQL migrations
**Nooit automatisch uitvoeren.** Genereer de exacte SQL en instrueer Raoul om deze handmatig uit te voeren in:
→ supabase.com → project → SQL Editor → plak → run

Wacht altijd op bevestiging ("succes" of "error + melding") voor je verdergaat.

### Destructieve acties
**Nooit** DELETE, DROP of truncate queries voorstellen zonder **expliciete voorafgaande goedkeuring**. Dit geldt absoluut — ook als het logisch lijkt.

### Push workflow
Na elke build: geef een korte Nederlandse samenvatting van wat er gebouwd/gewijzigd is. Raoul plakt deze terug in de Claude.ai chat om context gesynchroniseerd te houden.

## Kritieke technische regels

### Supabase RLS — UUID vs TEXT inconsistentie
**Dit is de meest voorkomende bugbron in AXIS.**

Tabellen die user_id opslaan als **TEXT**:
- `daily_results`, `commitments`, `reflections`

Tabellen die user_id opslaan als **UUID**:
- `conversations`, `reminders`, `metrics`, `check_ins`, `workout_sets`

Controleer altijd het type voordat je RLS policies schrijft of queries maakt op user_id.

### RLS op de users tabel
Gebruik een `SECURITY DEFINER` functie (`get_user_role()`) om recursieve RLS policy loops te vermijden.

### Supabase client
- **Server-side (API routes)**: gebruik `supabaseAdmin` (service role key)
- **Frontend**: gebruik anon key + RLS

### WhatsApp verwerking — volgorde is strict
`reflection check → short-ack check → delay → parseCheckin → AI`
Nooit van deze volgorde afwijken.

### Streak logica
Gebruik `date < today` (niet `<=`) — de huidige dag telt pas mee als hij ≥1 score van 100 heeft.

### Feature flags
`USE_WHATSAPP_TEMPLATES` staat in de codebase — zet aan zodra Meta templates goedgekeurd zijn.

## Cron jobs (cron.org)
| Job | Tijd (NL) | Endpoint |
|-----|-----------|----------|
| Morning check-in | 08:00 | /api/cron/morning |
| Evening check-in | 20:00 | /api/cron/evening |
| Midnight reset | 23:59 | /api/cron/midnight |
| Reminders | elk uur | /api/cron/reminders |

Auth header: `x-cron-secret: axis-cron-2024-xk9p`

## WhatsApp / Meta status
- Route: Meta Cloud API direct (niet Twilio)
- Business Portfolio ID: 27060135753618646
- Productienummer: 653715542 (KPN)
- Webhook: axisapp.nl/api/whatsapp
- Status: in afwachting van nieuw schoon Facebook account + Business Portfolio
- **Regel**: nummer registratie mag maar ÉÉN keer — meerdere pogingen = ban

## Wat AXIS niet is
- Geen vervanging voor voedingsapps — AXIS is de accountability laag
- Coaches stellen TDEE in, clients loggen één kcal getal, AI geeft gerichte feedback
