---
name: migrate
description: Genereer een SQL migratie voor een nieuwe tabel, kolom, index of RLS policy in Supabase. Gebruik deze skill altijd als er een nieuwe tabel of kolom nodig is, als RLS policies aangepast moeten worden, of als Raoul vraagt om een database wijziging. Voert NOOIT automatisch SQL uit — altijd handmatig via Supabase SQL Editor.
allowed-tools: Read, Grep
disable-model-invocation: false
---

# SQL Migratie voor AXIS

## Stap 1 — Begrijp de wijziging

Lees de vraag goed. Bepaal:
- Nieuwe tabel? Nieuwe kolom? Index? RLS policy?
- Welke bestaande tabellen zijn betrokken?

## Stap 2 — Controleer UUID vs TEXT (KRITIEK)

Dit is de meest voorkomende bugbron in AXIS. Controleer altijd het juiste type voor user_id:

**TEXT** (gebruik `text`):
- `daily_results`, `commitments`, `reflections`

**UUID** (gebruik `uuid`):
- `conversations`, `reminders`, `metrics`, `check_ins`, `workout_sets`, `users`

Als je een nieuwe tabel maakt die user_id bevat: kijk naar welke tabel hij het meest mee joined en gebruik hetzelfde type.

Zoek ter controle in de codebase:
```
Grep voor: user_id in de relevante bestaande tabel
```

## Stap 3 — Genereer de SQL

Schrijf de exacte SQL. Gebruik altijd:
- `IF NOT EXISTS` bij CREATE TABLE
- `DEFAULT gen_random_uuid()` voor UUID primary keys
- `DEFAULT now()` voor created_at timestamps
- Expliciete NOT NULL waar van toepassing

### Template nieuwe tabel:
```sql
CREATE TABLE IF NOT EXISTS public.[naam] (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id [uuid of text] REFERENCES public.users(id) ON DELETE CASCADE,
  -- kolommen hier
  created_at timestamp with time zone DEFAULT now()
);

-- RLS aanzetten
ALTER TABLE public.[naam] ENABLE ROW LEVEL SECURITY;

-- Policy: user ziet alleen eigen data
CREATE POLICY "[naam]_select_own" ON public.[naam]
  FOR SELECT USING (
    user_id = [auth.uid()::text OF auth.uid() afhankelijk van type]
  );

CREATE POLICY "[naam]_insert_own" ON public.[naam]
  FOR INSERT WITH CHECK (
    user_id = [auth.uid()::text OF auth.uid()]
  );
```

### Template nieuwe kolom:
```sql
ALTER TABLE public.[tabel] 
ADD COLUMN IF NOT EXISTS [kolom] [type] [DEFAULT waarde];
```

## Stap 4 — Instructie voor Raoul

Geef de SQL altijd in dit formaat:

---
**🗄️ SQL Migratie vereist**

Voer dit handmatig uit in Supabase:
→ supabase.com → jouw project → SQL Editor → plak → Run

```sql
[exacte SQL hier]
```

**Wat dit doet:** [korte uitleg in Nederlands]

**Let op:** [eventuele waarschuwingen, bijv. UUID vs TEXT keuze]

Bevestig hier met "succes" of "error + [melding]"
---

## Stap 5 — Wacht op bevestiging

Ga NIET verder met code schrijven totdat Raoul "succes" bevestigt. Als er een error is, los die eerst op.
