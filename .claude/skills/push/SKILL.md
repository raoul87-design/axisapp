---
name: push
description: Stage alle wijzigingen, maak een Nederlandse commit message op basis van de diff, controleer op secrets en gevaarlijke bestanden, push naar main, en geef een korte samenvatting terug die Raoul in de Claude.ai chat kan plakken. Gebruik deze skill altijd als Raoul vraagt om te pushen, committen, of als een feature klaar is.
allowed-tools: Bash(git *)
disable-model-invocation: false
---

# Push naar GitHub

## Stap 1 — Veiligheidscheck

Controleer of er geen gevaarlijke bestanden in de staging staan:

```
!`git diff --name-only HEAD`
!`git status --short`
```

Stop direct en waarschuw Raoul als je een van deze bestanden ziet:
- `.env`, `.env.local`, `.env.production` of varianten
- Bestanden met `secret`, `key`, `token`, `password` in de naam
- `node_modules/`, `dist/`, `.next/` (build artifacts)

## Stap 2 — Bekijk de wijzigingen

```
!`git diff HEAD --stat`
```

Lees de diff om te begrijpen wat er veranderd is. Let op:
- Nieuwe bestanden
- Gewijzigde API routes (`/api/`)
- Supabase queries (check op UUID vs TEXT issues)
- WhatsApp webhook wijzigingen (check op verwerkvolgorde)

## Stap 3 — Commit message genereren

Schrijf een Nederlandse commit message op basis van wat je ziet in de diff.

Format:
```
[type]: [korte beschrijving in het Nederlands]

[optioneel: 1-2 regels toelichting als het complex is]
```

Types: `fix`, `feat`, `refactor`, `sql`, `style`, `chore`

Voorbeelden:
- `feat: reflectie state opgeslagen via localStorage`
- `fix: UUID vs TEXT mismatch in RLS policy voor commitments`
- `feat: WhatsApp ochtend check-in met workout schema`

## Stap 4 — Stage en push

```bash
git add -A
git commit -m "[jouw gegenereerde commit message]"
git push origin main
```

## Stap 5 — Samenvatting voor Raoul

Geef altijd een korte samenvatting in dit formaat zodat Raoul het in Claude.ai kan plakken:

---
**✅ Gepusht naar main**

**Wat er veranderd is:**
- [bullet 1]
- [bullet 2]

**Vercel deployt automatisch** — controleer over ~60 seconden op app.axisapp.nl

**SQL nodig?** [Ja → geef exacte SQL] / [Nee]

**Testen:** [wat Raoul moet testen om te bevestigen dat het werkt]
---
