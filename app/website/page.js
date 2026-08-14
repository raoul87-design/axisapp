"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

const G = "#22c55e"
const BG = "var(--ink)"
const CARD = "#111"
const BORDER = "#1e1e1e"
const TEXT = "#ffffff"
const SUB = "#888"
const MAX = 1100

const FORMSPREE_ENDPOINT = "https://formspree.io/f/mjgjwdeo"

// ── Translations ──────────────────────────────────────────────
const T = {
  EN: {
    navLinks: [
      { label: "About",    href: "#probleem" },
      { label: "Solution", href: "#oplossing" },
      { label: "Pricing",  href: "#prijzen" },
      { label: "Contact",  href: "#contact" },
    ],
    navCta: "Start free",
    navSwitcher: "← For myself",
    hero: {
      badge: "Discipline System for Coaches",
      h1a: "Stop chasing",
      h1b: "your clients.",
      sub1: "Everyone starts. Stayd is for those who stay.",
      sub2: "A daily discipline system for personal trainers. WhatsApp. AI as director. Nutrition. Workouts. Everything in one place.",
      cta1: "Start free →",
      cta2: "I'm a coach →",
    },
    problem: {
      badge: "The problem",
      h2: "Most people know what to do.",
      h2sub: "They just don't do it consistently.",
      p: "People want to get stronger, healthier or more focused. They know the steps. But consistency breaks down. Not because of motivation — but because there is no system that creates daily accountability, clear commitments and feedback when things get difficult.",
    },
    coaching: {
      badge: "The coach",
      h2: "That's why coaching exists.",
      p: "Coaches help people set goals and create direction. But even great coaches can't monitor their clients every day. Most of the real work happens between sessions. That's where consistency is won or lost.",
    },
    solution: {
      badge: "The solution",
      h2: "Stayd fills the gap between sessions.",
      sub: "Everything your clients need to stay consistent. From daily commitments to nutrition plans and workouts — Stayd directs it all.",
      features: [
        { num: "01", title: "Daily commitment",    desc: "Clients commit to what they will do today via WhatsApp. One clear intention, every morning." },
        { num: "02", title: "Execution tracking",  desc: "Streaks, missed days and patterns are tracked automatically — visible to the coach at a glance." },
        { num: "03", title: "Metrics tracking",    desc: "Weight, kcal and steps tracked daily via WhatsApp. No manual entry, no separate app." },
        { num: "04", title: "AI Director",         desc: "The Stayd AI knows your client's goal, monitors their progress and actively adjusts. Not a generic bot — a coach that knows their story and hits the right tone every day." },
        { num: "05", title: "Progress insights",   desc: "Trends and patterns visible for both coach and client. Spot who needs support before they drop off." },
        { num: "06", title: "Nutrition plan",      desc: "Coach sets a personal nutrition plan. Clients see their daily kcal and protein goals — directly in the app." },
        { num: "07", title: "Nutrition tracker",   desc: "Clients log meals via barcode scan or search in the Open Food Facts database. Coach sees macro progress per day." },
        { num: "08", title: "Shopping list",       desc: "AI automatically generates a weekly shopping list based on the nutrition plan. One tap to export." },
        { num: "09", title: "Personal reminders",  desc: "Clients set daily or one-time reminders via WhatsApp. No extra app needed — just one message." },
        { num: "10", title: "Workout delivery",    desc: "Coach plans workouts, clients receive them in the app with exercise instructions and weight logging." },
      ],
    },
    system: {
      badge: "The system",
      h2: "The Stayd Discipline System.",
      steps: [
        { step: "Commit",  color: G,         desc: "Every morning, the client commits to one concrete goal for the day. Clear, specific, actionable." },
        { step: "Execute", color: "#60a5fa", desc: "The client works on their commitment throughout the day. Stayd tracks whether they follow through." },
        { step: "Reflect", color: "#f59e0b", desc: "In the evening, Stayd checks in. Did you do it? An honest answer drives the next step." },
        { step: "Recover", color: "#a78bfa", desc: "Missed a day? No problem. Stayd helps you bounce back instead of spiraling. Progress over perfection." },
      ],
    },
    whatsapp: {
      badge: "WhatsApp",
      h2a: "Discipline without",
      h2b: "opening an app.",
      p: "Clients don't install anything. They simply respond. Commitments, weight, calories, reminders — all via WhatsApp. Workouts and progress tracking in the app.",
    },
    dashboard: {
      badge: "Coach dashboard",
      h2a: "Coaches see",
      h2b: "who executes.",
      p: "Stayd gives coaches visibility into what happens between sessions. See which clients stay consistent. See who needs support. Spend less time chasing updates — and more time coaching.",
      bullets: [
        "See daily metrics — weight trends, kcal targets and macro progress",
        "Full client history — commitments, metrics and conversations in one place",
      ],
    },
    cta: {
      h2a: "Turn commitments",
      h2b: "into",
      h2c: "execution.",
      p: "Stayd helps personal trainers build more consistent clients.",
      btn: "Start free →",
    },
    contact: {
      badge: "Contact",
      h2: "Get in touch.",
      p: "Questions about Stayd or want to get started? Send a message and we'll get back to you within one business day.",
      name: "Name",
      email: "Email",
      message: "Message",
      namePlaceholder: "Your name",
      emailPlaceholder: "your@email.com",
      msgPlaceholder: "Tell us about your coaching practice...",
      send: "Send message",
      sending: "Sending...",
      successTitle: "Message sent.",
      successSub: "We'll get back to you within one business day.",
      sendAnother: "Send another →",
      error: "Something went wrong. Please try again or email us directly.",
    },
    footer: { tagline: "Commit. Execute. Reflect. Recover." },
    seo: "Stayd is an accountability app for personal trainers and coaches. Automated WhatsApp check-ins, metrics tracking and AI coaching help coaches keep their clients consistent between sessions.",
  },
  NL: {
    navLinks: [
      { label: "Over",      href: "#probleem" },
      { label: "Oplossing", href: "#oplossing" },
      { label: "Prijzen",   href: "#prijzen" },
      { label: "Contact",   href: "#contact" },
    ],
    navCta: "Start gratis",
    navSwitcher: "← Voor mezelf",
    hero: {
      badge: "Discipline Systeem voor Coaches",
      h1a: "Stop met achternazitten",
      h1b: "van je klanten.",
      sub1: "Iedereen begint. Stayd is voor wie blijft.",
      sub2: "Een dagelijks discipline systeem voor personal trainers. WhatsApp. AI als regisseur. Voeding. Workouts. Alles op één plek.",
      cta1: "Start gratis →",
      cta2: "Ik ben coach →",
    },
    problem: {
      badge: "Het probleem",
      h2: "De meeste mensen weten wat ze moeten doen.",
      h2sub: "Ze doen het alleen niet consistent.",
      p: "Mensen willen sterker, gezonder of meer gefocust worden. Ze kennen de stappen. Maar de consistentie breekt af. Niet door motivatie — maar omdat er geen systeem is dat dagelijkse verantwoording, duidelijke commitments en feedback geeft als het moeilijk wordt.",
    },
    coaching: {
      badge: "De coach",
      h2: "Daarom bestaat coaching.",
      p: "Coaches helpen mensen doelen te stellen en richting te geven. Maar zelfs de beste coaches kunnen hun klanten niet elke dag monitoren. Het echte werk gebeurt tussen sessies. Daar wordt consistentie gewonnen of verloren.",
    },
    solution: {
      badge: "De oplossing",
      h2: "Stayd vult het gat tussen sessies.",
      sub: "Alles wat je klanten nodig hebben om consistent te blijven. Van dagelijkse commitments tot voedingsschema's en workouts — Stayd regisseert het geheel.",
      features: [
        { num: "01", title: "Dagelijkse commitment",      desc: "Klanten committen via WhatsApp aan wat ze vandaag gaan doen. Één heldere intentie, elke ochtend." },
        { num: "02", title: "Uitvoering bijhouden",       desc: "Streaks, gemiste dagen en patronen worden automatisch bijgehouden — voor de coach in één oogopslag zichtbaar." },
        { num: "03", title: "Metrics bijhouden",          desc: "Gewicht, kcal en stappen dagelijks bijhouden via WhatsApp. Geen handmatige invoer, geen aparte app." },
        { num: "04", title: "AI als regisseur",           desc: "De Stayd AI kent je doel, bewaakt je progressie en stuurt actief bij. Geen generieke bot — een coach die jouw verhaal kent en elke dag de juiste toon aanslaat." },
        { num: "05", title: "Voortgangsinzichten",        desc: "Trends en patronen zichtbaar voor zowel coach als klant. Spot wie ondersteuning nodig heeft voordat ze afhaken." },
        { num: "06", title: "Voedingsschema",             desc: "Coach stelt een persoonlijk voedingsplan in. Klanten zien dagelijks hun kcal- en eiwitdoelen — direct in de app." },
        { num: "07", title: "Voedingstracker",            desc: "Klanten loggen maaltijden via barcodescan of zoeken in de Open Food Facts database. Coach ziet macro-voortgang per dag." },
        { num: "08", title: "Boodschappenlijst",          desc: "AI genereert automatisch een weekboodschappenlijst op basis van het voedingsschema. Eén tik om te exporteren." },
        { num: "09", title: "Persoonlijke herinneringen", desc: "Klanten stellen dagelijkse of eenmalige herinneringen in via WhatsApp. Geen extra app nodig — gewoon één bericht." },
        { num: "10", title: "Workouts leveren",           desc: "Coach plant workouts, klanten ontvangen ze in de app met oefeningsinstructies en gewichtlogging." },
      ],
    },
    system: {
      badge: "Het systeem",
      h2: "Het Stayd Discipline Systeem.",
      steps: [
        { step: "Commit",      color: G,         desc: "Elke ochtend committeert de klant aan één concreet doel voor die dag. Helder, specifiek, uitvoerbaar." },
        { step: "Execute",   color: "#60a5fa", desc: "De klant werkt de hele dag aan zijn commitment. Stayd houdt bij of ze het doorvoeren." },
        { step: "Reflect",   color: "#f59e0b", desc: "'s Avonds check-in van Stayd. Heb je het gedaan? Een eerlijk antwoord stuurt de volgende stap." },
        { step: "Recover",   color: "#a78bfa", desc: "Een dag gemist? Geen probleem. Stayd helpt je terug in het zadel in plaats van in een spiraal. Voortgang boven perfectie." },
      ],
    },
    whatsapp: {
      badge: "WhatsApp",
      h2a: "Discipline zonder",
      h2b: "een app te openen.",
      p: "Klanten installeren niets. Ze reageren gewoon. Commitments, gewicht, calorieën, herinneringen — allemaal via WhatsApp. Workouts en voortgang bijhouden in de app.",
    },
    dashboard: {
      badge: "Coach dashboard",
      h2a: "Coaches zien",
      h2b: "wie uitvoert.",
      p: "Stayd geeft coaches inzicht in wat er tussen sessies gebeurt. Zie welke klanten consistent blijven. Zie wie ondersteuning nodig heeft. Minder tijd aan achternazitten — meer tijd aan coachen.",
      bullets: [
        "Bekijk dagelijkse metrics — gewichtstendensen, kcal-doelen en macro-voortgang",
        "Volledige klanthistorie — commitments, metrics en gesprekken op één plek",
      ],
    },
    cta: {
      h2a: "Zet commitments",
      h2b: "om in",
      h2c: "uitvoering.",
      p: "Stayd helpt personal trainers meer consistente klanten op te bouwen.",
      btn: "Start gratis →",
    },
    contact: {
      badge: "Contact",
      h2: "Neem contact op.",
      p: "Vragen over Stayd of wil je beginnen? Stuur een bericht en we reageren binnen één werkdag.",
      name: "Naam",
      email: "E-mail",
      message: "Bericht",
      namePlaceholder: "Jouw naam",
      emailPlaceholder: "jij@email.com",
      msgPlaceholder: "Vertel ons over jouw coaching praktijk...",
      send: "Bericht versturen",
      sending: "Versturen...",
      successTitle: "Bericht verzonden.",
      successSub: "We reageren binnen één werkdag.",
      sendAnother: "Nog een bericht →",
      error: "Er ging iets mis. Probeer opnieuw of mail ons direct.",
    },
    footer: { tagline: "Commit. Execute. Reflect. Recover." },
    seo: "Stayd is een accountability app voor personal trainers en coaches in Nederland. Automatische WhatsApp check-ins, metrics tracking en AI coaching helpen coaches hun klanten consistent houden tussen sessies door.",
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

function PhoneFrame({ src, alt, fetchpriority }) {
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
        <img src={src} alt={alt} width={208} height={450} loading={fetchpriority ? "eager" : "lazy"} fetchpriority={fetchpriority} style={{ width: "100%", display: "block" }} />
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
      <div style={{ height: 28, background: "var(--ink)", display: "flex", alignItems: "center", padding: "0 14px", gap: 6 }}>
        {["#ff5f57","#ffbd2e","#28c840"].map(c => (
          <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
        ))}
      </div>
      <img src={src} alt={alt} width={560} height={360} loading="lazy" style={{ width: "100%", display: "block" }} />
    </div>
  )
}

// ── Lang toggle (shared between desktop + mobile) ─────────────
const LANG_LABELS = { NL: "Nederlands", EN: "English" }

function LangToggle({ lang, setLang }) {
  return (
    <div role="group" aria-label="Taal kiezen" style={{ display: "flex", alignItems: "center", gap: 0 }}>
      {[["NL","🇳🇱"],["EN","🇬🇧"]].map(([code, flag], i) => (
        <span key={code} style={{ display: "flex", alignItems: "center" }}>
          {i > 0 && <span aria-hidden="true" style={{ color: "#333", fontSize: 11, padding: "0 1px" }}>|</span>}
          <button
            onClick={() => setLang(code)}
            aria-label={LANG_LABELS[code]}
            aria-pressed={lang === code}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 15, padding: "4px 5px", lineHeight: 1,
              opacity: lang === code ? 1 : 0.4,
            }}
          >
            <span aria-hidden="true">{flag}</span>
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
        <img src="/logo/stayd-wordmark-op-donker.png" alt="stayd." style={{ height: 32, display: "block", mixBlendMode: "screen" }} />

        {/* Desktop links */}
        <div className="nav-links" style={{ display: "flex", gap: 32 }}>
          {t.navLinks.map(l => <a key={l.href} href={l.href}>{l.label}</a>)}
        </div>

        {/* Desktop right */}
        <div className="nav-right" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Link href="/website/b2c" style={{ color: SUB, fontSize: 13, textDecoration: "none", whiteSpace: "nowrap" }}>
            {t.navSwitcher}
          </Link>
          <LangToggle lang={lang} setLang={setLang} />
          <Link href="/coach-signup" className="btn-green" style={{ padding: "8px 20px", fontSize: 13 }}>{t.navCta}</Link>
        </div>

        {/* Mobile hamburger */}
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

      {/* Mobile dropdown */}
      {open && (
        <div style={{ background: "var(--ink)", borderTop: `1px solid ${BORDER}`, padding: "8px 0 16px" }}>
          {t.navLinks.map(l => (
            <a key={l.href} href={l.href} onClick={close} style={{
              display: "block", padding: "12px 24px",
              color: "#ccc", fontSize: 15, textDecoration: "none",
              borderBottom: `1px solid ${BORDER}`,
            }}>
              {l.label}
            </a>
          ))}
          <Link href="/website/b2c" onClick={close} style={{
            display: "block", padding: "12px 24px",
            color: SUB, fontSize: 14, textDecoration: "none",
            borderBottom: `1px solid ${BORDER}`,
          }}>
            {t.navSwitcher}
          </Link>
          <div style={{ padding: "12px 24px", borderBottom: `1px solid ${BORDER}` }}>
            <LangToggle lang={lang} setLang={setLang} />
          </div>
          <div style={{ padding: "14px 24px 0" }}>
            <Link href="/coach-signup" className="btn-green" style={{ display: "inline-block", padding: "10px 24px", fontSize: 14 }} onClick={close}>
              {t.navCta}
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}

// ── Contact form ──────────────────────────────────────────────
function ContactForm({ t }) {
  const tc = t.contact
  const [fields, setFields]   = useState({ name: "", email: "", message: "" })
  const [status, setStatus]   = useState("idle")
  const [focused, setFocused] = useState("")

  const set = (k) => (e) => setFields(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus("sending")
    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(fields),
      })
      if (res.ok) { setStatus("success"); setFields({ name: "", email: "", message: "" }) }
      else setStatus("error")
    } catch {
      setStatus("error")
    }
  }

  const inputStyle = (key) => ({
    width: "100%", padding: "12px 16px", borderRadius: 8,
    background: "var(--ink)", color: "#fff", fontSize: 14,
    border: `1px solid ${focused === key ? G : "#2a2a2a"}`,
    outline: "none", boxSizing: "border-box", transition: "border-color 0.15s",
  })

  if (status === "success") {
    return (
      <div style={{ background: "#0a1a0f", border: `1px solid #1a4d2a`, borderRadius: 12, padding: "32px 28px" }}>
        <p style={{ color: G, fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{tc.successTitle}</p>
        <p style={{ color: "#888", fontSize: 14 }}>{tc.successSub}</p>
        <button onClick={() => setStatus("idle")} style={{ marginTop: 20, background: "none", border: "none", color: G, fontSize: 14, cursor: "pointer", padding: 0 }}>
          {tc.sendAnother}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label style={{ display: "block", fontSize: 12, color: "#555", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{tc.name}</label>
        <input
          type="text" required value={fields.name} onChange={set("name")}
          placeholder={tc.namePlaceholder}
          autoComplete="name" name="name"
          onFocus={() => setFocused("name")} onBlur={() => setFocused("")}
          style={inputStyle("name")}
        />
      </div>
      <div>
        <label style={{ display: "block", fontSize: 12, color: "#555", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{tc.email}</label>
        <input
          type="email" required value={fields.email} onChange={set("email")}
          placeholder={tc.emailPlaceholder}
          autoComplete="email" name="email" spellCheck="false"
          onFocus={() => setFocused("email")} onBlur={() => setFocused("")}
          style={inputStyle("email")}
        />
      </div>
      <div>
        <label style={{ display: "block", fontSize: 12, color: "#555", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{tc.message}</label>
        <textarea
          required value={fields.message} onChange={set("message")}
          placeholder={tc.msgPlaceholder}
          rows={5}
          onFocus={() => setFocused("message")} onBlur={() => setFocused("")}
          style={{ ...inputStyle("message"), resize: "vertical", fontFamily: "inherit" }}
        />
      </div>
      {status === "error" && (
        <p style={{ color: "#ef4444", fontSize: 13 }}>{tc.error}</p>
      )}
      <button
        type="submit" disabled={status === "sending"}
        style={{ padding: "13px 28px", background: status === "sending" ? "#1a4d2a" : G, color: "#000", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: status === "sending" ? "default" : "pointer", transition: "opacity 0.15s", alignSelf: "flex-start", opacity: status === "sending" ? 0.7 : 1 }}
      >
        {status === "sending" ? tc.sending : tc.send}
      </button>
    </form>
  )
}

// ── Main ──────────────────────────────────────────────────────
export default function Website() {
  const [lang, setLang] = useState("EN")
  const t = T[lang]

  useEffect(() => {
    const noMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!noMotion) document.documentElement.style.scrollBehavior = "smooth"
    return () => { document.documentElement.style.scrollBehavior = "" }
  }, [])

  return (
    <div style={{ background: BG, color: TEXT, fontFamily: "system-ui, -apple-system, sans-serif", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:ital,wght@0,400;0,600;0,700;1,400&display=swap');

        /* ── Animaties ── */
        @keyframes axisUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes axisFade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .hero-title      { animation: axisUp   0.85s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
        .hero-sub1       { animation: axisUp   0.75s cubic-bezier(0.16,1,0.3,1) 0.22s both; }
        .hero-sub2       { animation: axisUp   0.75s cubic-bezier(0.16,1,0.3,1) 0.34s both; }
        .hero-ctas       { animation: axisUp   0.75s cubic-bezier(0.16,1,0.3,1) 0.46s both; }
        .hero-phone-anim { animation: axisFade 1.1s  ease                        0.2s  both; }

        /* ── Nav ── */
        .nav-links a { color: ${SUB}; text-decoration: none; font-size: 14px; transition: color 0.15s; }
        .nav-links a:hover { color: ${TEXT}; }

        /* ── Buttons ── */
        .btn-ghost { background: transparent; border: 1px solid #333; color: ${SUB}; padding: 10px 20px; border-radius: 8px; font-size: 14px; cursor: pointer; text-decoration: none; transition: border-color 0.15s, color 0.15s; display: inline-block; touch-action: manipulation; }
        .btn-ghost:hover { border-color: #555; color: ${TEXT}; }
        .btn-green { background: ${G}; color: #000; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; text-decoration: none; display: inline-block; transition: opacity 0.15s, transform 0.15s; border: none; touch-action: manipulation; }
        .btn-green:hover { opacity: 0.88; transform: translateY(-1px); }
        .btn-green-outline { background: transparent; border: 1px solid ${G}; color: ${G}; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-block; transition: background 0.15s; touch-action: manipulation; }
        .btn-green-outline:hover { background: #0a1a0f; }

        /* ── Typografie ── */
        h1, h2, h3 { text-wrap: balance; }
        #probleem, #oplossing, #prijzen, #contact { scroll-margin-top: 70px; }

        /* ── Feature kaarten ── */
        .feature-card {
          background: ${CARD}; border: 1px solid ${BORDER}; border-radius: 14px;
          padding: 28px; flex: 1; min-width: 240px;
          position: relative; overflow: hidden;
          transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s;
        }
        .feature-card:hover {
          border-color: rgba(34,197,94,0.22);
          box-shadow: 0 12px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(34,197,94,0.1);
          transform: translateY(-3px);
        }
        .feature-watermark {
          position: absolute; bottom: -8px; right: 10px;
          font-family: 'Chakra Petch', monospace;
          font-size: 88px; font-weight: 700; line-height: 1;
          color: rgba(34,197,94,0.04); pointer-events: none;
          user-select: none; letter-spacing: -4px;
        }
        .feature-num-label {
          font-family: 'Chakra Petch', monospace;
          font-size: 10px; color: ${G}; font-weight: 600;
          letter-spacing: 3px; margin-bottom: 16px; display: block;
        }

        /* ── Stap kaarten ── */
        .step-card {
          background: ${CARD}; border: 1px solid ${BORDER}; border-radius: 14px;
          padding: 28px 24px; flex: 1; min-width: 180px;
          transition: border-color 0.2s, background 0.2s;
          position: relative;
        }
        .step-card:hover { border-color: rgba(34,197,94,0.18); background: #121212; }
        .step-icon-box { transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1); }
        .step-card:hover .step-icon-box { transform: scale(1.15); }
        .step-label {
          font-family: 'Chakra Petch', monospace;
          font-size: 15px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; margin-bottom: 10px;
        }
        .steps-wrapper { position: relative; }
        .steps-connector {
          position: absolute; top: 44px; left: 52px; right: 52px; height: 1px;
          background: linear-gradient(90deg, transparent 0%, #252525 15%, #252525 85%, transparent 100%);
          pointer-events: none; z-index: 0;
        }

        /* ── Pricing ── */
        .pricing-card { background: ${CARD}; border: 1px solid ${BORDER}; border-radius: 16px; padding: 36px; flex: 1; min-width: 260px; display: flex; flex-direction: column; gap: 20px; }
        .pricing-popular { border-color: ${G}; box-shadow: 0 0 0 1px ${G}22, 0 16px 48px rgba(34,197,94,0.08); }
        .check-item { display: flex; align-items: flex-start; gap: 10px; font-size: 14px; color: ${SUB}; line-height: 1.5; }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .hero-grid { flex-direction: column !important; }
          .hero-phone { display: none !important; }
          .split-left { flex-direction: column !important; }
          .split-right { flex-direction: column-reverse !important; }
          .pricing-grid { flex-direction: column !important; }
          .steps-grid { flex-wrap: wrap !important; }
          .feature-grid { flex-direction: column !important; }
          .nav-links { display: none !important; }
          .nav-right { display: none !important; }
          .nav-hamburger { display: block !important; }
          .steps-connector { display: none; }
        }

        /* ── Reduced motion ── */
        @media (prefers-reduced-motion: reduce) {
          .hero-title, .hero-sub1, .hero-sub2, .hero-ctas, .hero-phone-anim {
            animation: none; opacity: 1; transform: none;
          }
          .feature-card, .step-card, .step-icon-box, .btn-green { transition: none; }
        }
      `}</style>

      {/* ── NAV ─────────────────────────────────────────────── */}
      <Nav lang={lang} setLang={setLang} t={t} />

      {/* ── HERO ────────────────────────────────────────────── */}
      <div style={{ maxWidth: MAX, margin: "0 auto", padding: "96px 24px 80px", position: "relative" }}>
        {/* Ambient glow */}
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          background: "radial-gradient(ellipse 75% 55% at 68% 28%, rgba(34,197,94,0.07) 0%, transparent 65%), radial-gradient(ellipse 35% 35% at 15% 85%, rgba(34,197,94,0.03) 0%, transparent 60%)",
        }} />
        <div className="hero-grid" style={{ display: "flex", alignItems: "center", gap: 64, position: "relative", zIndex: 1 }}>

          <div style={{ flex: 1, minWidth: 0 }}>
            <Badge>{t.hero.badge}</Badge>
            <h1 className="hero-title" style={{
              fontFamily: "'Chakra Petch', monospace",
              fontSize: "clamp(38px, 5.2vw, 68px)",
              fontWeight: 700, lineHeight: 1.0,
              margin: "24px 0 20px", letterSpacing: "-0.01em",
              textTransform: "uppercase",
            }}>
              {t.hero.h1a}<br />
              <span style={{ color: G }}>{t.hero.h1b}</span>
            </h1>
            <p className="hero-sub1" style={{ fontSize: 22, color: "#ccc", marginBottom: 12, fontWeight: 500 }}>
              {t.hero.sub1}
            </p>
            <p className="hero-sub2" style={{ fontSize: 16, color: SUB, marginBottom: 36, lineHeight: 1.7, maxWidth: 480 }}>
              {t.hero.sub2}
            </p>
            <div className="hero-ctas" style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
              <Link href="/coach-signup" className="btn-green">{t.hero.cta1}</Link>
              <Link href="/login" className="btn-ghost">{t.hero.cta2}</Link>
            </div>
          </div>

          <div className="hero-phone hero-phone-anim" style={{ flexShrink: 0 }}>
            <PhoneFrame src="/screenshot-app.png" alt="Stayd app" fetchpriority="high" />
          </div>

        </div>
      </div>

      {/* ── DIVIDER ─────────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${BORDER}` }} />

      {/* ── PROBLEEM ────────────────────────────────────────── */}
      <div id="probleem">
        <Section>
          <div style={{ maxWidth: 700 }}>
            <Badge>{t.problem.badge}</Badge>
            <h2 style={{ fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 800, margin: "20px 0 20px", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
              {t.problem.h2}<br />
              <span style={{ color: SUB }}>{t.problem.h2sub}</span>
            </h2>
            <p style={{ fontSize: 17, color: SUB, lineHeight: 1.8 }}>{t.problem.p}</p>
          </div>
        </Section>
      </div>

      {/* ── COACHING ────────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${BORDER}`, background: "#080808" }}>
        <Section>
          <div style={{ maxWidth: 700 }}>
            <Badge>{t.coaching.badge}</Badge>
            <h2 style={{ fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 800, margin: "20px 0 20px", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
              {t.coaching.h2}
            </h2>
            <p style={{ fontSize: 17, color: SUB, lineHeight: 1.8 }}>{t.coaching.p}</p>
          </div>
        </Section>
      </div>

      {/* ── OPLOSSING ───────────────────────────────────────── */}
      <div id="oplossing" style={{ borderTop: `1px solid ${BORDER}` }}>
        <Section>
          <Badge>{t.solution.badge}</Badge>
          <h2 style={{ fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 800, margin: "20px 0 12px", letterSpacing: "-0.01em" }}>
            {t.solution.h2}
          </h2>
          <p style={{ color: SUB, fontSize: 16, marginBottom: 48, maxWidth: 560 }}>{t.solution.sub}</p>
          <div className="feature-grid" style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {t.solution.features.map(f => (
              <div key={f.num} className="feature-card" style={{ minWidth: 200 }}>
                <div aria-hidden="true" className="feature-watermark">{f.num}</div>
                <span className="feature-num-label">{f.num}</span>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{f.title}</h3>
                <p style={{ color: SUB, fontSize: 14, lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* ── Stayd SYSTEEM ────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${BORDER}`, background: "#080808" }}>
        <Section>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <Badge>{t.system.badge}</Badge>
            <h2 style={{
              fontFamily: "'Chakra Petch', monospace",
              fontSize: "clamp(22px, 3vw, 38px)", fontWeight: 700,
              margin: "20px 0 0", letterSpacing: "0.06em", textTransform: "uppercase",
            }}>
              {t.system.h2}
            </h2>
          </div>
          <div className="steps-grid steps-wrapper" style={{ display: "flex", gap: 16, position: "relative" }}>
            <div aria-hidden="true" className="steps-connector" />
            {t.system.steps.map(s => (
              <div key={s.step} className="step-card" style={{ position: "relative", zIndex: 1 }}>
                <div className="step-icon-box" style={{ width: 36, height: 36, borderRadius: 8, background: s.color + "22", border: `1px solid ${s.color}44`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color }} />
                </div>
                <h3 className="step-label" style={{ color: s.color }}>{s.step}</h3>
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
              <Badge>{t.whatsapp.badge}</Badge>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, margin: "20px 0 16px", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
                {t.whatsapp.h2a}<br />
                {t.whatsapp.h2b}
              </h2>
              <p style={{ color: SUB, fontSize: 16, lineHeight: 1.8 }}>{t.whatsapp.p}</p>
            </div>
          </div>
        </Section>
      </div>

      {/* ── DASHBOARD ───────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${BORDER}`, background: "#080808" }}>
        <Section>
          <div className="split-right" style={{ display: "flex", alignItems: "center", gap: 64 }}>
            <div style={{ flex: 1 }}>
              <Badge>{t.dashboard.badge}</Badge>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, margin: "20px 0 16px", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
                {t.dashboard.h2a}<br />
                {t.dashboard.h2b}
              </h2>
              <p style={{ color: SUB, fontSize: 16, lineHeight: 1.8 }}>{t.dashboard.p}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
                {t.dashboard.bullets.map(item => (
                  <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: SUB, lineHeight: 1.5 }}>
                    <span style={{ color: G, flexShrink: 0 }}>✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <ScreenFrame src="/screenshot-dashboard.png" alt="Coach dashboard" />
          </div>
        </Section>
      </div>

      {/* ── PRICING ─────────────────────────────────────────── */}
      <div id="prijzen" style={{ borderTop: `1px solid ${BORDER}` }}>
        <Section>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <Badge>Prijzen</Badge>
            <h2 style={{ fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 800, margin: "20px 0 12px", letterSpacing: "-0.01em" }}>
              Eenvoudige, transparante prijzen.
            </h2>
            <p style={{ color: SUB, fontSize: 16 }}>Kies het plan dat past bij jouw coachingspraktijk.</p>
          </div>

          <div className="pricing-grid" style={{ display: "flex", gap: 20, alignItems: "stretch" }}>

            {/* Starter */}
            <div className="pricing-card">
              <div>
                <p style={{ color: SUB, fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Starter</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 40, fontWeight: 800 }}>€139</span>
                  <span style={{ color: SUB, fontSize: 14 }}>/maand</span>
                </div>
                <p style={{ color: SUB, fontSize: 13, marginBottom: 24 }}>Tot 15 klanten</p>
                <p style={{ color: "#ccc", fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>Perfect voor zelfstandige coaches die net beginnen.</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                {["Dagelijkse WhatsApp check-ins", "Metrics bijhouden — gewicht, kcal, stappen", "AI coach met geheugen", "Persoonlijke herinneringen via WhatsApp", "Workout bibliotheek — 39 oefeningen met instructies en gewichtlogging", "Progressive overload suggesties", "Basis coach dashboard", "Tot 15 klanten"].map(f => (
                  <div key={f} className="check-item">
                    <span style={{ color: G, flexShrink: 0 }}>✓</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <Link href="/" className="btn-ghost" style={{ textAlign: "center", display: "block", marginTop: 8 }}>Kies dit plan</Link>
            </div>

            {/* Growth */}
            <div className="pricing-card pricing-popular" style={{ position: "relative" }}>
              <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)" }}>
                <span style={{ background: G, color: "#000", fontSize: 11, fontWeight: 700, padding: "3px 14px", borderRadius: 20, letterSpacing: 1, textTransform: "uppercase" }}>Populair</span>
              </div>
              <div>
                <p style={{ color: G, fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Growth</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 40, fontWeight: 800 }}>€399</span>
                  <span style={{ color: SUB, fontSize: 14 }}>/maand</span>
                </div>
                <p style={{ color: SUB, fontSize: 13, marginBottom: 24 }}>Tot 50 klanten</p>
                <p style={{ color: "#ccc", fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>Voor coaches die grip willen op wat er tussen sessies gebeurt.</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                {["Alles van Starter", "Volledig coach dashboard met inzichten", "Klantdetailpagina — volledige geschiedenis", "Voedingsdoelen per klant", "Voedingstracker met barcodescan en Open Food Facts", "Automatische boodschappenlijst op basis van voedingsschema", "Eigen workout builder", "Progressive overload meldingen per klant", "Coach FAQ — train de AI met jouw antwoorden", "WhatsApp support van het Stayd team", "Tot 50 klanten"].map(f => (
                  <div key={f} className="check-item">
                    <span style={{ color: G, flexShrink: 0 }}>✓</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <Link href="/" className="btn-green" style={{ textAlign: "center", display: "block", marginTop: 8 }}>Kies dit plan</Link>
            </div>

            {/* Pro */}
            <div className="pricing-card">
              <div>
                <p style={{ color: SUB, fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Pro</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 40, fontWeight: 800 }}>€699</span>
                  <span style={{ color: SUB, fontSize: 14 }}>/maand</span>
                </div>
                <p style={{ color: SUB, fontSize: 13, marginBottom: 24 }}>Tot 150 klanten</p>
                <p style={{ color: "#ccc", fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>Voor sportscholen en coachingbedrijven die Stayd onder eigen naam willen.</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                {["Alles van Growth", "White label — jouw naam, jouw merk", "Meerdere coach accounts", "Eigen branding op alle berichten", "VIP support", "Tot 150 klanten"].map(f => (
                  <div key={f} className="check-item">
                    <span style={{ color: G, flexShrink: 0 }}>✓</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <button disabled style={{ textAlign: "center", display: "block", width: "100%", padding: "12px", borderRadius: 8, background: "#1a1a1a", border: `1px solid ${BORDER}`, color: "#444", fontSize: 14, cursor: "not-allowed", marginTop: 8 }}>
                Binnenkort beschikbaar
              </button>
            </div>

          </div>
        </Section>
      </div>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${BORDER}`, background: "#080808" }}>
        <Section style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 800, marginBottom: 16, letterSpacing: "-0.02em" }}>
            {t.cta.h2a}<br />
            {t.cta.h2b} <span style={{ color: G }}>{t.cta.h2c}</span>
          </h2>
          <p style={{ color: SUB, fontSize: 17, marginBottom: 36 }}>{t.cta.p}</p>
          <Link href="/coach-signup" className="btn-green" style={{ fontSize: 16, padding: "14px 36px" }}>{t.cta.btn}</Link>
        </Section>
      </div>

      {/* ── CONTACT ─────────────────────────────────────────── */}
      <div id="contact" style={{ borderTop: `1px solid ${BORDER}` }}>
        <Section>
          <div style={{ maxWidth: 560 }}>
            <Badge>{t.contact.badge}</Badge>
            <h2 style={{ fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 800, margin: "20px 0 12px", letterSpacing: "-0.01em" }}>
              {t.contact.h2}
            </h2>
            <p style={{ color: SUB, fontSize: 16, marginBottom: 40, lineHeight: 1.7 }}>{t.contact.p}</p>
            <ContactForm t={t} />
          </div>
        </Section>
      </div>

      {/* ── SEO TEXT ─────────────────────────────────────────── */}
      <div style={{ padding: "0 24px 8px" }}>
        <p style={{ fontSize: 12, color: "#555", textAlign: "center", maxWidth: 640, margin: "0 auto", lineHeight: 1.8 }}>
          {t.seo}
        </p>
      </div>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: "40px 24px" }}>
        <div style={{ maxWidth: MAX, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <span style={{ fontWeight: 700, letterSpacing: "0.15em", fontSize: 18, color: "#fff" }}>stayd.</span>
            <p style={{ color: SUB, fontSize: 12, marginTop: 4 }}>{t.footer.tagline}</p>
          </div>
          <p style={{ color: "#444", fontSize: 12 }}>© 2026 Stayd App</p>
        </div>
      </footer>

    </div>
  )
}
