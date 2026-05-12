import Link from "next/link"
import { notFound } from "next/navigation"
import { blogPosts, getPostBySlug } from "../../../lib/blog"

const G      = "#22c55e"
const BG     = "#0f0f0f"
const BORDER = "#1e1e1e"
const SUB    = "#888"

export async function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }) {
  const post = getPostBySlug(params.slug)
  if (!post) return {}
  return {
    title: `${post.title} — AXIS`,
    description: post.description,
    alternates: {
      canonical: `https://axisapp.nl/blog/${post.slug}`,
    },
    openGraph: {
      title: `${post.title} — AXIS`,
      description: post.description,
      url: `https://axisapp.nl/blog/${post.slug}`,
      siteName: "AXIS",
      locale: "nl_NL",
      type: "article",
    },
  }
}

function renderContent(raw) {
  const blocks = raw.trim().split(/\n\n+/)
  return blocks.map((block, i) => {
    block = block.trim()
    if (!block) return null

    if (block.startsWith("## ")) {
      return (
        <h2 key={i} style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: "40px 0 14px", lineHeight: 1.3 }}>
          {block.slice(3)}
        </h2>
      )
    }

    // List items
    if (block.includes("\n- ") || block.startsWith("- ")) {
      const lines = block.split("\n").filter(Boolean)
      return (
        <ul key={i} style={{ margin: "0 0 20px", paddingLeft: 24, color: "#ccc", lineHeight: 1.8 }}>
          {lines.map((line, j) => {
            const text = line.replace(/^- /, "")
            return (
              <li key={j} dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
            )
          })}
        </ul>
      )
    }

    const html = block.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    return (
      <p key={i} style={{ color: "#ccc", lineHeight: 1.8, margin: "0 0 20px", fontSize: 16 }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  })
}

export default function BlogPostPage({ params }) {
  const post = getPostBySlug(params.slug)
  if (!post) notFound()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { "@type": "Organization", name: "AXIS" },
    publisher: { "@type": "Organization", name: "AXIS", url: "https://axisapp.nl" },
  }

  return (
    <div style={{ background: BG, minHeight: "100vh", color: "#fff", fontFamily: "Inter, system-ui, sans-serif" }}>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Nav */}
      <nav style={{ borderBottom: `1px solid ${BORDER}`, padding: "0 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ fontWeight: 800, letterSpacing: "0.15em", fontSize: 18, color: "#fff", textDecoration: "none" }}>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: G, marginRight: 8, verticalAlign: "middle" }} />
            AXIS
          </Link>
          <Link href="/blog" style={{ color: SUB, fontSize: 14, textDecoration: "none" }}>← Terug naar blog</Link>
        </div>
      </nav>

      {/* Article */}
      <article style={{ maxWidth: 680, margin: "0 auto", padding: "64px 24px 96px" }}>

        {/* Meta */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
          <span style={{ background: "#0a1a0f", color: G, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, padding: "4px 12px", borderRadius: 20, border: `1px solid #1a4d2a`, textTransform: "uppercase" }}>
            Blog
          </span>
          <span style={{ color: SUB, fontSize: 13 }}>{post.date}</span>
          <span style={{ color: "#333" }}>·</span>
          <span style={{ color: SUB, fontSize: 13 }}>{post.readTime} leestijd</span>
        </div>

        <h1 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, lineHeight: 1.2, margin: "0 0 32px", letterSpacing: "-0.02em" }}>
          {post.title}
        </h1>

        {/* Content */}
        <div>{renderContent(post.content)}</div>

        {/* CTA */}
        <div style={{ marginTop: 56, padding: "32px", background: "#111", border: `1px solid ${BORDER}`, borderRadius: 12 }}>
          <p style={{ color: G, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 10px" }}>
            AXIS
          </p>
          <p style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 8px" }}>
            Klaar om je klanten dagelijks accountable te houden?
          </p>
          <p style={{ color: SUB, fontSize: 14, margin: "0 0 20px", lineHeight: 1.6 }}>
            AXIS automatiseert de dagelijkse check-ins via WhatsApp zodat jij je focust op coaching.
          </p>
          <Link href="/" style={{ display: "inline-block", background: G, color: "#000", fontWeight: 700, fontSize: 14, padding: "12px 24px", borderRadius: 8, textDecoration: "none" }}>
            Start gratis →
          </Link>
        </div>

      </article>

    </div>
  )
}
