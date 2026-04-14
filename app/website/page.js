"use client"

import { useEffect } from "react"
import Link from "next/link"

const G = "#22c55e"
const BG = "#0f0f0f"
const CARD = "#111"
const BORDER = "#1e1e1e"
const TEXT = "#ffffff"
const SUB = "#888"
const MAX = 1100

// ── Helpers ───────────────────────────────────────────────────
function Section({ children, style = {} }) {
  return (
    <section style={{ padding: "96px 24px", maxWidth: MAX, margin: "0 auto", ...style }}>
      {children}
    </section>
  )
}

function Badge({ children }) {
  return (
    <span style={{ background: "#0a1a0f", color: G, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, padding: "4px 12px", borderRadius: 20, border: `1px solid #1a4d2a`, textTransform: "uppercase" }}>
      {children}
    </span>
  )
}

function PhoneFrame({ src, alt }) {
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <div style={{
        width: 220, border: "6px solid #2a2a2a", borderRadius: 32,
        overflow: "hidden", background: "#1a1a1a",
        boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px #333",
      }}>
        <div style={{ height: 20, background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 48, height: 4, background: "#333", borderRadius: 4 }} />
        </div>
        <img src={src} alt={alt} style={{ width: "100%", display: "block" }} />
      </div>
      <div style={{ position: "absolute", top: -16, right: -16, width: 32, height: 32, borderRadius: "50%", background: G, opacity: 0.15, filter: "blur(12px)" }} />
    </div>
  )
}

function ScreenFrame({ src, alt }) {
  return (
    <div style={{
      borderRadius: 14, overflow: "hidden", border: `1px solid ${BORDER}`,
      boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
      background: CARD, flexShrink: 0, maxWidth: 560, width: "100%"
    }}>
      <div style={{ height: 28, background: "#0a0a0a", display: "flex", alignItems: "center", padding: "0 14px", gap: 6 }}>
        {["#ff5f57","#ffbd2e","#28c840"].map(c => (
          <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
        ))}
      </div>
      <img src={src} alt={alt} style={{ width: "100%", display: "block" }} />
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────
export default function Website() {

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth"
    return () => { document.documentElement.style.scrollBehavior = "" }
  }, [])

  return (
    <div style={{ background: BG, color: TEXT, fontFamily: "system-ui, -apple-system, sans-serif", minHeight: "100vh" }}>
      <style>{`
        .nav-links a { color: ${SUB}; text-decoration: none; font-size: 14px; transition: color 0.15s; }
        .nav-links a:hover { color: ${TEXT}; }
        .btn-ghost { background: transparent; border: 1px solid #333; color: ${SUB}; padding: 10px 20px; border-radius: 8px; font-size: 14px; cursor: pointer; text-decoration: none; transition: border-color 0.15s, color 0.15s; display: inline-block; }
        .btn-ghost:hover { border-color: #555; color: ${TEXT}; }
        .btn-green { background: ${G}; color: #000; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; text-decoration: none; display: inline-block; transition: opacity 0.15s; border: none; }
        .btn-green:hover { opacity: 0.88; }
        .btn-green-outline { background: transparent; border: 1px solid ${G}; color: ${G}; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-block; transition: background 0.15s; }
        .btn-green-outline:hover { background: #0a1a0f; }
        .feature-card { background: ${CARD}; border: 1px solid ${BORDER}; border-radius: 14px; padding: 28px; flex: 1; min-width: 240px; }
        .step-card { background: ${CARD}; border: 1px solid ${BORDER}; border-radius: 14px; padding: 28px 24px; flex: 1; min-width: 180px; }
        .pricing-card { background: ${CARD}; border: 1px solid ${BORDER}; border-radius: 16px; padding: 36px; flex: 1; min-width: 260px; display: flex; flex-direction: column; gap: 20px; }
        .pricing-popular { border-color: ${G}; box-shadow: 0 0 0 1px ${G}22, 0 16px 48px rgba(34,197,94,0.08); }
        .check-item { display: flex; align-items: flex-start; gap: 10px; font-size: 14px; color: ${SUB}; line-height: 1.5; }
        @media (max-width: 768px) {
          .hero-grid { flex-direction: column !important; }
          .hero-phone { display: none !important; }
          .split-left { flex-direction: column !important; }
          .split-right { flex-direction: column-reverse !important; }
          .pricing-grid { flex-direction: column !important; }
          .steps-grid { flex-wrap: wrap !important; }
          .feature-grid { flex-direction: column !important; }
          .nav-links { display: none !important; }
        }
      `}</style>

      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(15,15,15,0.92)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: MAX, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <img src="/axis-logo.png" alt="AXIS" style={{ height: 32, display: "block", mixBlendMode: "screen" }} />
          <div className="nav-links" style={{ display: "flex", gap: 32 }}>
            <a href="#probleem">Over</a>
            <a href="#oplossing">Oplossing</a>
            <a href="#prijzen">Prijzen</a>
            <a href="#contact">Contact</a>
          </div>
          <Link href="/" className="btn-green" style={{ padding: "8px 20px", fontSize: 13 }}>Start gratis</Link>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────── */}
      <div style={{ maxWidth: MAX, margin: "0 auto", padding: "96px 24px 80px" }}>
        <div className="hero-grid" style={{ display: "flex", alignItems: "center", gap: 64 }}>

          <div style={{ flex: 1, minWidth: 0 }}>
            <Badge>Discipline systeem voor coaches</Badge>
            <h1 style={{ fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 800, lineHeight: 1.1, margin: "24px 0 20px", letterSpacing: "-0.02em" }}>
              Your clients know<br />
              <span style={{ color: G }}>what to do.</span>
            </h1>
            <p style={{ fontSize: 22, color: "#ccc", marginBottom: 12, fontWeight: 500 }}>
              Axis makes sure they actually do it.
            </p>
            <p style={{ fontSize: 16, color: SUB, marginBottom: 36, lineHeight: 1.7, maxWidth: 480 }}>
              A daily accountability system for personal trainers.<br />Built on WhatsApp and AI.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
              <Link href="/" className="btn-green">Start gratis</Link>
              <a href="#oplossing" className="btn-ghost">Bekijk hoe het werkt →</a>
            </div>
          </div>

          <div className="hero-phone" style={{ flexShrink: 0 }}>
            <PhoneFrame src="/screenshot-app.png" alt="AXIS app" />
          </div>

        </div>
      </div>

      {/* ── DIVIDER ─────────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${BORDER}` }} />

      {/* ── PROBLEEM ────────────────────────────────────────── */}
      <div id="probleem">
        <Section>
          <div style={{ maxWidth: 700 }}>
            <Badge>The problem</Badge>
            <h2 style={{ fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 800, margin: "20px 0 20px", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
              Most people know what to do.<br />
              <span style={{ color: SUB }}>They just don't do it consistently.</span>
            </h2>
            <p style={{ fontSize: 17, color: SUB, lineHeight: 1.8 }}>
              People want to get stronger, healthier or more focused. They know the steps. But consistency breaks down. Not because of motivation — but because there is no system that creates daily accountability, clear commitments and feedback when things get difficult.
            </p>
          </div>
        </Section>
      </div>

      {/* ── COACHING ────────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${BORDER}`, background: "#080808" }}>
        <Section>
          <div style={{ maxWidth: 700 }}>
            <Badge>The coach</Badge>
            <h2 style={{ fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 800, margin: "20px 0 20px", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
              That's why coaching exists.
            </h2>
            <p style={{ fontSize: 17, color: SUB, lineHeight: 1.8 }}>
              Coaches help people set goals and create direction. But even great coaches can't monitor their clients every day. Most of the real work happens between sessions. That's where consistency is won or lost.
            </p>
          </div>
        </Section>
      </div>

      {/* ── OPLOSSING ───────────────────────────────────────── */}
      <div id="oplossing" style={{ borderTop: `1px solid ${BORDER}` }}>
        <Section>
          <Badge>The solution</Badge>
          <h2 style={{ fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 800, margin: "20px 0 12px", letterSpacing: "-0.01em" }}>
            Axis fills the gap between sessions.
          </h2>
          <p style={{ color: SUB, fontSize: 16, marginBottom: 48, maxWidth: 560 }}>
            Three things that keep clients accountable every single day.
          </p>
          <div className="feature-grid" style={{ display: "flex", gap: 20 }}>
            {[
              { num: "01", title: "Daily commitment", desc: "Clients commit to what they will do today. One clear intention — set every morning via WhatsApp." },
              { num: "02", title: "Execution tracking", desc: "Axis checks whether commitments are executed. Streaks, missed days, and patterns — visible to the coach." },
              { num: "03", title: "AI reflection", desc: "When clients struggle, Axis helps them reflect and recover. Based on their personal progress, not generic advice." },
            ].map(f => (
              <div key={f.num} className="feature-card">
                <div style={{ fontSize: 11, color: G, fontWeight: 700, letterSpacing: 2, marginBottom: 16 }}>{f.num}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{f.title}</h3>
                <p style={{ color: SUB, fontSize: 14, lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* ── AXIS SYSTEEM ────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${BORDER}`, background: "#080808" }}>
        <Section>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <Badge>Het systeem</Badge>
            <h2 style={{ fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 800, margin: "20px 0 0", letterSpacing: "-0.01em" }}>
              The Axis Discipline System.
            </h2>
          </div>
          <div className="steps-grid" style={{ display: "flex", gap: 16 }}>
            {[
              { step: "Commit",  color: G,       desc: "Every morning, the client commits to one concrete goal for the day. Clear, specific, actionable." },
              { step: "Execute", color: "#60a5fa", desc: "The client works on their commitment throughout the day. Axis tracks whether they follow through." },
              { step: "Reflect", color: "#f59e0b", desc: "In the evening, Axis checks in. Did you do it? An honest answer drives the next step." },
              { step: "Recover", color: "#a78bfa", desc: "Missed a day? No problem. Axis helps you bounce back instead of spiraling. Progress over perfection." },
            ].map(s => (
              <div key={s.step} className="step-card">
                <div style={{ width: 36, height: 36, borderRadius: 8, background: s.color + "22", border: `1px solid ${s.color}44`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color }} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: s.color }}>{s.step}</h3>
                <p style={{ color: SUB, fontSize: 13, lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* ── WHATSAPP ────────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${BORDER}` }}>
        <Section>
          <div className="split-left" style={{ display: "flex", alignItems: "center", gap: 64 }}>
            <PhoneFrame src="/screenshot-whatsapp.png" alt="WhatsApp AI coach" />
            <div style={{ flex: 1 }}>
              <Badge>WhatsApp</Badge>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, margin: "20px 0 16px", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
                Discipline without<br />opening an app.
              </h2>
              <p style={{ color: SUB, fontSize: 16, lineHeight: 1.8 }}>
                Axis runs directly inside WhatsApp. Clients don't install anything. They simply respond. Daily.
              </p>
            </div>
          </div>
        </Section>
      </div>

      {/* ── DASHBOARD ───────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${BORDER}`, background: "#080808" }}>
        <Section>
          <div className="split-right" style={{ display: "flex", alignItems: "center", gap: 64 }}>
            <div style={{ flex: 1 }}>
              <Badge>Coach dashboard</Badge>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, margin: "20px 0 16px", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
                Coaches see<br />who executes.
              </h2>
              <p style={{ color: SUB, fontSize: 16, lineHeight: 1.8 }}>
                Axis gives coaches visibility into what happens between sessions. See which clients stay consistent. See who needs support. Spend less time chasing updates — and more time coaching.
              </p>
            </div>
            <ScreenFrame src="/screenshot-dashboard.png" alt="Coach dashboard" />
          </div>
        </Section>
      </div>

      {/* ── PRICING ─────────────────────────────────────────── */}
      <div id="prijzen" style={{ borderTop: `1px solid ${BORDER}` }}>
        <Section>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <Badge>Pricing</Badge>
            <h2 style={{ fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 800, margin: "20px 0 12px", letterSpacing: "-0.01em" }}>
              Simple, transparent pricing.
            </h2>
            <p style={{ color: SUB, fontSize: 16 }}>Choose the plan that fits your coaching business.</p>
          </div>

          <div className="pricing-grid" style={{ display: "flex", gap: 20, alignItems: "stretch" }}>

            {/* Starter */}
            <div className="pricing-card">
              <div>
                <p style={{ color: SUB, fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Starter</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 40, fontWeight: 800 }}>€99</span>
                  <span style={{ color: SUB, fontSize: 14 }}>/maand</span>
                </div>
                <p style={{ color: SUB, fontSize: 13, marginBottom: 24 }}>Up to 15 clients</p>
                <p style={{ color: "#ccc", fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>Perfect for independent coaches just getting started.</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                {["Daily WhatsApp check-ins, morning and evening", "Clients commit to their goal every day", "AI coach responds based on progress", "Streak & missed days tracking", "Basic client overview — streak and status per client"].map(f => (
                  <div key={f} className="check-item">
                    <span style={{ color: G, flexShrink: 0 }}>✓</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <Link href="/" className="btn-ghost" style={{ textAlign: "center", display: "block", marginTop: 8 }}>Choose this plan</Link>
            </div>

            {/* Growth */}
            <div className="pricing-card pricing-popular" style={{ position: "relative" }}>
              <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)" }}>
                <span style={{ background: G, color: "#000", fontSize: 11, fontWeight: 700, padding: "3px 14px", borderRadius: 20, letterSpacing: 1, textTransform: "uppercase" }}>Popular</span>
              </div>
              <div>
                <p style={{ color: G, fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Growth</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 40, fontWeight: 800 }}>€299</span>
                  <span style={{ color: SUB, fontSize: 14 }}>/maand</span>
                </div>
                <p style={{ color: SUB, fontSize: 13, marginBottom: 24 }}>Up to 50 clients</p>
                <p style={{ color: "#ccc", fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>For coaches who want visibility and a partner to get started.</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                {["Everything from Starter", "Full coach dashboard with weekly progress", "Client insights — consistency, volume and risk signals", "WhatsApp support from the Axis team", "Onboarding help for your first clients"].map(f => (
                  <div key={f} className="check-item">
                    <span style={{ color: G, flexShrink: 0 }}>✓</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <Link href="/" className="btn-green" style={{ textAlign: "center", display: "block", marginTop: 8 }}>Choose this plan</Link>
            </div>

            {/* Pro */}
            <div className="pricing-card">
              <div>
                <p style={{ color: SUB, fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Pro</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 40, fontWeight: 800 }}>€699</span>
                  <span style={{ color: SUB, fontSize: 14 }}>/maand</span>
                </div>
                <p style={{ color: SUB, fontSize: 13, marginBottom: 24 }}>Up to 150 clients</p>
                <p style={{ color: "#ccc", fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>For gyms and coaching businesses that want Axis under their own name.</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                {["Everything from Starter and Growth", "White label — your name, your brand", "Custom branding on all client messages", "Multiple coach accounts", "VIP support"].map(f => (
                  <div key={f} className="check-item">
                    <span style={{ color: G, flexShrink: 0 }}>✓</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <button disabled style={{ textAlign: "center", display: "block", width: "100%", padding: "12px", borderRadius: 8, background: "#1a1a1a", border: `1px solid ${BORDER}`, color: "#444", fontSize: 14, cursor: "not-allowed", marginTop: 8 }}>
                Coming Soon
              </button>
            </div>

          </div>
        </Section>
      </div>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${BORDER}`, background: "#080808" }}>
        <Section style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 800, marginBottom: 16, letterSpacing: "-0.02em" }}>
            Turn commitments<br />into <span style={{ color: G }}>execution.</span>
          </h2>
          <p style={{ color: SUB, fontSize: 17, marginBottom: 36 }}>
            Axis helps personal trainers build more consistent clients.
          </p>
          <Link href="/" className="btn-green" style={{ fontSize: 16, padding: "14px 36px" }}>Start gratis</Link>
        </Section>
      </div>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer id="contact" style={{ borderTop: `1px solid ${BORDER}`, padding: "40px 24px" }}>
        <div style={{ maxWidth: MAX, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <img src="/axis-logo.png" alt="AXIS" style={{ height: 28, display: "block" }} />
            <p style={{ color: SUB, fontSize: 12, marginTop: 4 }}>Commit. Execute. Reflect. Recover.</p>
          </div>
          <p style={{ color: "#444", fontSize: 12 }}>© 2026 AXIS</p>
        </div>
      </footer>

    </div>
  )
}
