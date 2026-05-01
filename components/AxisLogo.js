export function AxisLogo({ variant = "breathe", size = 24 }) {
  if (variant === "draw") {
    return (
      <svg className="axis-draw" viewBox="0 0 120 120" width={size * 2} height={size * 2}>
        <circle className="ring"     cx="60" cy="60" r="54" />
        <path   className="cross"    d="M60 12 L60 108 M12 60 L108 60" />
        <path   className="a-stroke" d="M28 92 L60 22 L92 92" />
        <path   className="a-bar"    d="M40 70 L80 70" />
        <rect   className="anchor"   x="55" y="55" width="10" height="10" rx="1.5" />
      </svg>
    )
  }

  if (variant === "loader") {
    return (
      <span className="axis-loader" style={{ fontSize: size }}>
        <i className="d" />
        <b className="c1">A</b><b className="c2">X</b>
        <b className="c3">I</b><b className="c4">S</b>
      </span>
    )
  }

  if (variant === "streak") {
    return (
      <span className="axis-wm axis-streak" style={{ fontSize: size }}>
        <span className="streak-dot">
          <i className="q q1" /><i className="q q2" />
          <i className="q q3" /><i className="q q4" />
        </span>
        AXIS
      </span>
    )
  }

  if (variant === "bracket") {
    return (
      <span className="axis-wm axis-bracket" style={{ fontSize: size }}>
        <span className="br br-l" />
        <i className="dot" />AXIS
        <span className="br br-r" />
      </span>
    )
  }

  // pulse | breathe
  return (
    <span className={`axis-wm axis-${variant}`} style={{ fontSize: size }}>
      <i className="dot" />AXIS
    </span>
  )
}
