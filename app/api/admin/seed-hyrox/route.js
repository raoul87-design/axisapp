import { supabaseAdmin } from "../../../../lib/supabase"

// POST /api/admin/seed-hyrox
// Creates the "Hyrox Race Simulation" workout template with all 8 stations
// in competition order, each preceded by a 1km run station.
export async function POST() {
  try {
    // Fetch the hyrox exercise IDs by name
    const STATION_NAMES = [
      "Hyrox Run",
      "SkiErg",
      "Hyrox Run",
      "Sled Push",
      "Hyrox Run",
      "Sled Pull",
      "Hyrox Run",
      "Burpee Broad Jump",
      "Hyrox Run",
      "Rowing",
      "Hyrox Run",
      "Farmers Carry",
      "Hyrox Run",
      "Sandbag Lunges",
      "Hyrox Run",
      "Wall Balls",
    ]

    const uniqueNames = [...new Set(STATION_NAMES)]
    const { data: oefeningen, error: oeErr } = await supabaseAdmin
      .from("oefeningen")
      .select("id, naam")
      .in("naam", uniqueNames)

    if (oeErr) return Response.json({ error: oeErr.message }, { status: 500 })

    const nameToId = Object.fromEntries((oefeningen || []).map(o => [o.naam, o.id]))
    const missing = uniqueNames.filter(n => !nameToId[n])
    if (missing.length) {
      return Response.json({ error: "Oefeningen niet gevonden", missing }, { status: 400 })
    }

    // Create (or reuse) the workout
    const { data: existing } = await supabaseAdmin
      .from("workouts")
      .select("id")
      .eq("naam", "Hyrox Race Simulation")
      .eq("visibility", "template")
      .maybeSingle()

    let workoutId = existing?.id
    if (!workoutId) {
      const { data: workout, error: wErr } = await supabaseAdmin
        .from("workouts")
        .insert({ naam: "Hyrox Race Simulation", dag_type: "hyrox", schema_type: "hyrox", visibility: "template", niveau: "Alle niveaus" })
        .select("id")
        .single()
      if (wErr) return Response.json({ error: wErr.message }, { status: 500 })
      workoutId = workout.id
    }

    // Clear existing oefeningen for idempotency
    await supabaseAdmin.from("workout_oefeningen").delete().eq("workout_id", workoutId)

    // Insert 16 entries: 8 runs + 8 stations alternating
    const oeRows = STATION_NAMES.map((naam, i) => ({
      workout_id:  workoutId,
      oefening_id: nameToId[naam],
      volgorde:    i + 1,
      sets:        1,
      reps:        0,
    }))

    const { error: insErr } = await supabaseAdmin.from("workout_oefeningen").insert(oeRows)
    if (insErr) return Response.json({ error: insErr.message }, { status: 500 })

    return Response.json({ success: true, workoutId, stations: oeRows.length })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
