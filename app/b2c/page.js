"use client"

import { useEffect, useState } from "react"
import { AxisLogo } from "../../components/AxisLogo"

const G = "#22c55e"
const BG = "#0a0a0a"
const CARD = "rgba(255,255,255,0.03)"
const BORDER = "rgba(255,255,255,0.08)"
const TEXT = "#F4F4F5"
const SUB = "#71717A"
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
      h1a: "BEREIK JE DOEL.",
      h1b: "ELKE DAG.",
      sub: "Dagelijkse check-ins via WhatsApp, een AI coach die jou kent, en workouts die passen bij jouw doel.",
      cta: "Start 14 dagen gratis →",
      stats: [
        { val: "14 dagen", sub: "gratis proberen" },
        { val: "€9,99", sub: "per maand" },
        { val: "WhatsApp", sub: "geen extra app" },
      ],
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
        { num: "01", title: "AI coach die jou kent",       desc: "Onthoudt jouw geschiedenis, doelen en patronen. Past de toon aan op hoe het met je gaat." },
        { num: "02", title: "Dagelijkse WhatsApp check-in", desc: "Geen aparte app nodig. Elke ochtend een check-in, elke avond een check-out." },
        { num: "03", title: "Workouts op maat",             desc: "Workouts afgestemd op jouw doel en niveau. Registreer gewichten en sets in de app." },
        { num: "04", title: "Voedingstracker",              desc: "Log maaltijden via barcodescan of zoek in onze voedingsdatabase. Zie je macro-voortgang per dag." },
        { num: "05", title: "Voortgang & statistieken",     desc: "Dagelijkse scores, streaks en trends. Zie precies hoe je het doet." },
        { num: "06", title: "Unlimited commitments",        desc: "Voeg zoveel dagelijkse commitments toe als je wil. Geen limiet." },
      ],
    },
    pricing: {
      badge: "Prijzen",
      h2: "Eén plan. Alles inbegrepen.",
      sub: "14 dagen gratis proberen. Geen creditcard nodig.",
      monthlyPrice: "€9,99",
      perMonth: "/maand",
      includes: "Wat je krijgt:",
      features: [
        "AI coach met geheugen",
        "Dagelijkse WhatsApp check-in",
        "Workouts op maat",
        "Voedingstracker met barcodescan",
        "Voortgang & statistieken",
        "Unlimited commitments",
        "Persoonlijke herinneringen",
      ],
      cta: "Start gratis →",
      trial: "14 dagen gratis — daarna pas betalen",
    },
    cta: {
      h2a: "Klaar om",
      h2b: "te beginnen?",
      p: "14 dagen gratis. Geen creditcard. Stop wanneer je wil.",
      btn: "Start gratis →",
    },
    footer: { tagline: "Commit. Execute. Reflect. Recover." },
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
      h1a: "REACH YOUR GOAL.",
      h1b: "EVERY DAY.",
      sub: "Daily check-ins via WhatsApp, an AI coach that knows you, and workouts built around your goal.",
      cta: "Start 14 days free →",
      stats: [
        { val: "14 days", sub: "free trial" },
        { val: "€9.99", sub: "per month" },
        { val: "WhatsApp", sub: "no extra app" },
      ],
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
        { num: "01", title: "AI coach that knows you",  desc: "Remembers your history, goals and patterns. Adjusts tone based on how you're doing." },
        { num: "02", title: "Daily WhatsApp check-in",  desc: "No separate app needed. A check-in every morning, a check-out every evening." },
        { num: "03", title: "Personalized workouts",    desc: "Workouts tailored to your goal and level. Log weights and sets in the app." },
        { num: "04", title: "Nutrition tracker",        desc: "Log meals via barcode scan or search our food database. See macro progress per day." },
        { num: "05", title: "Progress & statistics",    desc: "Daily scores, streaks and trends. See exactly how you're doing." },
        { num: "06", title: "Unlimited commitments",    desc: "Add as many daily commitments as you want. No limit." },
      ],
    },
    pricing: {
      badge: "Pricing",
      h2: "One plan. Everything included.",
      sub: "14 days free trial. No credit card needed.",
      monthlyPrice: "€9.99",
      perMonth: "/month",
      includes: "What you get:",
      features: [
        "AI coach with memory",
        "Daily WhatsApp check-in",
        "Personalized workouts",
        "Nutrition tracker with barcode scan",
        "Progress & statistics",
        "Unlimited commitments",
        "Personal reminders",
      ],
      cta: "Start free →",
      trial: "14 days free — pay after that",
    },
    cta: {
      h2a: "Ready to",
      h2b: "start?",
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
    <span style={{
      background: "rgba(34,197,94,0.08)", color: G,
      fontSize: 11, fontWeight: 700, letterSpacing: 2,
      padding: "4px 12px", borderRadius: 4,
      border: "1px solid rgba(34,197,94,0.2)",
      textTransform: "uppercase", fontFamily: "'Chakra Petch', monospace",
    }}>
      {children}
    </span>
  )
}

function PhoneFrame({ src }) {
  const NW = 390, NH = 844, SCALE = 0.56
  const W = Math.round(NW * SCALE), H = Math.round(NH * SCALE)
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <div style={{
        display: "inline-block", border: "6px solid #1e1e1e", borderRadius: 32,
        overflow: "hidden", background: "#111",
        boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06), 0 0 60px rgba(34,197,94,0.04)",
      }}>
        <div style={{ height: 20, background: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 48, height: 4, background: "#2a2a2a", borderRadius: 4 }} />
        </div>
        <div style={{ width: W, height: H, overflow: "hidden", background: "#000" }}>
          <iframe src={src} scrolling="no" title="mockup"
            style={{ width: NW, height: NH, border: "none", display: "block", transform: `scale(${SCALE})`, transformOrigin: "top left", pointerEvents: "none" }}
          />
        </div>
      </div>
      <div aria-hidden="true" style={{ position: "absolute", top: -24, right: -24, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />
    </div>
  )
}

// ── Lang toggle ───────────────────────────────────────────────
function LangToggle({ lang, setLang }) {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {[["NL","🇳🇱"],["EN","English"]].map(([code, flag], i) => (
        <span key={code} style={{ display: "flex", alignItems: "center" }}>
          {i > 0 && <span style={{ color: "#333", fontSize: 11, padding: "0 1px" }}>|</span>}
          <button onClick={() => setLang(code)} style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: code === "NL" ? 15 : 13, padding: "4px 6px", lineHeight: 1,
            opacity: lang === code ? 1 : 0.4,
            color: "#fff", fontWeight: lang === code ? 600 : 400,
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
    <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(10,10,10,0.88)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
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
        <div style={{ background: "#0a0a0a", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "8px 0 16px" }}>
          {t.navLinks.map(l => (
            <a key={l.href} href={l.href} onClick={close} style={{
              display: "block", padding: "12px 24px",
              color: "#ccc", fontSize: 15, textDecoration: "none",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}>
              {l.label}
            </a>
          ))}
          <a href="/" onClick={close} style={{
            display: "block", padding: "12px 24px",
            color: SUB, fontSize: 14, textDecoration: "none",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}>
            {t.navSwitcher}
          </a>
          <div style={{ padding: "12px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
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
  const [lang, setLang] = useState("NL")
  const t = T[lang]

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth"
    return () => { document.documentElement.style.scrollBehavior = "" }
  }, [])

  // IntersectionObserver voor scroll-animaties
  useEffect(() => {
    if (typeof window === "undefined") return
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible") }),
      { threshold: 0.08, rootMargin: "0px 0px -48px 0px" }
    )
    document.querySelectorAll(".fade-up").forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [lang])

  return (
    <div style={{ background: BG, color: TEXT, fontFamily: "system-ui, -apple-system, sans-serif", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:ital,wght@0,400;0,600;0,700;1,400&display=swap');

        /* ── Scroll fade-in ── */
        .fade-up { opacity: 0; transform: translateY(20px); transition: opacity 0.55s cubic-bezier(0.16,1,0.3,1), transform 0.55s cubic-bezier(0.16,1,0.3,1); }
        .fade-up.visible { opacity: 1; transform: translateY(0); }
        .fade-up.d1 { transition-delay: 0.08s; }
        .fade-up.d2 { transition-delay: 0.16s; }
        .fade-up.d3 { transition-delay: 0.24s; }

        /* ── Hero ── */
        @keyframes axisUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes axisFade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .hero-title      { animation: axisUp   0.85s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
        .hero-sub        { animation: axisUp   0.75s cubic-bezier(0.16,1,0.3,1) 0.28s both; }
        .hero-cta        { animation: axisUp   0.75s cubic-bezier(0.16,1,0.3,1) 0.42s both; }
        .hero-stats      { animation: axisFade 1.0s  ease                        0.7s  both; }
        .hero-phone-anim { animation: axisFade 1.1s  ease                        0.2s  both; }

        /* ── Nav ── */
        .nav-links a { color: ${SUB}; text-decoration: none; font-size: 14px; transition: color 0.15s; }
        .nav-links a:hover { color: ${TEXT}; }

        /* ── Buttons ── */
        .btn-ghost { background: transparent; border: 1px solid rgba(255,255,255,0.12); color: ${SUB}; padding: 10px 20px; border-radius: 6px; font-size: 14px; cursor: pointer; text-decoration: none; transition: border-color 0.15s, color 0.15s; display: inline-block; touch-action: manipulation; }
        .btn-ghost:hover { border-color: rgba(255,255,255,0.3); color: ${TEXT}; }
        .btn-green { background: ${G}; color: #000; padding: 12px 28px; border-radius: 6px; font-size: 14px; font-weight: 700; cursor: pointer; text-decoration: none; display: inline-block; transition: opacity 0.15s, transform 0.15s; border: none; touch-action: manipulation; font-family: 'Chakra Petch', monospace; letter-spacing: 0.06em; }
        .btn-green:hover { opacity: 0.88; transform: translateY(-1px); }

        /* ── Cards ── */
        .feature-card {
          background: ${CARD}; border: 1px solid ${BORDER}; border-radius: 12px;
          padding: 28px; flex: 1; min-width: 220px; position: relative; overflow: hidden;
          transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s;
        }
        .feature-card:hover {
          border-color: rgba(34,197,94,0.2);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(34,197,94,0.08);
          transform: translateY(-2px);
        }
        .feature-watermark {
          position: absolute; bottom: -12px; right: 8px;
          font-family: 'Chakra Petch', monospace;
          font-size: 80px; font-weight: 700; line-height: 1;
          color: rgba(34,197,94,0.045); pointer-events: none;
          user-select: none; letter-spacing: -4px;
        }
        .feature-num {
          font-family: 'Chakra Petch', monospace;
          font-size: 10px; color: ${G}; font-weight: 600;
          letter-spacing: 3px; margin-bottom: 14px; display: block; opacity: 0.7;
        }
        .step-card {
          background: ${CARD}; border: 1px solid ${BORDER}; border-radius: 12px;
          padding: 28px 24px; flex: 1; min-width: 200px;
          transition: border-color 0.2s;
        }
        .step-card:hover { border-color: rgba(34,197,94,0.16); }

        /* ── Check items ── */
        .check-item { display: flex; align-items: flex-start; gap: 10px; font-size: 15px; color: ${SUB}; line-height: 1.5; }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .hero-grid { flex-direction: column !important; }
          .hero-phone { display: none !important; }
          .steps-grid { flex-direction: column !important; }
          .feature-grid { flex-direction: column !important; }
          .nav-links { display: none !important; }
          .nav-right { display: none !important; }
          .nav-hamburger { display: block !important; }
          .whatsapp-split { flex-direction: column !important; }
          .hero-stats { flex-direction: column !important; gap: 20px !important; }
        }

        /* ── Reduced motion ── */
        @media (prefers-reduced-motion: reduce) {
          .hero-title, .hero-sub, .hero-cta, .hero-phone-anim, .hero-stats {
            animation: none; opacity: 1; transform: none;
          }
          .fade-up { opacity: 1; transform: none; transition: none; }
          .feature-card, .step-card, .btn-green { transition: none; }
        }
      `}</style>

      <Nav lang={lang} setLang={setLang} t={t} />

      {/* ── HERO ────────────────────────────────────────────── */}
      <div style={{ maxWidth: MAX, margin: "0 auto", padding: "96px 24px 80px", position: "relative" }}>
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          background: "radial-gradient(ellipse 60% 55% at 65% 30%, rgba(34,197,94,0.09) 0%, transparent 60%)",
        }} />
        <div className="hero-grid" style={{ display: "flex", alignItems: "center", gap: 64, position: "relative", zIndex: 1 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Badge>{t.hero.badge}</Badge>
            <h1 className="hero-title" style={{
              fontFamily: "'Chakra Petch', monospace",
              fontSize: "clamp(36px, 5.5vw, 72px)",
              fontWeight: 700, lineHeight: 0.95,
              margin: "24px 0 24px", letterSpacing: "-0.01em",
              textTransform: "uppercase",
            }}>
              {t.hero.h1a}<br />
              <span style={{ color: G }}>{t.hero.h1b}</span>
            </h1>
            <p className="hero-sub" style={{ fontSize: 16, color: SUB, marginBottom: 32, lineHeight: 1.75, maxWidth: 460 }}>{t.hero.sub}</p>
            <div className="hero-cta">
              <a href="https://app.axisapp.nl/signup" className="btn-green" style={{ fontSize: 15, padding: "14px 32px" }}>{t.hero.cta}</a>
            </div>

            {/* Stats row */}
            <div className="hero-stats" style={{ display: "flex", gap: 40, marginTop: 44, paddingTop: 32, borderTop: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap" }}>
              {t.hero.stats.map(s => (
                <div key={s.val} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontFamily: "'Chakra Petch', monospace", fontSize: 24, fontWeight: 700, color: TEXT, lineHeight: 1, letterSpacing: "-0.01em" }}>{s.val}</span>
                  <span style={{ fontSize: 11, color: SUB, letterSpacing: 1.5, textTransform: "uppercase" }}>{s.sub}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="hero-phone hero-phone-anim" style={{ flexShrink: 0 }}>
            <PhoneFrame src="/mockups/today.html" />
          </div>
        </div>
      </div>

      {/* ── HOE HET WERKT ───────────────────────────────────── */}
      <div id="hoe" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "#060606" }}>
        <Section>
          <div className="fade-up" style={{ textAlign: "center", marginBottom: 56 }}>
            <Badge>{t.how.badge}</Badge>
            <h2 style={{ fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 800, margin: "20px 0 0", letterSpacing: "-0.02em" }}>
              {t.how.h2}
            </h2>
          </div>
          <div className="steps-grid fade-up d1" style={{ display: "flex", gap: 16 }}>
            {t.how.steps.map(s => (
              <div key={s.num} className="step-card">
                <span style={{ fontFamily: "'Chakra Petch', monospace", fontSize: 10, color: G, fontWeight: 600, letterSpacing: 3, marginBottom: 14, display: "block", opacity: 0.7 }}>{s.num}</span>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: G }} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, lineHeight: 1.3 }}>{s.title}</h3>
                <p style={{ color: SUB, fontSize: 13, lineHeight: 1.75 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* ── WHATSAPP HIGHLIGHT ──────────────────────────────── */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <Section>
          <div className="whatsapp-split fade-up" style={{ display: "flex", alignItems: "center", gap: 64, flexWrap: "wrap" }}>
            <PhoneFrame src="/mockups/whatsapp.html" />
            <div style={{ flex: 1, minWidth: 260 }}>
              <Badge>WhatsApp</Badge>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, margin: "20px 0 16px", lineHeight: 1.2, letterSpacing: "-0.02em" }}>
                {lang === "NL" ? <>Discipline zonder<br />een app te openen.</> : <>Discipline without<br />opening an app.</>}
              </h2>
              <p style={{ color: SUB, fontSize: 15, lineHeight: 1.85 }}>
                {lang === "NL"
                  ? "Je krijgt elke ochtend een WhatsApp bericht. Reageer, commit, en ga. Geen nieuwe app, geen extra gedoe — gewoon je bestaande WhatsApp."
                  : "You get a WhatsApp message every morning. Reply, commit, and go. No new app, no extra hassle — just your existing WhatsApp."}
              </p>
            </div>
          </div>
        </Section>
      </div>

      {/* ── FEATURES ────────────────────────────────────────── */}
      <div id="features" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "#060606" }}>
        <Section>
          <div className="fade-up">
            <Badge>{t.features.badge}</Badge>
            <h2 style={{ fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 800, margin: "20px 0 48px", letterSpacing: "-0.02em" }}>
              {t.features.h2}
            </h2>
          </div>
          <div className="feature-grid fade-up d1" style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {t.features.items.map(f => (
              <div key={f.num} className="feature-card" style={{ minWidth: 200 }}>
                <div aria-hidden="true" className="feature-watermark">{f.num}</div>
                <span className="feature-num">{f.num}</span>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>{f.title}</h3>
                <p style={{ color: SUB, fontSize: 13, lineHeight: 1.75 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* ── PRICING ─────────────────────────────────────────── */}
      <div id="prijzen" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <Section>
          <div className="fade-up" style={{ textAlign: "center", marginBottom: 56 }}>
            <Badge>{t.pricing.badge}</Badge>
            <h2 style={{ fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 800, margin: "20px 0 12px", letterSpacing: "-0.02em" }}>
              {t.pricing.h2}
            </h2>
            <p style={{ color: SUB, fontSize: 15 }}>{t.pricing.sub}</p>
          </div>

          <div className="fade-up d1" style={{ maxWidth: 480, margin: "0 auto" }}>
            <div style={{
              background: CARD,
              border: "1px solid rgba(34,197,94,0.3)",
              borderRadius: 12, padding: 44,
              boxShadow: "0 0 0 1px rgba(34,197,94,0.1), 0 24px 64px rgba(34,197,94,0.06)",
            }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                <span style={{ fontFamily: "'Chakra Petch', monospace", fontSize: 52, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.02em" }}>
                  {t.pricing.monthlyPrice}
                </span>
                <span style={{ color: SUB, fontSize: 15 }}>{t.pricing.perMonth}</span>
              </div>
              <p style={{ color: SUB, fontSize: 13, marginBottom: 32 }}>{t.pricing.trial}</p>

              <p style={{ color: "#3f3f46", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16, fontFamily: "'Chakra Petch', monospace" }}>{t.pricing.includes}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 36 }}>
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
                style={{ display: "block", textAlign: "center", fontSize: 15, padding: "14px 28px" }}
              >
                {t.pricing.cta}
              </a>
            </div>
          </div>
        </Section>
      </div>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "#060606" }}>
        <Section style={{ textAlign: "center" }}>
          <div className="fade-up">
            <h2 style={{
              fontFamily: "'Chakra Petch', monospace",
              fontSize: "clamp(28px, 4.5vw, 58px)", fontWeight: 700,
              marginBottom: 16, letterSpacing: "0.02em",
              textTransform: "uppercase", lineHeight: 1.0,
            }}>
              {t.cta.h2a}<br /><span style={{ color: G }}>{t.cta.h2b}</span>
            </h2>
            <p style={{ color: SUB, fontSize: 16, marginBottom: 36 }}>{t.cta.p}</p>
            <a href="https://app.axisapp.nl/signup" className="btn-green" style={{ fontSize: 15, padding: "14px 36px" }}>{t.cta.btn}</a>
          </div>
        </Section>
      </div>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "40px 24px" }}>
        <div style={{ maxWidth: MAX, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <AxisLogo variant="bracket" size={18} />
            <p style={{ color: SUB, fontSize: 12, marginTop: 4 }}>{t.footer.tagline}</p>
          </div>
          <p style={{ color: "#3f3f46", fontSize: 12 }}>© 2026 AXIS</p>
        </div>
      </footer>

    </div>
  )
}
