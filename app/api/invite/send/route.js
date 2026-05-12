import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

function buildTransporter() {
  const user = process.env.BREVO_SMTP_USER
  const pass = process.env.BREVO_SMTP_PASS

  if (!user || !pass) {
    return null
  }

  return nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: { user, pass },
  })
}

export async function POST(request) {
  const { to, name, inviteUrl, coachName } = await request.json()

  console.log("[invite/send] Route aangeroepen", {
    to,
    hasUser: !!process.env.BREVO_SMTP_USER,
    hasPass: !!process.env.BREVO_SMTP_PASS,
    hasFrom: !!process.env.BREVO_FROM,
  })

  const transporter = buildTransporter()
  if (!transporter) {
    console.warn("[invite/send] Geen BREVO_SMTP_USER of BREVO_SMTP_PASS — mail niet verstuurd")
    return NextResponse.json({ ok: true, fallback: true })
  }

  const from = process.env.BREVO_FROM || "AXIS <noreply@axisapp.nl>"

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

  console.log("[invite/send] Nodemailer transporter aangemaakt, verbinding maken met Brevo...")

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: "Je coach heeft je aangemeld voor AXIS 💪",
      html,
    })
    console.log("[invite/send] Verstuurd naar", to)
    console.log("[invite/send] SMTP response:", {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected,
      envelope: info.envelope,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(`[invite/send] SMTP fout bij versturen naar ${to}:`, err.message)
    console.error("[invite/send] SMTP fout details:", {
      code: err.code,
      command: err.command,
      responseCode: err.responseCode,
      response: err.response,
    })
    console.error("[invite/send] Stack:", err.stack)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
