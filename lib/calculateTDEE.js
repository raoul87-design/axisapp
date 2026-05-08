const ACTIVITY_MULTIPLIERS = {
  sedentary:        1.2,
  lightly_active:   1.375,
  moderately_active: 1.55,
  very_active:      1.725,
}

/**
 * @param {{ weight_kg: number, height_cm: number, age: number, gender: 'male'|'female', activity_level: string }} params
 * @returns {{ tdee: number, bmr: number, eiwitten: number, koolhydraten: number, vetten: number }}
 */
export function calculateTDEE({ weight_kg, height_cm, age, gender, activity_level }) {
  const bmr =
    gender === "male"
      ? 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
      : 10 * weight_kg + 6.25 * height_cm - 5 * age - 161

  const multiplier = ACTIVITY_MULTIPLIERS[activity_level] ?? 1.2
  const tdee = Math.round(bmr * multiplier)

  return {
    tdee,
    bmr:          Math.round(bmr),
    eiwitten:     Math.round((tdee * 0.30) / 4),
    koolhydraten: Math.round((tdee * 0.40) / 4),
    vetten:       Math.round((tdee * 0.30) / 9),
  }
}
