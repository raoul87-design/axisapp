import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  "https://zdqrrprjkddlxszmtcmx.supabase.co",
  process.env.SUPABASE_SERVICE_KEY || "sb_publishable__cdXODEiCbsHvycy6uuB_g_SIIgI6YH"
)

// ── Oefeningen bibliotheek ─────────────────────────────────────
const OEFENINGEN = [
  // LICHAAMSGEWICHT — PUSH
  { naam: "Push-up", naam_en: "Push Up", niveau: "lichaamsgewicht", spiergroep: "borst, triceps, schouders", dag_type: "push", schema_type: "alle", youtube_url: "https://www.youtube.com/watch?v=IODxDxX7oi4", instructies: ["Begin in plankpositie, handen schouderbreedte", "Laat borst langzaam naar de grond", "Duw jezelf terug omhoog", "Houd lichaam recht als een plank"], fouten: ["Heupen zakken door", "Ellebogen te wijd", "Niet volledig uitstrekken"] },
  { naam: "Pike Push-up", naam_en: "Pike Push Up", niveau: "lichaamsgewicht", spiergroep: "schouders, triceps", dag_type: "push", schema_type: "alle", youtube_url: "https://www.youtube.com/watch?v=sposDXWEB0A", instructies: ["Begin in downward dog positie", "Heupen omhoog, hoofd tussen armen", "Buig ellebogen naar de grond", "Duw terug omhoog"], fouten: ["Heupen zakken tijdens beweging", "Te snel bewegen"] },
  { naam: "Dips op stoel", naam_en: "Chair Dips", niveau: "lichaamsgewicht", spiergroep: "triceps, borst", dag_type: "push", schema_type: "alle", youtube_url: "https://www.youtube.com/watch?v=0326dy_-CzM", instructies: ["Handen op rand van stevige stoel", "Benen gestrekt voor je", "Zak tot 90 graden elleboog", "Duw terug omhoog"], fouten: ["Te diep zakken", "Schouders optrekken"] },
  { naam: "Plank", naam_en: "Plank", niveau: "lichaamsgewicht", spiergroep: "core, schouders", dag_type: "core", schema_type: "alle", youtube_url: "https://www.youtube.com/watch?v=pSHjTRCQxIw", instructies: ["Onderarmen op de grond", "Lichaam recht van hoofd tot hielen", "Adem rustig door", "Billen niet omhoog of omlaag"], fouten: ["Heupen te hoog", "Nek vooruit steken"] },
  // LICHAAMSGEWICHT — PULL
  { naam: "Tafelrij", naam_en: "Australian Pull-up", niveau: "lichaamsgewicht", spiergroep: "rug, biceps", dag_type: "pull", schema_type: "alle", youtube_url: "https://www.youtube.com/watch?v=hVEEE8YFVWY", instructies: ["Lig onder stevige tafel", "Grijp rand schouderbreedte", "Trek borst naar de tafelrand", "Laat gecontroleerd zakken"], fouten: ["Heupen zakken door", "Niet volledig uitrekken onderaan"] },
  { naam: "Superman", naam_en: "Superman", niveau: "lichaamsgewicht", spiergroep: "onderrug, billen", dag_type: "pull", schema_type: "alle", youtube_url: "https://www.youtube.com/watch?v=cc6UVRS7PW4", instructies: ["Lig op je buik, armen gestrekt", "Hef tegelijk armen en benen", "Houd 2 seconden vast", "Laat gecontroleerd zakken"], fouten: ["Nek te ver achterover", "Te snel bewegen"] },
  { naam: "Dead Bug", naam_en: "Dead Bug", niveau: "lichaamsgewicht", spiergroep: "core, stabiliteit", dag_type: "core", schema_type: "alle", youtube_url: "https://www.youtube.com/watch?v=g_BYB0R-4Ws", instructies: ["Lig op rug, armen omhoog", "Knieën 90 graden in de lucht", "Strek rechterarm en linkerbeen", "Wissel af, rug blijft op de grond"], fouten: ["Onderrug komt van de grond", "Beweging te snel"] },
  // LICHAAMSGEWICHT — LEGS
  { naam: "Air Squat", naam_en: "Air Squat", niveau: "lichaamsgewicht", spiergroep: "quadriceps, billen", dag_type: "legs", schema_type: "alle", youtube_url: "https://www.youtube.com/watch?v=aclHkVaku9U", instructies: ["Voeten schouderbreedte, tenen licht naar buiten", "Borst omhoog, rug recht", "Zak tot dijen parallel aan grond", "Duw door hielen terug omhoog"], fouten: ["Hielen komen van de grond", "Knieën zakken naar binnen", "Niet diep genoeg"] },
  { naam: "Lunge", naam_en: "Bodyweight Lunge", niveau: "lichaamsgewicht", spiergroep: "quadriceps, billen, hamstrings", dag_type: "legs", schema_type: "alle", youtube_url: "https://www.youtube.com/watch?v=QOVaHwm-Q6U", instructies: ["Sta rechtop, voeten bij elkaar", "Grote stap vooruit", "Achterste knie bijna de grond", "Duw terug naar beginpositie"], fouten: ["Voorste knie voorbij de teen", "Romp voorover kantelen"] },
  { naam: "Glute Bridge", naam_en: "Glute Bridge", niveau: "lichaamsgewicht", spiergroep: "billen, hamstrings", dag_type: "legs", schema_type: "alle", youtube_url: "https://www.youtube.com/watch?v=OUgsJ8-Vi0E", instructies: ["Lig op rug, knieën gebogen", "Voeten plat op de grond", "Duw heupen omhoog", "Knijp billen samen bovenaan"], fouten: ["Niet volledig uitstrekken", "Heupen te snel laten zakken"] },
  { naam: "Mountain Climber", naam_en: "Mountain Climber", niveau: "lichaamsgewicht", spiergroep: "core, schouders, conditie", dag_type: "core", schema_type: "alle", youtube_url: "https://www.youtube.com/watch?v=nmwgirgXLYM", instructies: ["Begin in plankpositie", "Trek afwisselend knieën naar borst", "Houd heupen laag", "Tempo bepaalt intensiteit"], fouten: ["Heupen te hoog", "Schouders boven de handen"] },
  { naam: "Calf Raise", naam_en: "Calf Raise", niveau: "lichaamsgewicht", spiergroep: "kuiten", dag_type: "legs", schema_type: "alle", youtube_url: "https://www.youtube.com/watch?v=-M4-G8p1fCI", instructies: ["Sta op de rand van een traptrede", "Hielen zo laag mogelijk", "Duw omhoog op je tenen", "Gecontroleerd terug zakken"], fouten: ["Te snel bewegen", "Niet volledig uitstrekken"] },
  // HOME GYM — PUSH
  { naam: "Dumbbell Chest Press", naam_en: "Dumbbell Chest Press", niveau: "homegym", spiergroep: "borst, triceps, schouders", dag_type: "push", schema_type: "alle", youtube_url: "https://www.youtube.com/watch?v=VmB1G1K7v94", instructies: ["Lig op grond of bank", "Dumbbells op borsthoogte", "Druk omhoog tot armen gestrekt", "Laat gecontroleerd zakken"], fouten: ["Ellebogen te wijd", "Gewicht laten vallen"] },
  { naam: "Dumbbell Shoulder Press", naam_en: "Dumbbell Shoulder Press", niveau: "homegym", spiergroep: "schouders, triceps", dag_type: "push", schema_type: "alle", youtube_url: "https://www.youtube.com/watch?v=qEwKCR5JCog", instructies: ["Zittend of staand", "Dumbbells op schouderhoogte", "Druk omhoog boven het hoofd", "Laat gecontroleerd zakken"], fouten: ["Rug hol trekken", "Ellebogen te ver naar voren"] },
  { naam: "Lateral Raise", naam_en: "Lateral Raise", niveau: "homegym", spiergroep: "schouders", dag_type: "push", schema_type: "alle", youtube_url: "https://www.youtube.com/watch?v=3VcKaXpzqRo", instructies: ["Licht gebogen ellebogen", "Hef armen zijwaarts tot schouderhoogte", "Gecontroleerd omlaag", "Geen schommelbeweging"], fouten: ["Te zware gewichten — schommelen", "Armen te hoog heffen"] },
  { naam: "Tricep Kickback", naam_en: "Tricep Kickback", niveau: "homegym", spiergroep: "triceps", dag_type: "push", schema_type: "alle", youtube_url: "https://www.youtube.com/watch?v=6SS6K3lAwZ8", instructies: ["Voorovergebogen, elleboog omhoog", "Strek arm volledig naar achter", "Elleboog blijft stil", "Gecontroleerd terug"], fouten: ["Elleboog beweegt mee", "Te zware gewichten"] },
  // HOME GYM — PULL
  { naam: "Dumbbell Row", naam_en: "Dumbbell Row", niveau: "homegym", spiergroep: "rug, biceps", dag_type: "pull", schema_type: "alle", youtube_url: "https://www.youtube.com/watch?v=roCP6wCXPqo", instructies: ["Knie en hand op bank", "Rug parallel aan de grond", "Trek elleboog naar het plafond", "Laat gecontroleerd zakken"], fouten: ["Romp draaien", "Elleboog te wijd"] },
  { naam: "Face Pull met weerstandsband", naam_en: "Face Pull with Resistance Band", niveau: "homegym", spiergroep: "schouders, rug", dag_type: "pull", schema_type: "alle", youtube_url: "https://www.youtube.com/watch?v=eIq5CB9JfKE", instructies: ["Band op ooghoogte bevestigen", "Trek band naar gezicht", "Ellebogen op schouderhoogte", "Gecontroleerd terug"], fouten: ["Ellebogen te laag", "Te snel bewegen"] },
  { naam: "Dumbbell Bicep Curl", naam_en: "Dumbbell Bicep Curl", niveau: "homegym", spiergroep: "biceps", dag_type: "pull", schema_type: "alle", youtube_url: "https://www.youtube.com/watch?v=ykJmrZ5v0Oo", instructies: ["Ellebogen stil aan je zij", "Curl omhoog naar schouder", "Knijp bovenaan", "Laat langzaam zakken"], fouten: ["Schommelen met romp", "Ellebogen bewegen mee"] },
  // HOME GYM — LEGS
  { naam: "Goblet Squat", naam_en: "Goblet Squat", niveau: "homegym", spiergroep: "quadriceps, billen, core", dag_type: "legs", schema_type: "alle", youtube_url: "https://www.youtube.com/watch?v=MeIiIdhvXT4", instructies: ["Dumbbell verticaal voor borst", "Voeten iets wijder dan schouders", "Zak diep door de knieën", "Duw terug omhoog"], fouten: ["Rug voorover kantelen", "Hielen van de grond"] },
  { naam: "Romanian Deadlift DB", naam_en: "Dumbbell Romanian Deadlift", niveau: "homegym", spiergroep: "hamstrings, billen, onderrug", dag_type: "legs", schema_type: "alle", youtube_url: "https://www.youtube.com/watch?v=JCXUYuzwNrM", instructies: ["Dumbbells voor dijen", "Heupen naar achter schuiven", "Rug recht blijven", "Voel rek in hamstrings"], fouten: ["Rug afronden", "Knieën te ver buigen"] },
  { naam: "Dumbbell Lunge", naam_en: "Dumbbell Lunge", niveau: "homegym", spiergroep: "quadriceps, billen", dag_type: "legs", schema_type: "alle", youtube_url: "https://www.youtube.com/watch?v=D7KaRcUTQeE", instructies: ["Dumbbells in beide handen", "Grote stap vooruit", "Achterste knie naar de grond", "Duw terug naar start"], fouten: ["Romp voorover", "Knie voorbij teen"] },
  { naam: "Glute Bridge met Dumbbell", naam_en: "Glute Bridge with Dumbbell", niveau: "homegym", spiergroep: "billen, hamstrings", dag_type: "legs", schema_type: "alle", youtube_url: "https://www.youtube.com/watch?v=8bbE64NuDTU", instructies: ["Lig op rug, dumbbell op heupen", "Voeten plat op de grond", "Duw heupen omhoog", "Knijp billen samen bovenaan"], fouten: ["Dumbbell niet goed vasthouden", "Niet volledig uitstrekken"] },
  // GYM — PUSH
  { naam: "Bench Press", naam_en: "Bench Press", niveau: "gym", spiergroep: "borst, triceps, schouders", dag_type: "push", schema_type: "alle", youtube_url: "https://www.youtube.com/watch?v=rT7DgCr-3pg", instructies: ["Voeten plat op de grond", "Schouderbladen samen en omlaag", "Stang naar borst laten zakken", "Duw omhoog in een lichte boog"], fouten: ["Hielen van de grond", "Stang te hoog op de borst", "Polsen achterover buigen"] },
  { naam: "Incline Dumbbell Press", naam_en: "Incline Dumbbell Press", niveau: "gym", spiergroep: "bovenborst, schouders", dag_type: "push", schema_type: "alle", youtube_url: "https://www.youtube.com/watch?v=8iPEnn-ltC8", instructies: ["Bank op 30-45 graden", "Dumbbells op borsthoogte", "Druk omhoog en iets naar binnen", "Gecontroleerd zakken"], fouten: ["Bank te steil — wordt shoulder press", "Ellebogen te wijd"] },
  { naam: "Cable Lateral Raise", naam_en: "Cable Lateral Raise", niveau: "gym", spiergroep: "schouders", dag_type: "push", schema_type: "alle", youtube_url: "https://www.youtube.com/watch?v=PPjO6p_JU4E", instructies: ["Kabel op laagste stand", "Hef arm zijwaarts tot schouder", "Gecontroleerd terug", "Licht gebogen elleboog"], fouten: ["Te zwaar gewicht", "Schommelen met lichaam"] },
  { naam: "Tricep Pushdown", naam_en: "Tricep Pushdown", niveau: "gym", spiergroep: "triceps", dag_type: "push", schema_type: "alle", youtube_url: "https://www.youtube.com/watch?v=2-LAMcpzODU", instructies: ["Kabel op hoogste stand", "Ellebogen stil aan je zij", "Druk omlaag tot armen gestrekt", "Gecontroleerd terug"], fouten: ["Ellebogen bewegen mee", "Voorover leunen"] },
  { naam: "Overhead Tricep Extension", naam_en: "Overhead Tricep Extension", niveau: "gym", spiergroep: "triceps", dag_type: "push", schema_type: "alle", youtube_url: "https://www.youtube.com/watch?v=YbX7Wd8jQ-Q", instructies: ["Dumbbell of kabel achter hoofd", "Ellebogen wijzen naar plafond", "Strek armen omhoog", "Gecontroleerd zakken"], fouten: ["Ellebogen te wijd gaan", "Rug hol trekken"] },
  // GYM — PULL
  { naam: "Deadlift", naam_en: "Deadlift", niveau: "gym", spiergroep: "rug, billen, hamstrings, benen", dag_type: "pull", schema_type: "alle", youtube_url: "https://www.youtube.com/watch?v=op9kVnSso6Q", instructies: ["Voeten heupbreedte, stang over veters", "Grijp stang schouderbreedte", "Rug recht, borst omhoog", "Duw de grond van je af — stang langs het lichaam omhoog"], fouten: ["Rug afronden — gevaarlijk", "Stang te ver van lichaam", "Heupen te laag — wordt een squat"] },
  { naam: "Cable Row", naam_en: "Seated Cable Row", niveau: "gym", spiergroep: "rug, biceps", dag_type: "pull", schema_type: "alle", youtube_url: "https://www.youtube.com/watch?v=GZbfZ033f74", instructies: ["Zittend, borst recht", "Trek handgreep naar buikknop", "Ellebogen langs het lichaam", "Gecontroleerd terug uitstrekken"], fouten: ["Met romp schommelen", "Niet volledig uitstrekken"] },
  { naam: "Lat Pulldown", naam_en: "Lat Pulldown", niveau: "gym", spiergroep: "rug, biceps", dag_type: "pull", schema_type: "alle", youtube_url: "https://www.youtube.com/watch?v=CAwf7n6Luuc", instructies: ["Wijd grip, iets achteroverleunen", "Trek stang naar borst", "Ellebogen naar de grond", "Gecontroleerd terug omhoog"], fouten: ["Te ver achteroverleunen", "Stang achter het hoofd trekken"] },
  { naam: "Face Pull kabel", naam_en: "Cable Face Pull", niveau: "gym", spiergroep: "achterste schouder, rug", dag_type: "pull", schema_type: "alle", youtube_url: "https://www.youtube.com/watch?v=eIq5CB9JfKE", instructies: ["Kabel op ooghoogte", "Touwgreep, palmen naar beneden", "Trek naar gezicht, ellebogen hoog", "Externe rotatie bovenaan"], fouten: ["Ellebogen te laag", "Te zwaar gewicht"] },
  { naam: "Barbell Curl", naam_en: "Barbell Curl", niveau: "gym", spiergroep: "biceps", dag_type: "pull", schema_type: "alle", youtube_url: "https://www.youtube.com/watch?v=kwG2ipFRgfo", instructies: ["Schouderbreedte grip", "Ellebogen stil aan zij", "Curl omhoog naar schouders", "Gecontroleerd zakken"], fouten: ["Schommelen met romp", "Ellebogen naar voren bewegen"] },
  // GYM — LEGS
  { naam: "Barbell Squat", naam_en: "Barbell Squat", niveau: "gym", spiergroep: "quadriceps, billen, core", dag_type: "legs", schema_type: "alle", youtube_url: "https://www.youtube.com/watch?v=bEv6CCg2BC8", instructies: ["Stang op bovenste rug", "Voeten schouderbreedte", "Zak tot dijen parallel", "Duw door hielen omhoog"], fouten: ["Knieën naar binnen", "Romp te ver voorover", "Hielen van de grond"] },
  { naam: "Romanian Deadlift Barbell", naam_en: "Barbell Romanian Deadlift", niveau: "gym", spiergroep: "hamstrings, billen", dag_type: "legs", schema_type: "alle", youtube_url: "https://www.youtube.com/watch?v=2SHsk9AzdjA", instructies: ["Stang voor dijen", "Heupen naar achter schuiven", "Rug recht, voel rek in hamstrings", "Heupen vooruit terug naar start"], fouten: ["Rug afronden", "Knieën te ver buigen"] },
  { naam: "Leg Press", naam_en: "Leg Press", niveau: "gym", spiergroep: "quadriceps, billen", dag_type: "legs", schema_type: "alle", youtube_url: "https://www.youtube.com/watch?v=IZxyjW7MPJQ", instructies: ["Voeten schouderbreedte op platform", "Knieën buigen tot 90 graden", "Duw platform weg", "Vergrendeling niet volledig openen"], fouten: ["Knieën naar binnen", "Rug van de stoel komen"] },
  { naam: "Walking Lunge", naam_en: "Walking Lunge", niveau: "gym", spiergroep: "quadriceps, billen", dag_type: "legs", schema_type: "alle", youtube_url: "https://www.youtube.com/watch?v=L8fvypPrzzs", instructies: ["Dumbbells of barbell op rug", "Grote stap vooruit", "Achterste knie naar de grond", "Stap door naar volgende lunge"], fouten: ["Te kleine stappen", "Romp voorover"] },
  { naam: "Cable Crunch", naam_en: "Cable Crunch", niveau: "gym", spiergroep: "core, buik", dag_type: "core", schema_type: "alle", youtube_url: "https://www.youtube.com/watch?v=2fbujeH3F0E", instructies: ["Knielen voor kabel", "Touw achter hoofd", "Crunch naar beneden", "Heupen blijven stil"], fouten: ["Met heupen bewegen", "Nek trekken"] },
  // GYM — SHOULDERS (for gym full body)
  { naam: "Shoulder Press", naam_en: "Barbell Shoulder Press", niveau: "gym", spiergroep: "schouders, triceps", dag_type: "push", schema_type: "alle", youtube_url: "https://www.youtube.com/watch?v=2yjwXTZQDDI", instructies: ["Stang of dumbbells op schouderhoogte", "Zittend, rug recht", "Druk omhoog boven hoofd", "Gecontroleerd zakken"], fouten: ["Rug hol trekken", "Polsen achterover buigen"] },
]

// ── Standaard workouts definitie ───────────────────────────────
const WORKOUTS_DATA = [
  // FULL BODY
  { naam: "Lichaamsgewicht Full Body A", niveau: "lichaamsgewicht", schema_type: "full_body", dag_type: "full", beschrijving: "Effectieve full body workout zonder materiaal", oefeningen: [{ naam: "Push-up", sets: 3, reps: "10-15", rust: 60 }, { naam: "Tafelrij", sets: 3, reps: "10-12", rust: 60 }, { naam: "Air Squat", sets: 3, reps: "15-20", rust: 60 }, { naam: "Glute Bridge", sets: 3, reps: "15", rust: 60 }, { naam: "Plank", sets: 3, reps: "30s", rust: 45 }, { naam: "Dead Bug", sets: 3, reps: "10", rust: 45 }] },
  { naam: "Lichaamsgewicht Full Body B", niveau: "lichaamsgewicht", schema_type: "full_body", dag_type: "full", beschrijving: "Variatie op full body workout", oefeningen: [{ naam: "Pike Push-up", sets: 3, reps: "8-12", rust: 60 }, { naam: "Superman", sets: 3, reps: "12", rust: 45 }, { naam: "Lunge", sets: 3, reps: "10 per been", rust: 60 }, { naam: "Mountain Climber", sets: 3, reps: "20 per been", rust: 45 }, { naam: "Dips op stoel", sets: 3, reps: "10", rust: 60 }, { naam: "Calf Raise", sets: 3, reps: "15", rust: 45 }] },
  { naam: "Home Gym Full Body A", niveau: "homegym", schema_type: "full_body", dag_type: "full", beschrijving: "Full body met dumbbells thuis", oefeningen: [{ naam: "Dumbbell Chest Press", sets: 3, reps: "10-12", rust: 90 }, { naam: "Dumbbell Row", sets: 3, reps: "10-12", rust: 90 }, { naam: "Goblet Squat", sets: 3, reps: "12-15", rust: 90 }, { naam: "Dumbbell Shoulder Press", sets: 3, reps: "10", rust: 90 }, { naam: "Glute Bridge met Dumbbell", sets: 3, reps: "15", rust: 60 }, { naam: "Dead Bug", sets: 3, reps: "10", rust: 45 }] },
  { naam: "Home Gym Full Body B", niveau: "homegym", schema_type: "full_body", dag_type: "full", beschrijving: "Variatie full body met dumbbells", oefeningen: [{ naam: "Dumbbell Chest Press", sets: 3, reps: "12", rust: 90 }, { naam: "Face Pull met weerstandsband", sets: 3, reps: "15", rust: 60 }, { naam: "Romanian Deadlift DB", sets: 3, reps: "10", rust: 90 }, { naam: "Lateral Raise", sets: 3, reps: "12", rust: 60 }, { naam: "Dumbbell Lunge", sets: 3, reps: "10 per been", rust: 90 }, { naam: "Plank", sets: 3, reps: "45s", rust: 45 }] },
  { naam: "Gym Full Body A", niveau: "gym", schema_type: "full_body", dag_type: "full", beschrijving: "Compound full body in de gym", oefeningen: [{ naam: "Bench Press", sets: 3, reps: "8-10", rust: 120 }, { naam: "Cable Row", sets: 3, reps: "10-12", rust: 90 }, { naam: "Barbell Squat", sets: 3, reps: "8-10", rust: 120 }, { naam: "Shoulder Press", sets: 3, reps: "10", rust: 90 }, { naam: "Romanian Deadlift Barbell", sets: 3, reps: "10", rust: 90 }, { naam: "Face Pull kabel", sets: 3, reps: "15", rust: 60 }] },
  { naam: "Gym Full Body B", niveau: "gym", schema_type: "full_body", dag_type: "full", beschrijving: "Variatie compound full body", oefeningen: [{ naam: "Incline Dumbbell Press", sets: 3, reps: "10", rust: 90 }, { naam: "Lat Pulldown", sets: 3, reps: "10-12", rust: 90 }, { naam: "Leg Press", sets: 3, reps: "12", rust: 90 }, { naam: "Lateral Raise", sets: 3, reps: "12", rust: 60 }, { naam: "Walking Lunge", sets: 3, reps: "10 per been", rust: 90 }, { naam: "Cable Crunch", sets: 3, reps: "15", rust: 60 }] },
  // UPPER/LOWER
  { naam: "Lichaamsgewicht Upper", niveau: "lichaamsgewicht", schema_type: "upper_lower", dag_type: "upper", beschrijving: "Bovenlichaam workout zonder materiaal", oefeningen: [{ naam: "Push-up", sets: 4, reps: "12-15", rust: 60 }, { naam: "Tafelrij", sets: 4, reps: "10-12", rust: 60 }, { naam: "Pike Push-up", sets: 3, reps: "10", rust: 60 }, { naam: "Superman", sets: 3, reps: "12", rust: 45 }, { naam: "Dead Bug", sets: 3, reps: "10", rust: 45 }, { naam: "Dips op stoel", sets: 3, reps: "12", rust: 60 }] },
  { naam: "Lichaamsgewicht Lower", niveau: "lichaamsgewicht", schema_type: "upper_lower", dag_type: "lower", beschrijving: "Onderlichaam workout zonder materiaal", oefeningen: [{ naam: "Air Squat", sets: 4, reps: "15-20", rust: 60 }, { naam: "Lunge", sets: 3, reps: "10 per been", rust: 60 }, { naam: "Glute Bridge", sets: 4, reps: "15", rust: 60 }, { naam: "Mountain Climber", sets: 3, reps: "20 per been", rust: 45 }, { naam: "Calf Raise", sets: 3, reps: "15", rust: 45 }] },
  { naam: "Home Gym Upper", niveau: "homegym", schema_type: "upper_lower", dag_type: "upper", beschrijving: "Bovenlichaam met dumbbells", oefeningen: [{ naam: "Dumbbell Chest Press", sets: 4, reps: "10-12", rust: 90 }, { naam: "Dumbbell Row", sets: 4, reps: "10-12", rust: 90 }, { naam: "Dumbbell Shoulder Press", sets: 3, reps: "10", rust: 90 }, { naam: "Face Pull met weerstandsband", sets: 3, reps: "15", rust: 60 }, { naam: "Dumbbell Bicep Curl", sets: 3, reps: "12", rust: 60 }, { naam: "Tricep Kickback", sets: 3, reps: "12", rust: 60 }] },
  { naam: "Home Gym Lower", niveau: "homegym", schema_type: "upper_lower", dag_type: "lower", beschrijving: "Onderlichaam met dumbbells", oefeningen: [{ naam: "Goblet Squat", sets: 4, reps: "12-15", rust: 90 }, { naam: "Romanian Deadlift DB", sets: 3, reps: "10", rust: 90 }, { naam: "Dumbbell Lunge", sets: 3, reps: "10 per been", rust: 90 }, { naam: "Glute Bridge met Dumbbell", sets: 4, reps: "15", rust: 60 }, { naam: "Calf Raise", sets: 3, reps: "15", rust: 45 }] },
  { naam: "Gym Upper", niveau: "gym", schema_type: "upper_lower", dag_type: "upper", beschrijving: "Bovenlichaam in de gym", oefeningen: [{ naam: "Bench Press", sets: 4, reps: "8-10", rust: 120 }, { naam: "Cable Row", sets: 4, reps: "10-12", rust: 90 }, { naam: "Lat Pulldown", sets: 3, reps: "10-12", rust: 90 }, { naam: "Shoulder Press", sets: 3, reps: "10", rust: 90 }, { naam: "Barbell Curl", sets: 3, reps: "10", rust: 60 }, { naam: "Tricep Pushdown", sets: 3, reps: "12", rust: 60 }] },
  { naam: "Gym Lower", niveau: "gym", schema_type: "upper_lower", dag_type: "lower", beschrijving: "Onderlichaam in de gym", oefeningen: [{ naam: "Barbell Squat", sets: 4, reps: "8", rust: 150 }, { naam: "Romanian Deadlift Barbell", sets: 3, reps: "10", rust: 120 }, { naam: "Leg Press", sets: 3, reps: "12", rust: 90 }, { naam: "Walking Lunge", sets: 3, reps: "10 per been", rust: 90 }, { naam: "Cable Crunch", sets: 3, reps: "15", rust: 60 }] },
  // PUSH/PULL/LEGS
  { naam: "Lichaamsgewicht Push", niveau: "lichaamsgewicht", schema_type: "push_pull_legs", dag_type: "push", beschrijving: "Duwende spieren bodyweight", oefeningen: [{ naam: "Push-up", sets: 3, reps: "10-15", rust: 60 }, { naam: "Pike Push-up", sets: 3, reps: "8-12", rust: 60 }, { naam: "Dips op stoel", sets: 3, reps: "10-12", rust: 60 }, { naam: "Plank", sets: 3, reps: "30-45s", rust: 45 }] },
  { naam: "Lichaamsgewicht Pull", niveau: "lichaamsgewicht", schema_type: "push_pull_legs", dag_type: "pull", beschrijving: "Trekkende spieren bodyweight", oefeningen: [{ naam: "Tafelrij", sets: 3, reps: "10-12", rust: 60 }, { naam: "Superman", sets: 3, reps: "12", rust: 45 }, { naam: "Dead Bug", sets: 3, reps: "10", rust: 45 }, { naam: "Calf Raise", sets: 3, reps: "15", rust: 45 }] },
  { naam: "Lichaamsgewicht Legs", niveau: "lichaamsgewicht", schema_type: "push_pull_legs", dag_type: "legs", beschrijving: "Beenspieren bodyweight", oefeningen: [{ naam: "Air Squat", sets: 3, reps: "15-20", rust: 60 }, { naam: "Lunge", sets: 3, reps: "10 per been", rust: 60 }, { naam: "Glute Bridge", sets: 3, reps: "15", rust: 60 }, { naam: "Mountain Climber", sets: 3, reps: "20 per been", rust: 45 }] },
  { naam: "Home Gym Push", niveau: "homegym", schema_type: "push_pull_legs", dag_type: "push", beschrijving: "Duwende spieren met dumbbells", oefeningen: [{ naam: "Dumbbell Chest Press", sets: 3, reps: "10-12", rust: 90 }, { naam: "Dumbbell Shoulder Press", sets: 3, reps: "10", rust: 90 }, { naam: "Lateral Raise", sets: 3, reps: "12", rust: 60 }, { naam: "Tricep Kickback", sets: 3, reps: "12", rust: 60 }] },
  { naam: "Home Gym Pull", niveau: "homegym", schema_type: "push_pull_legs", dag_type: "pull", beschrijving: "Trekkende spieren met dumbbells", oefeningen: [{ naam: "Dumbbell Row", sets: 3, reps: "10-12", rust: 90 }, { naam: "Face Pull met weerstandsband", sets: 3, reps: "15", rust: 60 }, { naam: "Dumbbell Bicep Curl", sets: 3, reps: "12", rust: 60 }, { naam: "Dead Bug", sets: 3, reps: "10", rust: 45 }] },
  { naam: "Home Gym Legs", niveau: "homegym", schema_type: "push_pull_legs", dag_type: "legs", beschrijving: "Beenspieren met dumbbells", oefeningen: [{ naam: "Goblet Squat", sets: 3, reps: "12-15", rust: 90 }, { naam: "Romanian Deadlift DB", sets: 3, reps: "10", rust: 90 }, { naam: "Dumbbell Lunge", sets: 3, reps: "10 per been", rust: 90 }, { naam: "Glute Bridge met Dumbbell", sets: 3, reps: "15", rust: 60 }] },
  { naam: "Gym Push", niveau: "gym", schema_type: "push_pull_legs", dag_type: "push", beschrijving: "Push dag in de gym", oefeningen: [{ naam: "Bench Press", sets: 4, reps: "8-10", rust: 120 }, { naam: "Incline Dumbbell Press", sets: 3, reps: "10", rust: 90 }, { naam: "Cable Lateral Raise", sets: 3, reps: "12", rust: 60 }, { naam: "Tricep Pushdown", sets: 3, reps: "12", rust: 60 }, { naam: "Overhead Tricep Extension", sets: 3, reps: "10", rust: 60 }] },
  { naam: "Gym Pull", niveau: "gym", schema_type: "push_pull_legs", dag_type: "pull", beschrijving: "Pull dag in de gym", oefeningen: [{ naam: "Deadlift", sets: 4, reps: "5-6", rust: 180 }, { naam: "Cable Row", sets: 3, reps: "10-12", rust: 90 }, { naam: "Lat Pulldown", sets: 3, reps: "10-12", rust: 90 }, { naam: "Face Pull kabel", sets: 3, reps: "15", rust: 60 }, { naam: "Barbell Curl", sets: 3, reps: "10", rust: 60 }] },
  { naam: "Gym Legs", niveau: "gym", schema_type: "push_pull_legs", dag_type: "legs", beschrijving: "Leg dag in de gym", oefeningen: [{ naam: "Barbell Squat", sets: 4, reps: "8", rust: 150 }, { naam: "Romanian Deadlift Barbell", sets: 3, reps: "10", rust: 120 }, { naam: "Leg Press", sets: 3, reps: "12", rust: 90 }, { naam: "Walking Lunge", sets: 3, reps: "10 per been", rust: 90 }, { naam: "Cable Crunch", sets: 3, reps: "15", rust: 60 }] },
]

export async function GET(request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const reset = searchParams.get("reset") === "true"
  const probe = searchParams.get("probe") === "true"
  const find  = searchParams.get("find")  === "true"

  if (probe) {
    if (!process.env.RAPIDAPI_KEY) return new Response("RAPIDAPI_KEY missing", { status: 500 })
    const res = await fetch(
      "https://exercisedb.p.rapidapi.com/exercises?limit=50&offset=0",
      { headers: { "x-rapidapi-host": "exercisedb.p.rapidapi.com", "x-rapidapi-key": process.env.RAPIDAPI_KEY } }
    )
    if (!res.ok) return new Response(`API ${res.status}`, { status: 502 })
    const list = await res.json()
    const sample = list.slice(0, 10).map(e => ({ id: e.id, name: e.name, bodyPart: e.bodyPart }))
    return new Response(JSON.stringify({ firstFull: list[0], sample, allNames: list.map(e => e.name) }, null, 2), {
      status: 200, headers: { "Content-Type": "application/json" },
    })
  }

  if (find) {
    if (!process.env.RAPIDAPI_KEY) return new Response("RAPIDAPI_KEY missing", { status: 500 })
    const TERMS = ["pushup", "shoulder press", "kickback", "face", "tricep", "crunch", "overhead press"]
    const out = {}
    for (const term of TERMS) {
      const res = await fetch(
        `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(term)}?limit=5`,
        { headers: { "x-rapidapi-host": "exercisedb.p.rapidapi.com", "x-rapidapi-key": process.env.RAPIDAPI_KEY } }
      )
      if (res.ok) {
        const data = await res.json()
        out[term] = (Array.isArray(data) ? data : []).slice(0, 3).map(e => ({ id: e.id, name: e.name }))
      } else {
        out[term] = `error ${res.status}`
      }
    }
    return new Response(JSON.stringify(out, null, 2), {
      status: 200, headers: { "Content-Type": "application/json" },
    })
  }

  const results = { oefeningen: 0, workouts: 0, links: 0, gifs: 0, gifErrors: [], errors: [] }

  try {
    // 0. Reset — verwijder alles zodat seed opnieuw kan draaien
    if (reset) {
      const { data: systemWorkouts } = await supabase
        .from("workouts").select("id").eq("coach_email", "system")
      const ids = (systemWorkouts || []).map(w => w.id)
      if (ids.length) await supabase.from("workout_oefeningen").delete().in("workout_id", ids)
      await supabase.from("workouts").delete().eq("coach_email", "system")
      await supabase.from("oefeningen").delete().neq("id", "00000000-0000-0000-0000-000000000000")
      results.reset = true
    }

    // 1. Seed oefeningen — alleen als tabel leeg is
    const { count: oeCount } = await supabase
      .from("oefeningen")
      .select("id", { count: "exact", head: true })

    if (oeCount === 0) {
      const { error: oeErr } = await supabase.from("oefeningen").insert(OEFENINGEN)
      if (oeErr) results.errors.push("Oefeningen: " + oeErr.message)
    } else {
      results.skipped = `oefeningen (${oeCount} al aanwezig)`
    }

    // 2. Fetch alle oefeningen voor naam→id map
    const { data: allOef } = await supabase.from("oefeningen").select("id, naam, naam_en, gif_url")
    const oefeningMap = {}
    ;(allOef || []).forEach(o => { oefeningMap[o.naam] = o.id })
    results.oefeningen = allOef?.length || 0

    // 2b. GIFs — zoek via /exercises/name/, haal id op, bouw URL zelf
    if (process.env.RAPIDAPI_KEY) {
      const SEARCH_TERMS = {
        "Push-up":                      "push-up",
        "Pike Push-up":                 "pike",
        "Dips op stoel":                "assisted chest dip",
        "Plank":                        "plank",
        "Tafelrij":                     "assisted hanging knee raise",
        "Superman":                     "superman",
        "Dead Bug":                     "dead bug",
        "Air Squat":                    "air squat",
        "Lunge":                        "lunge",
        "Glute Bridge":                 "glute bridge",
        "Mountain Climber":             "mountain climber",
        "Calf Raise":                   "calf raise",
        "Dumbbell Chest Press":         "dumbbell bench press",
        "Dumbbell Shoulder Press":      "dumbbell overhead press",
        "Lateral Raise":                "lateral raise",
        "Tricep Kickback":              "dumbbell kickback",
        "Dumbbell Row":                 "dumbbell bent over row",
        "Face Pull met weerstandsband": "face pull",
        "Dumbbell Bicep Curl":          "dumbbell bicep curl",
        "Goblet Squat":                 "dumbbell goblet squat",
        "Romanian Deadlift DB":         "romanian deadlift",
        "Dumbbell Lunge":               "dumbbell lunge",
        "Glute Bridge met Dumbbell":    "glute bridge",
        "Bench Press":                  "barbell bench press",
        "Incline Dumbbell Press":       "dumbbell incline press",
        "Cable Lateral Raise":          "cable lateral raise",
        "Tricep Pushdown":              "cable pushdown",
        "Overhead Tricep Extension":    "cable overhead extension",
        "Deadlift":                     "deadlift",
        "Cable Row":                    "cable seated row",
        "Lat Pulldown":                 "cable lat pulldown",
        "Face Pull kabel":              "face pull",
        "Barbell Curl":                 "barbell curl",
        "Barbell Squat":                "barbell squat",
        "Romanian Deadlift Barbell":    "romanian deadlift",
        "Leg Press":                    "leg press",
        "Walking Lunge":                "walking lunge",
        "Cable Crunch":                 "crunch",
        "Shoulder Press":               "barbell overhead press",
      }
      // Als zoekterm geen match geeft — gebruik gif van vergelijkbare oefening
      const FALLBACKS = {
        "Pike Push-up":                 "Push-up",
        "Face Pull met weerstandsband": "Face Pull kabel",
        "Face Pull kabel":              "Face Pull met weerstandsband",
      }

      const fetchGifId = async (term) => {
        const res = await fetch(
          `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(term)}?limit=1`,
          { headers: { "x-rapidapi-host": "exercisedb.p.rapidapi.com", "x-rapidapi-key": process.env.RAPIDAPI_KEY } }
        )
        if (!res.ok) return null
        const data = await res.json()
        return Array.isArray(data) && data[0]?.id ? data[0].id : null
      }

      for (const oe of (allOef || [])) {
        if (oe.gif_url) continue
        const term = SEARCH_TERMS[oe.naam]
        if (!term) { results.gifErrors.push(`no_term: ${oe.naam}`); continue }
        try {
          let exerciseId = await fetchGifId(term)

          // Fallback: zoek gif van vergelijkbare oefening
          if (!exerciseId && FALLBACKS[oe.naam]) {
            const fallbackNaam = FALLBACKS[oe.naam]
            const fallbackTerm = SEARCH_TERMS[fallbackNaam]
            if (fallbackTerm) exerciseId = await fetchGifId(fallbackTerm)
          }

          if (exerciseId) {
            await supabase.from("oefeningen").update({ gif_url: `https://v2.exercisedb.io/image/${exerciseId}` }).eq("id", oe.id)
            results.gifs++
          } else {
            results.gifErrors.push(`no_match: ${term}`)
          }
        } catch (e) {
          results.gifErrors.push(`err: ${e.message}`)
          break
        }
      }
    }

    // 3. Seed workouts — alleen als er nog geen system workouts zijn
    const { count: wCount } = await supabase
      .from("workouts")
      .select("id", { count: "exact", head: true })
      .eq("coach_email", "system")

    if (wCount === 0) {
      const workoutInserts = WORKOUTS_DATA.map(w => ({
        naam: w.naam,
        niveau: w.niveau,
        schema_type: w.schema_type,
        dag_type: w.dag_type,
        beschrijving: w.beschrijving || null,
        coach_email: "system",
        is_template: true,
      }))
      const { error: wErr } = await supabase.from("workouts").insert(workoutInserts)
      if (wErr) results.errors.push("Workouts: " + wErr.message)
    }

    // 4. Fetch alle workouts voor naam→id map
    const { data: allWorkouts } = await supabase
      .from("workouts")
      .select("id, naam")
      .eq("coach_email", "system")

    const workoutMap = {}
    ;(allWorkouts || []).forEach(w => { workoutMap[w.naam] = w.id })
    results.workouts = allWorkouts?.length || 0

    // 5. Seed workout_oefeningen (delete + re-insert voor idempotentie)
    const workoutIds = Object.values(workoutMap)
    if (workoutIds.length > 0) {
      await supabase.from("workout_oefeningen").delete().in("workout_id", workoutIds)
    }

    const linkInserts = []
    for (const w of WORKOUTS_DATA) {
      const workoutId = workoutMap[w.naam]
      if (!workoutId) continue
      w.oefeningen.forEach((oe, idx) => {
        const oefeningId = oefeningMap[oe.naam]
        if (!oefeningId) {
          results.errors.push(`Oefening niet gevonden: ${oe.naam} in ${w.naam}`)
          return
        }
        linkInserts.push({
          workout_id: workoutId,
          oefening_id: oefeningId,
          volgorde: idx + 1,
          sets: oe.sets,
          reps: oe.reps,
          rust_seconden: oe.rust || 60,
        })
      })
    }

    if (linkInserts.length > 0) {
      const { error: linkErr } = await supabase.from("workout_oefeningen").insert(linkInserts)
      if (linkErr) results.errors.push("Links: " + linkErr.message)
      else results.links = linkInserts.length
    }

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
