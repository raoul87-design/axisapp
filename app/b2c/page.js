"use client"

import { useEffect, useState } from "react"
import { AxisLogo } from "../../components/AxisLogo"

const G = "#22c55e"
const BG = "#0f0f0f"
const CARD = "#111"
const BORDER = "#1e1e1e"
const TEXT = "#ffffff"
const SUB = "#888"
const MAX = 1100

// ── Translations ──────────────────────────────────────────────
const T = {
  NL: {
    navLinks: [
      { label: "Hoe het werkt", href: "#hoe" },
      { label: "Features",      href: "#features" },
      { label: "Prijzen",       href: "#prijzen" },
    ],
    navCta: "Start gratis",
    navSwitcher: "Voor coaches →",
    hero: {
      badge: "Jouw dagelijkse discipline app",
      h1a: "Bereik je doel.",
      h1b: "Elke dag een stap dichter.",
      sub: "Dagelijkse check-ins via WhatsApp, een AI coach die je kent, en workouts die passen bij jouw doel.",
      cta: "Start 14 dagen gratis →",
    },
    how: {
      badge: "Hoe het werkt",
      h2: "Vier stappen naar consistentie.",
      steps: [
        { num: "01", title: "Stel je doel in",                 desc: "Vertel AXIS wat je wil bereiken. De AI coach past zich aan jouw doel en niveau aan." },
        { num: "02", title: "Dagelijkse check-in via WhatsApp", desc: "Elke ochtend een bericht. Commit aan één ding dat je vandaag gaat doen." },
        { num: "03", title: "Commitments bijhouden",            desc: "Zie wat je hebt gedaan. Bouw een streak op. Blijf consistent." },
        { num: "04", title: "Voortgang zien",                   desc: "Statistieken, patronen en trends. Zie hoe ver je al bent gekomen." },
      ],
    },
    features: {
      badge: "Wat je krijgt",
      h2: "Alles wat je nodig hebt om consistent te blijven.",
      items: [
        { num: "01", title: "AI coach die je kent",         desc: "Onthoudt jouw geschiedenis, doelen en patronen. Past de toon aan op basis van hoe het gaat." },
        { num: "02", title: "Dagelijkse WhatsApp check-in", desc: "Geen aparte app nodig. Elke ochtend een check-in, elke avond een check-out." },
        { num: "03", title: "Workouts op maat",             desc: "Workouts afgestemd op jouw doel en niveau. Registreer gewichten en sets in de app." },
        { num: "04", title: "Voortgang & statistieken",     desc: "Dagelijkse scores, streaks en trends. Zie precies hoe je het doet." },
        { num: "05", title: "Unlimited commitments",        desc: "Voeg zoveel dagelijkse commitments toe als je wil. Geen limiet." },
      ],
    },
    pricing: {
      badge: "Prijzen",
      h2: "Eén plan. Alles inbegrepen.",
      sub: "14 dagen gratis proberen. Geen creditcard nodig.",
      monthly: "Maandelijks",
      yearly: "Jaarlijks",
      save: "Bespaar 2 maanden",
      monthlyPrice: "€9,99",
      yearlyPrice: "€79",
      perMonth: "/maand",
      perYear: "/jaar",
      includes: "Wat je krijgt:",
      features: ["AI coach", "Dagelijkse WhatsApp check-in", "Workouts op maat", "Voortgang & statistieken", "Unlimited commitments"],
      cta: "Start gratis →",
      trial: "14 dagen gratis — daarna pas betalen",
    },
    cta: {
      h2: "Klaar om te beginnen?",
      p: "14 dagen gratis. Geen creditcard. Stop wanneer je wil.",
      btn: "Start gratis →",
    },
    footer: { tagline: "Commit. Uitvoeren. Reflecteren. Herstellen." },
  },
  EN: {
    navLinks: [
      { label: "How it works", href: "#hoe" },
      { label: "Features",     href: "#features" },
      { label: "Pricing",      href: "#prijzen" },
    ],
    navCta: "Start free",
    navSwitcher: "For coaches →",
    hero: {
      badge: "Your daily discipline app",
      h1a: "Reach your goal.",
      h1b: "One step closer every day.",
      sub: "Daily check-ins via WhatsApp, an AI coach that knows you, and workouts that fit your goal.",
      cta: "Start 14 days free →",
    },
    how: {
      badge: "How it works",
      h2: "Four steps to consistency.",
      steps: [
        { num: "01", title: "Set your goal",               desc: "Tell AXIS what you want to achieve. The AI coach adapts to your goal and level." },
        { num: "02", title: "Daily check-in via WhatsApp", desc: "Every morning a message. Commit to one thing you'll do today." },
        { num: "03", title: "Track your commitments",      desc: "See what you've done. Build a streak. Stay consistent." },
        { num: "04", title: "See your progress",           desc: "Statistics, patterns and trends. See how far you've come." },
      ],
    },
    features: {
      badge: "What you get",
      h2: "Everything you need to stay consistent.",
      items: [
        { num: "01", title: "AI coach that knows you", desc: "Remembers your history, goals and patterns. Adjusts tone based on how you're doing." },
        { num: "02", title: "Daily WhatsApp check-in", desc: "No separate app needed. A check-in every morning, a check-out every evening." },
        { num: "03", title: "Personalized workouts",   desc: "Workouts tailored to your goal and level. Log weights and sets in the app." },
        { num: "04", title: "Progress & statistics",   desc: "Daily scores, streaks and trends. See exactly how you're doing." },
        { num: "05", title: "Unlimited commitments",   desc: "Add as many daily commitments as you want. No limit." },
      ],
    },
    pricing: {
      badge: "Pricing",
      h2: "One plan. Everything included.",
      sub: "14 days free trial. No credit card needed.",
      monthly: "Monthly",
      yearly: "Yearly",
      save: "Save 2 months",
      monthlyPrice: "€9.99",
      yearlyPrice: "€79",
      perMonth: "/month",
      perYear: "/year",
      includes: "What you get:",
      features: ["AI coach", "Daily WhatsApp check-in", "Personalized workouts", "Progress & statistics", "Unlimited commitments"],
      cta: "Start free →",
      trial: "14 days free — pay after that",
    },
    cta: {
      h2: "Ready to start?",
      p: "14 days free. No credit card. Cancel anytime.",
      btn: "Start free →",
    },
    footer: { tagline: "Commit. Execute. Reflect. Recover." },
  },
}

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

// ── Lang toggle ───────────────────────────────────────────────
function LangToggle({ lang, setLang }) {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {[["NL","🇳🇱"],["EN","🇬🇧"]].map(([code, flag], i) => (
        <span key={code} style={{ display: "flex", alignItems: "center" }}>
          {i > 0 && <span style={{ color: "#333", fontSize: 11, padding: "0 1px" }}>|</span>}
          <button onClick={() => setLang(code)} style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 15, padding: "4px 5px", lineHeight: 1,
            opacity: lang === code ? 1 : 0.4,
          }}>
            {flag}
          </button>
        </span>
      ))}
    </div>
  )
}

// ── Nav ───────────────────────────────────────────────────────
function Nav({ lang, setLang, t }) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(15,15,15,0.92)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth: MAX, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <AxisLogo variant="streak" size={20} />

        <div className="nav-links" style={{ display: "flex", gap: 32 }}>
          {t.navLinks.map(l => <a key={l.href} href={l.href}>{l.label}</a>)}
        </div>

        <div className="nav-right" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <a href="/" style={{ color: SUB, fontSize: 13, textDecoration: "none", whiteSpace: "nowrap" }}>
            {t.navSwitcher}
          </a>
          <LangToggle lang={lang} setLang={setLang} />
          <a href="https://app.axisapp.nl/signup" className="btn-green" style={{ padding: "8px 20px", fontSize: 13 }}>{t.navCta}</a>
        </div>

        <button
          className="nav-hamburger"
          onClick={() => setOpen(o => !o)}
          aria-label="Menu"
          style={{ display: "none", background: "none", border: "none", cursor: "pointer", padding: 4 }}
        >
          {open ? (
            <svg width={22} height={22} viewBox="0 0 22 22" fill="none">
              <path d="M4 4l14 14M18 4L4 18" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" />
            </svg>
          ) : (
            <svg width={22} height={22} viewBox="0 0 22 22" fill="none">
              <path d="M3 6h16M3 11h16M3 16h16" stroke={G} strokeWidth={1.8} strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <div style={{ background: "#0a0a0a", borderTop: `1px solid ${BORDER}`, padding: "8px 0 16px" }}>
          {t.navLinks.map(l => (
            <a key={l.href} href={l.href} onClick={close} style={{
              display: "block", padding: "12px 24px",
              color: "#ccc", fontSize: 15, textDecoration: "none",
              borderBottom: `1px solid ${BORDER}`,
            }}>
              {l.label}
            </a>
          ))}
          <a href="/" onClick={close} style={{
            display: "block", padding: "12px 24px",
            color: SUB, fontSize: 14, textDecoration: "none",
            borderBottom: `1px solid ${BORDER}`,
          }}>
            {t.navSwitcher}
          </a>
          <div style={{ padding: "12px 24px", borderBottom: `1px solid ${BORDER}` }}>
            <LangToggle lang={lang} setLang={setLang} />
          </div>
          <div style={{ padding: "14px 24px 0" }}>
            <a href="https://app.axisapp.nl/signup" className="btn-green" style={{ display: "inline-block", padding: "10px 24px", fontSize: 14 }} onClick={close}>
              {t.navCta}
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}

// ── Main ──────────────────────────────────────────────────────
export default function B2CPage() {
  const [lang, setLang]       = useState("NL")
  const [billing, setBilling] = useState("monthly")
  const t = T[lang]

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth"
    return () => { document.documentElement.style.scrollBehavior = "" }
  }, [])

  return (
    <div style={{ background: BG, color: TEXT, fontFamily: "system-ui, -apple-system, sans-serif", minHeight: "100vh" }}>
      <style>{`
        .nav-links a { color: ${SUB}; text-decoration: none; font-size: 14px; transition: color 0.15s; }
        .nav-links a:hover { color: ${TEXT}; }
        .btn-green { background: ${G}; color: #000; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; text-decoration: none; display: inline-block; transition: opacity 0.15s; border: none; }
        .btn-green:hover { opacity: 0.88; }
        .feature-card { background: ${CARD}; border: 1px solid ${BORDER}; border-radius: 14px; padding: 28px; flex: 1; min-width: 240px; }
        .step-card { background: ${CARD}; border: 1px solid ${BORDER}; border-radius: 14px; padding: 28px 24px; flex: 1; min-width: 200px; }
        .check-item { display: flex; align-items: flex-start; gap: 10px; font-size: 15px; color: ${SUB}; line-height: 1.5; }
        @media (max-width: 768px) {
          .hero-grid { flex-direction: column !important; }
          .hero-phone { display: none !important; }
          .steps-grid { flex-direction: column !important; }
          .feature-grid { flex-direction: column !important; }
          .nav-links { display: none !important; }
          .nav-right { display: none !important; }
          .nav-hamburger { display: block !important; }
        }
      `}</style>

      <Nav lang={lang} setLang={setLang} t={t} />

      {/* ── HERO ────────────────────────────────────────────── */}
      <div style={{ maxWidth: MAX, margin: "0 auto", padding: "96px 24px 80px" }}>
        <div className="hero-grid" style={{ display: "flex", alignItems: "center", gap: 64 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Badge>{t.hero.badge}</Badge>
            <h1 style={{ fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 800, lineHeight: 1.1, margin: "24px 0 20px", letterSpacing: "-0.02em" }}>
              {t.hero.h1a}<br />
              <span style={{ color: G }}>{t.hero.h1b}</span>
            </h1>
            <p style={{ fontSize: 17, color: SUB, marginBottom: 36, lineHeight: 1.7, maxWidth: 500 }}>{t.hero.sub}</p>
            <a href="https://app.axisapp.nl/signup" className="btn-green" style={{ fontSize: 16, padding: "14px 32px" }}>{t.hero.cta}</a>
          </div>
          <div className="hero-phone" style={{ flexShrink: 0 }}>
            <PhoneFrame src="/screenshot-app.png" alt="AXIS app" />
          </div>
        </div>
      </div>

      {/* ── HOE HET WERKT ───────────────────────────────────── */}
      <div id="hoe" style={{ borderTop: `1px solid ${BORDER}`, background: "#080808" }}>
        <Section>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <Badge>{t.how.badge}</Badge>
            <h2 style={{ fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 800, margin: "20px 0 0", letterSpacing: "-0.01em" }}>
              {t.how.h2}
            </h2>
          </div>
          <div className="steps-grid" style={{ display: "flex", gap: 16 }}>
            {t.how.steps.map(s => (
              <div key={s.num} className="step-card">
                <div style={{ fontSize: 11, color: G, fontWeight: 700, letterSpacing: 2, marginBottom: 16 }}>{s.num}</div>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: G + "18", border: `1px solid ${G}33`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: G }} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, lineHeight: 1.3 }}>{s.title}</h3>
                <p style={{ color: SUB, fontSize: 14, lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* ── WHATSAPP HIGHLIGHT ──────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${BORDER}` }}>
        <Section>
          <div style={{ display: "flex", alignItems: "center", gap: 64, flexWrap: "wrap" }}>
            <PhoneFrame src="/screenshot-whatsapp.png" alt="WhatsApp AI coach" />
            <div style={{ flex: 1, minWidth: 260 }}>
              <Badge>WhatsApp</Badge>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, margin: "20px 0 16px", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
                {lang === "NL" ? <>Discipline zonder<br />een app te openen.</> : <>Discipline without<br />opening an app.</>}
              </h2>
              <p style={{ color: SUB, fontSize: 16, lineHeight: 1.8 }}>
                {lang === "NL"
                  ? "Je krijgt elke ochtend een WhatsApp bericht. Reageer, commit, en ga. Geen nieuwe app, geen extra gedoe — gewoon je bestaande WhatsApp."
                  : "You get a WhatsApp message every morning. Reply, commit, and go. No new app, no extra hassle — just your existing WhatsApp."}
              </p>
            </div>
          </div>
        </Section>
      </div>

      {/* ── FEATURES ────────────────────────────────────────── */}
      <div id="features" style={{ borderTop: `1px solid ${BORDER}`, background: "#080808" }}>
        <Section>
          <Badge>{t.features.badge}</Badge>
          <h2 style={{ fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 800, margin: "20px 0 48px", letterSpacing: "-0.01em" }}>
            {t.features.h2}
          </h2>
          <div className="feature-grid" style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {t.features.items.map(f => (
              <div key={f.num} className="feature-card" style={{ minWidth: 200 }}>
                <div style={{ fontSize: 11, color: G, fontWeight: 700, letterSpacing: 2, marginBottom: 16 }}>{f.num}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{f.title}</h3>
                <p style={{ color: SUB, fontSize: 14, lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* ── PRICING ─────────────────────────────────────────── */}
      <div id="prijzen" style={{ borderTop: `1px solid ${BORDER}` }}>
        <Section>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <Badge>{t.pricing.badge}</Badge>
            <h2 style={{ fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 800, margin: "20px 0 12px", letterSpacing: "-0.01em" }}>
              {t.pricing.h2}
            </h2>
            <p style={{ color: SUB, fontSize: 16 }}>{t.pricing.sub}</p>
          </div>

          {/* Billing toggle */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 40 }}>
            <div style={{ display: "inline-flex", background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 4, gap: 4 }}>
              {["monthly", "yearly"].map(b => (
                <button
                  key={b}
                  onClick={() => setBilling(b)}
                  style={{
                    padding: "8px 20px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600,
                    background: billing === b ? G : "transparent",
                    color: billing === b ? "#000" : SUB,
                    transition: "background 0.15s, color 0.15s",
                  }}
                >
                  {b === "monthly" ? t.pricing.monthly : (
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {t.pricing.yearly}
                      <span style={{ background: billing === "yearly" ? "#000" : G, color: billing === "yearly" ? G : "#000", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, letterSpacing: 0.5 }}>
                        {t.pricing.save}
                      </span>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing card */}
          <div style={{ maxWidth: 440, margin: "0 auto" }}>
            <div style={{
              background: CARD, border: `1px solid ${G}`, borderRadius: 16, padding: 40,
              boxShadow: `0 0 0 1px ${G}22, 0 16px 48px rgba(34,197,94,0.08)`,
            }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 48, fontWeight: 800 }}>
                  {billing === "monthly" ? t.pricing.monthlyPrice : t.pricing.yearlyPrice}
                </span>
                <span style={{ color: SUB, fontSize: 15 }}>
                  {billing === "monthly" ? t.pricing.perMonth : t.pricing.perYear}
                </span>
              </div>
              {billing === "yearly" && (
                <p style={{ color: G, fontSize: 13, marginBottom: 8 }}>
                  ≈ €6,58{t.pricing.perMonth}
                </p>
              )}
              <p style={{ color: SUB, fontSize: 13, marginBottom: 28 }}>{t.pricing.trial}</p>

              <p style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16 }}>{t.pricing.includes}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                {t.pricing.features.map(f => (
                  <div key={f} className="check-item">
                    <span style={{ color: G, flexShrink: 0, fontSize: 16 }}>✓</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <a
                href="https://app.axisapp.nl/signup"
                className="btn-green"
                style={{ display: "block", textAlign: "center", fontSize: 16, padding: "14px 28px" }}
              >
                {t.pricing.cta}
              </a>
            </div>
          </div>
        </Section>
      </div>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${BORDER}`, background: "#080808" }}>
        <Section style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 800, marginBottom: 16, letterSpacing: "-0.02em" }}>
            {t.cta.h2}
          </h2>
          <p style={{ color: SUB, fontSize: 17, marginBottom: 36 }}>{t.cta.p}</p>
          <a href="https://app.axisapp.nl/signup" className="btn-green" style={{ fontSize: 16, padding: "14px 36px" }}>{t.cta.btn}</a>
        </Section>
      </div>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: "40px 24px" }}>
        <div style={{ maxWidth: MAX, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <span style={{ fontWeight: 700, letterSpacing: "0.15em", fontSize: 18, color: "#fff" }}>AXIS</span>
            <p style={{ color: SUB, fontSize: 12, marginTop: 4 }}>{t.footer.tagline}</p>
          </div>
          <p style={{ color: "#444", fontSize: 12 }}>© 2026 AXIS</p>
        </div>
      </footer>

    </div>
  )
}
