import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || "The Global Flag Football Podcast";
  const subtitle = searchParams.get("subtitle") || "Hosted by Ambra & Tika Marcucci · Italian National Team 🇮🇹";

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

        {/* Grid lines background */}
        <div style={{ position: "absolute", inset: 0, display: "flex", opacity: 0.04 }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ flex: 1, borderRight: "1px solid #FDDD58", display: "flex" }} />
          ))}
        </div>

        {/* Yellow glow bottom-right */}
        <div
          style={{
            position: "absolute",
            bottom: "-150px",
            right: "-150px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            backgroundColor: "#FDDD58",
            opacity: 0.08,
            display: "flex",
          }}
        />

        {/* Content */}
        <div style={{ display: "flex", flexDirection: "column", padding: "72px 80px", height: "100%", justifyContent: "space-between" }}>
          {/* Top: Network tag */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#FDDD58", display: "flex" }} />
            <span style={{ color: "#FDDD58", fontSize: "16px", letterSpacing: "0.3em", textTransform: "uppercase" }}>
              The Talkin Balls Network
            </span>
          </div>

          {/* Middle: Title */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ color: "#FDDD58", fontSize: "22px", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "12px" }}>
                TALKIN FLAG
              </span>
              <span
                style={{
                  color: "#FFFFFF",
                  fontSize: title.length > 40 ? "52px" : "64px",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                }}
              >
                {title}
              </span>
            </div>
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "24px", marginTop: "8px" }}>
              {subtitle}
            </span>
          </div>

          {/* Bottom: URL */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "40px", height: "2px", backgroundColor: "#FDDD58", display: "flex" }} />
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "18px", letterSpacing: "0.1em" }}>
              talkinflag.com
            </span>
          </div>
        </div>

        {/* Yellow accent bar bottom */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "4px", backgroundColor: "#FDDD58", opacity: 0.4, display: "flex" }} />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
