# AXIS — Gebruiker handmatig toevoegen

## 1. User toevoegen in Supabase

Ga naar **Supabase → Table Editor → users** en voeg een nieuwe rij toe met deze velden:

| Veld | Waarde | Verplicht |
|---|---|---|
| `whatsapp_number` | `whatsapp:+31612345678` | ✅ |
| `streak` | `0` | ✅ |
| `missed_days` | `0` | ✅ |
| `awaiting_reflection` | `false` | ✅ |
| `auth_user_id` | UUID van de user in `auth.users` | Optioneel* |

> *`auth_user_id` is alleen nodig als de user ook de web app gebruikt. Zonder dit veld werkt de WhatsApp dagcyclus gewoon.

---

## 2. WhatsApp nummer formaat

Het nummer moet **altijd** beginnen met `whatsapp:` gevolgd door het internationale formaat:

```
whatsapp:+31612345678
```

- Geen spaties
- Geen streepjes
- Landcode verplicht (`+31` voor Nederland, `+32` voor België)
- Altijd het `whatsapp:` prefix — zonder dit herkent Twilio het nummer niet

---

## 3. Dagcyclus activeren

De dagcyclus start automatisch zodra `whatsapp_number` is ingevuld. De crons halen alle users op waar `whatsapp_number` niet leeg is:

```js
.not("whatsapp_number", "is", null)
```

Er is geen aparte `active` vlag nodig. Wil je een user tijdelijk stoppen, verwijder dan het `whatsapp_number` of zet het op `null`.

---

## 4. Testen zonder te wachten op 08:00

### Ochtend check-in testen
Ga naar **Vercel → jouw project → Settings → Crons** en klik **Run** naast `morning-checkin`.

### Avond check-in testen
Klik **Run** naast `evening-checkin`. De user krijgt het avond bericht en `awaiting_reflection` wordt `true`.

### Midnight check testen
Zet `awaiting_reflection` handmatig op `true` in Supabase voor een user, klik dan **Run** naast `midnight-check`. De streak reset en `missed_days` gaat +1.

### Webhook testen (WhatsApp antwoord simuleren)
Stuur zelf een WhatsApp bericht naar het Twilio sandbox nummer (`+14155238886`) vanuit het gekoppelde nummer. De webhook verwerkt het als commitment of reflectie afhankelijk van de `awaiting_reflection` status.

---

## 5. Checklist nieuwe user

- [ ] Rij aangemaakt in `users` tabel
- [ ] `whatsapp_number` ingevuld met `whatsapp:+31...` formaat
- [ ] User heeft het Twilio sandbox nummer opgeslagen in WhatsApp
- [ ] User heeft "join [sandbox-code]" gestuurd naar Twilio (sandbox vereiste)
- [ ] Test via Vercel Crons → Run morning-checkin
