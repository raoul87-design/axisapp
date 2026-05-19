export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")
  if (!q || q.length < 2) return Response.json({ products: [] })

  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&lc=nl&fields=product_name,nutriments,serving_size,brands&page_size=15`
    const res = await fetch(url, { headers: { "User-Agent": "AXIS-App/1.0" } })
    const data = await res.json()

    const products = (data.products || [])
      .filter(p => p.product_name && p.nutriments)
      .slice(0, 10)
      .map(p => {
        const n = p.nutriments
        const kcalPer100 = n["energy-kcal_100g"] || n["energy-kcal"] || 0
        const eiwitPer100 = n["proteins_100g"] || 0
        const koolhPer100 = n["carbohydrates_100g"] || 0
        const vetPer100   = n["fat_100g"] || 0
        const portie = 100
        return {
          name:         p.product_name,
          brand:        p.brands || "",
          portie,
          kcal:         Math.round(kcalPer100 * portie / 100),
          eiwitten:     Math.round(eiwitPer100 * portie / 100 * 10) / 10,
          koolhydraten: Math.round(koolhPer100 * portie / 100 * 10) / 10,
          vetten:       Math.round(vetPer100   * portie / 100 * 10) / 10,
          source:       "OPEN FOOD FACTS",
        }
      })

    return Response.json({ products })
  } catch (err) {
    console.error("[food/search] error:", err.message)
    return Response.json({ products: [] })
  }
}
