"use client"

import Link from "next/link"
import { blogPosts } from "../../lib/blog"

const G      = "#22c55e"
const BG     = "#0f0f0f"
const CARD   = "#111"
const BORDER = "#1e1e1e"
const SUB    = "#888"

export default function BlogPage() {
  return (
    <div style={{ background: BG, minHeight: "100vh", color: "#fff", fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* Nav */}
      <nav style={{ borderBottom: `1px solid ${BORDER}`, padding: "0 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ fontWeight: 800, letterSpacing: "0.15em", fontSize: 18, color: "#fff", textDecoration: "none" }}>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: G, marginRight: 8, verticalAlign: "middle" }} />
            AXIS
          </Link>
          <Link href="/" style={{ color: SUB, fontSize: 14, textDecoration: "none" }}>← Terug naar home</Link>
        </div>
      </nav>

      {/* Header */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "72px 24px 48px" }}>
        <span style={{ background: "#0a1a0f", color: G, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, padding: "4px 12px", borderRadius: 20, border: `1px solid #1a4d2a`, textTransform: "uppercase" }}>
          Blog
        </span>
        <h1 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, lineHeight: 1.15, margin: "20px 0 12px", letterSpacing: "-0.02em" }}>
          Tips voor personal trainers
        </h1>
        <p style={{ color: SUB, fontSize: 16, lineHeight: 1.7, margin: 0 }}>
          Praktische inzichten over accountability, client opvolging en consistentie.
        </p>
      </div>

      {/* Articles */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px 96px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {blogPosts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: "none" }}>
              <article style={{
                background: CARD,
                border: `1px solid ${BORDER}`,
                borderRadius: 12,
                padding: "28px 32px",
                transition: "border-color 0.15s",
                cursor: "pointer",
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#2a4d2a"}
                onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}
              >
                <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "center" }}>
                  <span style={{ color: SUB, fontSize: 12 }}>{post.date}</span>
                  <span style={{ color: "#333", fontSize: 12 }}>·</span>
                  <span style={{ color: SUB, fontSize: 12 }}>{post.readTime} leestijd</span>
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 10px", lineHeight: 1.35 }}>
                  {post.title}
                </h2>
                <p style={{ color: SUB, fontSize: 14, lineHeight: 1.65, margin: "0 0 16px" }}>
                  {post.description}
                </p>
                <span style={{ color: G, fontSize: 13, fontWeight: 600 }}>Lees artikel →</span>
              </article>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}
