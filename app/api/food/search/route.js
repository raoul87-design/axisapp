function mapProduct(p) {
  const n = p.nutriments
  const kcalPer100 = n["energy-kcal_100g"] || n["energy-kcal"] || 0
  return {
    name:         p.product_name || "",
    brand:        p.brands || "",
    image:        p.image_front_thumb_url || p.image_url || "",
    portie:       100,
    kcal:         Math.round(kcalPer100),
    eiwitten:     Math.round((n["proteins_100g"]      || 0) * 10) / 10,
    koolhydraten: Math.round((n["carbohydrates_100g"] || 0) * 10) / 10,
    vetten:       Math.round((n["fat_100g"]           || 0) * 10) / 10,
    source:       "OPEN FOOD FACTS",
  }
}

async function fetchWithTimeout(url, timeout = 8000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, { headers: { "User-Agent": "AXIS-App/1.0" }, signal: controller.signal })
    clearTimeout(timer)
    return res
  } catch (err) {
    clearTimeout(timer)
    throw err
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.trim()
  if (!q || q.length < 2) return Response.json({ products: [] })

  try {
    // Barcode lookup (8–13 digits)
    if (/^\d{8,13}$/.test(q)) {
      try {
        const res = await fetchWithTimeout(`https://world.openfoodfacts.org/api/v0/product/${q}.json`)
        const data = await res.json()
        if (data.status === 1 && data.product?.nutriments) {
          return Response.json({ products: [mapProduct(data.product)] })
        }
      } catch {}
      return Response.json({ products: [] })
    }

    // Text search — try NL first, fall back to global
    const searchOFF = async (extraParams) => {
      try {
        const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&fields=product_name,nutriments,brands,image_front_thumb_url,image_url&page_size=10${extraParams}`
        const res = await fetchWithTimeout(url)
        const d = await res.json()
        return (d.products || []).filter(p => p.product_name && p.nutriments)
      } catch {
        return null  // null = timeout/error, [] = no results
      }
    }

    let raw = await searchOFF("&lc=nl&cc=nl")
    if (!raw || raw.length === 0) raw = await searchOFF("")

    if (raw === null) {
      return Response.json({ products: [], error: "timeout" })
    }

    return Response.json({ products: raw.slice(0, 10).map(mapProduct) })
  } catch (err) {
    console.error("[food/search] error:", err.message)
    return Response.json({ products: [], error: "timeout" })
  }
}
