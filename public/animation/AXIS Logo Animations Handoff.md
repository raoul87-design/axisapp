# AXIS Logo Animations — Handoff voor Claude Code

Pakket van **6 CSS-only logo-animaties** voor de AXIS app. Geen dependencies, geen JS (behalve voor de loader-replay), geen libraries. Drop-in markup + CSS.

**Brand tokens (gebruik als CSS custom properties):**
```css
:root {
  --axis-bg:    #0f0f0f;
  --axis-text:  #fafafa;
  --axis-green: #22c55e;
  --axis-green-glow: rgba(34, 197, 94, 0.7);
}
```

---

## 📦 Algemene Claude Code prompt (kopieer + plak als startpunt)

```
Voeg de AXIS logo-animaties toe aan de codebase.

Bestand: src/components/AxisLogo/AxisLogo.tsx (of .jsx — match het bestaande project)
Stijl: src/components/AxisLogo/AxisLogo.module.css

De component accepteert een `variant` prop met deze waarden:
- "loader"   → type-in (eenmalig bij mount)
- "draw"     → symbol stroke-draw (loop)
- "pulse"    → dot heartbeat (loop)
- "breathe"  → dot glow-breathe (loop)
- "streak"   → dot streak-fill (loop)
- "bracket"  → viewfinder brackets (hover)

Gebruik de markup en CSS uit het handoff-bestand één-op-één. Vervang
class-namen niet; ze zijn afgestemd op de keyframes.

Default variant: "pulse".

Gebruik `prefers-reduced-motion: reduce` om alle animaties te
neutraliseren — dan toon je alleen de statische staat.
```

---

## 01 · Loader (type-in)

**Waar te gebruiken:**
- App splash screen / login pre-loader
- HomePage hero op cold-load (eerste bezoek)
- Onboarding stap 1 ("Welcome to AXIS")

**Niet gebruiken voor:** elke page transition (wordt irritant), navbars (te druk).

**Markup:**
```html
<span class="axis-loader">
  <i class="d"></i>
  <b class="c1">A</b><b class="c2">X</b><b class="c3">I</b><b class="c4">S</b>
</span>
```

**CSS:**
```css
.axis-loader{
  display:inline-flex; align-items:center;
  font-family:'Inter',sans-serif; font-weight:900;
  letter-spacing:0.18em; font-size:56px; color:var(--axis-text);
}
.axis-loader .d{
  display:inline-block; width:0.38em; height:0.38em;
  border-radius:0.13em; background:var(--axis-green);
  margin-right:0.22em; transform:scale(0);
  animation: axisLDot 0.5s 1.6s cubic-bezier(0.34,1.56,0.64,1) forwards;
}
.axis-loader b{
  display:inline-block; font-weight:900;
  opacity:0; transform:translateY(0.25em);
  animation: axisLCh 0.45s cubic-bezier(0.2,0.8,0.2,1) forwards;
}
.axis-loader .c1{animation-delay:0s}
.axis-loader .c2{animation-delay:0.32s}
.axis-loader .c3{animation-delay:0.64s}
.axis-loader .c4{animation-delay:0.96s}
@keyframes axisLCh{
  0%{opacity:0; transform:translateY(0.25em); filter:blur(2px)}
  100%{opacity:1; transform:translateY(0); filter:blur(0)}
}
@keyframes axisLDot{
  0%{transform:scale(0); box-shadow:0 0 0 rgba(34,197,94,0)}
  60%{transform:scale(1.25); box-shadow:0 0 24px rgba(34,197,94,0.9)}
  100%{transform:scale(1); box-shadow:0 0 12px rgba(34,197,94,0.5)}
}
```

**Claude Code prompt:**
```
Toon variant="loader" op de splash screen voor 2 seconden, daarna
fade naar de hoofdroute. Total perceived load: ~2.5s.
```

---

## 02 · Symbol Stroke Draw

**Waar te gebruiken:**
- Empty states ("Geen reflecties vandaag — start nu")
- Loading skeletons in plaats van een spinner
- Footer ambient mark
- Dashboard zijbalk-icon op idle

**Niet gebruiken voor:** primary CTAs (steelt aandacht).

**Markup:**
```html
<svg class="axis-draw" viewBox="0 0 120 120" width="64" height="64">
  <circle class="ring" cx="60" cy="60" r="54"/>
  <path class="cross" d="M60 12 L60 108 M12 60 L108 60"/>
  <path class="a-stroke" d="M28 92 L60 22 L92 92"/>
  <path class="a-bar" d="M40 70 L80 70"/>
  <rect class="anchor" x="55" y="55" width="10" height="10" rx="1.5"/>
</svg>
```

**CSS:**
```css
.axis-draw .ring  { fill:none; stroke:rgba(255,255,255,0.12); stroke-width:1.5 }
.axis-draw .cross { fill:none; stroke:rgba(255,255,255,0.14); stroke-width:1; stroke-dasharray:2 4 }
.axis-draw .a-stroke{
  fill:none; stroke:var(--axis-green); stroke-width:6;
  stroke-dasharray:200; stroke-dashoffset:200;
  animation: axisDrawA 4.5s ease-in-out infinite;
}
.axis-draw .a-bar{
  fill:none; stroke:var(--axis-green); stroke-width:6;
  stroke-dasharray:40; stroke-dashoffset:40;
  animation: axisDrawBar 4.5s ease-in-out infinite;
}
.axis-draw .anchor{
  fill:var(--axis-green); transform-origin:60px 60px;
  transform:scale(0); animation: axisAnchor 4.5s ease-in-out infinite;
}
@keyframes axisDrawA{
  0%,5%{stroke-dashoffset:200}
  35%{stroke-dashoffset:0}
  75%{opacity:1}
  95%,100%{stroke-dashoffset:0; opacity:0.15}
}
@keyframes axisDrawBar{
  0%,35%{stroke-dashoffset:40}
  50%{stroke-dashoffset:0}
  75%{opacity:1}
  95%,100%{opacity:0.15}
}
@keyframes axisAnchor{
  0%,50%{transform:scale(0)}
  62%{transform:scale(1.4)}
  72%,90%{transform:scale(1)}
  95%,100%{transform:scale(1); opacity:0.15}
}
```

**Claude Code prompt:**
```
Vervang de huidige <Spinner /> in EmptyState.tsx met de AXIS draw-mark
op 96×96. Centreer 'm verticaal met de empty-state copy.
```

---

## 03 · Pulse Dot (heartbeat)

**Waar te gebruiken:**
- Top-bar logo wanneer er een **actieve streak** loopt
- "Live" badge op het dashboard tijdens coaching-sessies
- Notification indicator wanneer er iets te reflecteren is

**Niet gebruiken voor:** statische marketing-paginas (lijkt op een storing).

**Markup + CSS:**
```html
<span class="axis-wm axis-pulse"><i class="dot"></i>AXIS</span>
```
```css
.axis-wm{
  display:inline-flex; align-items:center;
  font-family:'Inter',sans-serif; font-weight:900;
  letter-spacing:0.18em; font-size:24px; color:var(--axis-text);
}
.axis-wm .dot{
  display:inline-block; width:0.38em; height:0.38em;
  border-radius:0.13em; background:var(--axis-green);
  margin-right:0.22em;
}
.axis-pulse .dot{ animation: axisPulse 1.6s ease-in-out infinite }
@keyframes axisPulse{
  0%,100%{transform:scale(1); box-shadow:0 0 0 rgba(34,197,94,0)}
  50%{transform:scale(1.18); box-shadow:0 0 18px rgba(34,197,94,0.7)}
}
```

**Claude Code prompt:**
```
In de TopBar component: als `user.activeStreak > 0`, gebruik
variant="pulse"; anders variant="breathe".
```

---

## 04 · Glow Breathe (rustig)

**Waar te gebruiken:**
- Default top-bar logo (rust-staat)
- Login screen
- Settings / minder-actieve schermen

**Markup:** zelfde als pulse maar `axis-breathe` ipv `axis-pulse`.

**CSS:**
```css
.axis-breathe .dot{ animation: axisBreathe 3.6s ease-in-out infinite }
@keyframes axisBreathe{
  0%,100%{box-shadow:0 0 0 rgba(34,197,94,0), 0 0 0 rgba(34,197,94,0)}
  50%{box-shadow:0 0 14px rgba(34,197,94,0.5),
                 0 0 32px rgba(34,197,94,0.25)}
}
```

---

## 05 · Streak Fill

**Waar te gebruiken:**
- Dashboard streak-widget (maak 'm groot, ~80px font-size, als hero)
- Weekoverzicht / progress section
- Push-notification badge die toont hoever de week is

**Niet gebruiken voor:** klein op een navbar (de quadrants worden onleesbaar).

**Markup:**
```html
<span class="axis-wm axis-streak">
  <span class="streak-dot">
    <i class="q q1"></i><i class="q q2"></i><i class="q q3"></i><i class="q q4"></i>
  </span>AXIS
</span>
```

**CSS:**
```css
.axis-streak .streak-dot{
  position:relative; display:inline-block;
  width:0.38em; height:0.38em;
  border-radius:0.13em; margin-right:0.22em;
  background:rgba(34,197,94,0.15);
  border:1px solid rgba(34,197,94,0.4);
  overflow:hidden;
}
.axis-streak .q{
  position:absolute; width:50%; height:50%;
  background:var(--axis-green); opacity:0;
  animation: axisStreakFill 4.8s ease-in-out infinite;
}
.axis-streak .q1{top:0;left:0; animation-delay:0s}
.axis-streak .q2{top:0;right:0; animation-delay:0.6s}
.axis-streak .q3{bottom:0;right:0; animation-delay:1.2s}
.axis-streak .q4{bottom:0;left:0; animation-delay:1.8s}
@keyframes axisStreakFill{
  0%,40%{opacity:0}
  8%{opacity:1}
  50%{opacity:1}
  65%,100%{opacity:0}
}
```

**Claude Code prompt:**
```
In StreakWidget.tsx: bind het aantal gevulde quadrants aan
`completedDays % 4`. Vervang de auto-loop door een data-driven state:
zet `style={{ '--filled': completedDays }}` en update keyframes naar
quadrant-toggles op basis van die var.
```

---

## 06 · Bracket Frame (hover)

**Waar te gebruiken:**
- HomePage hero CTA — "logo earned focus"
- Pricing/marketing pagina logo
- Footer mark op marketing-site

**Niet gebruiken voor:** in-app (geen hover op mobiel).

**Markup:**
```html
<span class="axis-wm axis-bracket">
  <span class="br br-l"></span>
  <i class="dot"></i>AXIS
  <span class="br br-r"></span>
</span>
```

**CSS:**
```css
.axis-bracket{ position:relative; padding:0 0.4em; cursor:pointer; user-select:none }
.axis-bracket .br{
  position:absolute; top:-0.18em; bottom:-0.18em; width:0.32em;
  border:2px solid var(--axis-green); opacity:0;
  transition: opacity 0.3s ease,
              transform 0.4s cubic-bezier(0.34,1.56,0.64,1);
}
.axis-bracket .br-l{ left:0;  border-right:none; transform:translateX(8px) }
.axis-bracket .br-r{ right:0; border-left:none;  transform:translateX(-8px) }
.axis-bracket:hover .br{ opacity:1; transform:translateX(0) }
.axis-bracket:hover .dot{ box-shadow:0 0 22px rgba(34,197,94,0.7) }
.axis-bracket .dot{ transition: box-shadow 0.3s ease }
```

---

## React component (alle varianten in één)

```tsx
// AxisLogo.tsx
import styles from './AxisLogo.module.css';

type Variant = 'loader' | 'draw' | 'pulse' | 'breathe' | 'streak' | 'bracket';

export function AxisLogo({
  variant = 'pulse',
  size = 24,
}: { variant?: Variant; size?: number }) {
  if (variant === 'draw') {
    return (
      <svg className={styles.draw} viewBox="0 0 120 120" width={size*2} height={size*2}>
        <circle className={styles.ring} cx="60" cy="60" r="54"/>
        <path className={styles.cross} d="M60 12 L60 108 M12 60 L108 60"/>
        <path className={styles.aStroke} d="M28 92 L60 22 L92 92"/>
        <path className={styles.aBar} d="M40 70 L80 70"/>
        <rect className={styles.anchor} x="55" y="55" width="10" height="10" rx="1.5"/>
      </svg>
    );
  }

  const className = `${styles.wm} ${styles[variant]}`;
  return (
    <span className={className} style={{ fontSize: size }}>
      {variant === 'streak' ? (
        <span className={styles.streakDot}>
          <i className={`${styles.q} ${styles.q1}`}/>
          <i className={`${styles.q} ${styles.q2}`}/>
          <i className={`${styles.q} ${styles.q3}`}/>
          <i className={`${styles.q} ${styles.q4}`}/>
        </span>
      ) : variant === 'bracket' ? (
        <>
          <span className={`${styles.br} ${styles.brL}`}/>
          <i className={styles.dot}/>AXIS
          <span className={`${styles.br} ${styles.brR}`}/>
        </>
      ) : variant === 'loader' ? (
        <>
          <i className={styles.dot}/>
          <b className={styles.c1}>A</b><b className={styles.c2}>X</b>
          <b className={styles.c3}>I</b><b className={styles.c4}>S</b>
        </>
      ) : (
        <><i className={styles.dot}/>AXIS</>
      )}
    </span>
  );
}
```

---

## Reduced motion

Voeg dit altijd toe aan je AxisLogo.module.css:

```css
@media (prefers-reduced-motion: reduce){
  .axis-loader b, .axis-loader .d,
  .axis-draw .a-stroke, .axis-draw .a-bar, .axis-draw .anchor,
  .axis-pulse .dot, .axis-breathe .dot,
  .axis-streak .q,
  .axis-bracket .br {
    animation: none !important;
    transition: none !important;
    opacity: 1 !important;
    transform: none !important;
    stroke-dashoffset: 0 !important;
  }
}
```

---

## Aanbevolen mapping

| Plek                              | Variant   | Notities |
|-----------------------------------|-----------|----------|
| Splash / cold-load                | `loader`  | 2.0s, dan auto-route |
| HomePage hero                     | `bracket` | Hover-detail |
| Top-bar (default)                 | `breathe` | Stil, ambient |
| Top-bar (active streak)           | `pulse`   | Conditional |
| Dashboard streak-widget           | `streak`  | Data-driven |
| Empty states / loading skeletons  | `draw`    | i.p.v. spinner |
| Footer marketing site             | `draw`    | Klein, ambient |

---

**Bronfile met live demo:** `AXIS Logo Animations.html` (deze repo)
