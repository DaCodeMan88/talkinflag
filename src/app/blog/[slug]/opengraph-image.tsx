import { ImageResponse } from "next/og";
import { getStaticPostBySlug } from "@/lib/static-posts";
import { getPostBySlug, sanityConfigured } from "@/lib/sanity";

export const runtime = "edge";
export const alt = "Blog Post | Talkin Flag";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let title = "Talkin Flag Blog";
  let category = "";
  let author = "Talkin Flag";
  let excerpt = "";

  // Try static posts first
  const staticPost = getStaticPostBySlug(slug);
  if (staticPost) {
    title = staticPost.title;
    category = staticPost.category;
    author = staticPost.author;
    excerpt = staticPost.excerpt;
  } else if (sanityConfigured) {
    try {
      const post = await getPostBySlug(slug);
      if (post) {
        title = post.title;
        category = post.category ?? "";
        author = post.author ?? "Talkin Flag";
        excerpt = post.excerpt ?? "";
      }
    } catch {
      // Fall back to generic
    }
  }

  // Responsive title font size
  const titleFontSize = title.length > 55 ? 46 : title.length > 40 ? 54 : title.length > 28 ? 64 : 76;

  // Truncate excerpt to one short line for the OG card
  const shortExcerpt = excerpt.length > 110 ? excerpt.slice(0, 107) + "…" : excerpt;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#000000",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Yellow accent bar top */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "6px", backgroundColor: "#FDDD58", display: "flex" }} />

        {/* Left border accent */}
        <div style={{ position: "absolute", left: "72px", top: "60px", bottom: "60px", width: "4px", backgroundColor: "#FDDD58", display: "flex" }} />

        {/* Subtle grid bg */}
        <div style={{ position: "absolute", inset: 0, display: "flex", opacity: 0.03 }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ flex: 1, borderRight: "1px solid #FDDD58", display: "flex" }} />
          ))}
        </div>

        {/* Yellow glow bottom-right */}
        <div
          style={{
            position: "absolute",
            bottom: "-80px",
            right: "-80px",
            width: "380px",
            height: "380px",
            borderRadius: "50%",
            backgroundColor: "#FDDD58",
            opacity: 0.08,
            display: "flex",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "72px 80px 72px 104px",
            height: "100%",
            justifyContent: "space-between",
          }}
        >
          {/* Top: Talkin Flag label + category badge */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#FDDD58", display: "flex" }} />
              <span style={{ color: "#FDDD58", fontSize: "15px", letterSpacing: "0.3em", textTransform: "uppercase" }}>
                TALKIN FLAG
              </span>
            </div>
            {category && (
              <div
                style={{
                  backgroundColor: "#FDDD58",
                  color: "#000000",
                  fontSize: "16px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  padding: "5px 16px",
                  textTransform: "uppercase",
                  display: "flex",
                }}
              >
                {category}
              </div>
            )}
          </div>

          {/* Middle: Title + excerpt */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <span
              style={{
                color: "#FFFFFF",
                fontSize: `${titleFontSize}px`,
                fontWeight: 900,
                textTransform: "uppercase",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
              }}
            >
              {title}
            </span>
            {shortExcerpt && (
              <span
                style={{
                  color: "rgba(255,255,255,0.55)",
                  fontSize: "20px",
                  lineHeight: 1.4,
                  maxWidth: "800px",
                }}
              >
                {shortExcerpt}
              </span>
            )}
          </div>

          {/* Bottom: Author + site */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.3)", display: "flex" }} />
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "15px", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                {author}
              </span>
            </div>
            <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.2em" }}>
              talkinflag.com/blog
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
