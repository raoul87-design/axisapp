export function normalizeWhatsapp(raw) {
  if (!raw) return null
  let num = raw.startsWith("whatsapp:") ? raw.slice(9) : raw
  const hasPlus = num.startsWith("+")
  num = (hasPlus ? "+" : "") + num.replace(/\D/g, "")
  if (num.startsWith("0"))                                 num = "+31" + num.slice(1)
  else if (!num.startsWith("+") && num.startsWith("31"))   num = "+" + num
  return "whatsapp:" + num
}
