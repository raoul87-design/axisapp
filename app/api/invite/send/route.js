import { NextResponse } from "next/server"

export async function POST(request) {
  const { to, name, inviteUrl, coachName } = await request.json()

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn("[invite/send] Geen RESEND_API_KEY — mail niet verstuurd")
    return NextResponse.json({ ok: true, fallback: true })
  }

  const html = `
<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 20px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#1a1a1a;border-radius:12px;overflow:hidden">
        <tr>
          <td style="background:#0a1a0f;padding:28px 40px;border-bottom:1px solid #1e3a1e">
            <p style="margin:0;color:#22c55e;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase">AXIS</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px">
            <h1 style="margin:0 0 16px;color:#fff;font-size:24px;font-weight:700">Je bent uitgenodigd 💪</h1>
            <p style="margin:0 0 24px;color:#888;font-size:15px;line-height:1.6">
              ${coachName ? `<strong style="color:#fff">${coachName}</strong> heeft je aangemeld voor AXIS.` : "Je coach heeft je aangemeld voor AXIS."}<br>
              ${name ? `Hoi ${name}, k` : "K"}lik op de knop hieronder om je account aan te maken. Je gegevens zijn al ingevuld.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 0 32px">
              <tr>
                <td style="background:#22c55e;border-radius:8px;padding:14px 28px">
                  <a href="${inviteUrl}" style="color:#000;font-size:15px;font-weight:700;text-decoration:none">Account aanmaken →</a>
                </td>
              </tr>
            </table>
            <p style="margin:0;color:#444;font-size:12px">Of kopieer deze link:<br><span style="color:#555;word-break:break-all">${inviteUrl}</span></p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #222">
            <p style="margin:0;color:#333;font-size:11px">AXIS — Dagelijkse accountability via WhatsApp</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "AXIS <noreply@axisapp.nl>",
        to: [to],
        subject: `Je coach heeft je aangemeld voor AXIS 💪`,
        html,
      }),
    })
    const data = await res.json()
    if (!res.ok) return NextResponse.json({ ok: false, error: data }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[invite/send] error:", err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
