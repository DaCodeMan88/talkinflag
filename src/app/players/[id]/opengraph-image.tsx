import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";
export const alt = "Player Profile | Talkin Flag";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fetch just the fields needed for the image (anon key is safe for public player data)
  let playerName = "Flag Football Player";
  let position = "";
  let ranking = "";
  let level = "";

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
      .from("players")
      .select("first_name, last_name, position, ranking_national, level")
      .eq("id", id)
      .single();

    if (data) {
      playerName = `${data.first_name} ${data.last_name}`;
      position = data.position ?? "";
      ranking = data.ranking_national ? `#${data.ranking_national}` : "";
      level = data.level
        ? data.level.replaceAll("_", " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
        : "";
    }
  } catch {
    // Fall back to generic player image
  }

  const nameFontSize = playerName.length > 20 ? 72 : 88;

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
        {/* Yellow accent bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "6px", backgroundColor: "#FDDD58", display: "flex" }} />

        {/* Left border accent */}
        <div style={{ position: "absolute", left: "72px", top: "60px", bottom: "60px", width: "4px", backgroundColor: "#FDDD58", display: "flex" }} />

        {/* Subtle grid bg */}
        <div style={{ position: "absolute", inset: 0, display: "flex", opacity: 0.03 }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ flex: 1, borderRight: "1px solid #FDDD58", display: "flex" }} />
          ))}
        </div>

        {/* Yellow glow */}
        <div
          style={{
            position: "absolute",
            bottom: "-100px",
            right: "-100px",
            width: "450px",
            height: "450px",
            borderRadius: "50%",
            backgroundColor: "#FDDD58",
            opacity: 0.07,
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
          {/* Top: Network tag + ranking */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#FDDD58", display: "flex" }} />
              <span style={{ color: "#FDDD58", fontSize: "15px", letterSpacing: "0.3em", textTransform: "uppercase" }}>
                TALKIN FLAG
              </span>
            </div>
            {ranking && (
              <div
                style={{
                  backgroundColor: "#FDDD58",
                  color: "#000000",
                  fontSize: "22px",
                  fontWeight: 900,
                  letterSpacing: "0.05em",
                  padding: "6px 18px",
                  display: "flex",
                }}
              >
                {ranking} NATIONAL
              </div>
            )}
          </div>

          {/* Middle: Player name */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <span
              style={{
                color: "#FFFFFF",
                fontSize: `${nameFontSize}px`,
                fontWeight: 900,
                textTransform: "uppercase",
                lineHeight: 1.0,
                letterSpacing: "-0.02em",
              }}
            >
              {playerName}
            </span>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              {position && (
                <div
                  style={{
                    backgroundColor: "#FDDD58",
                    color: "#000000",
                    fontSize: "20px",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    padding: "4px 14px",
                    textTransform: "uppercase",
                    display: "flex",
                  }}
                >
                  {position}
                </div>
              )}
              {level && (
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "18px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {level}
                </span>
              )}
            </div>
          </div>

          {/* Bottom */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "16px", textTransform: "uppercase", letterSpacing: "0.2em" }}>
              Player Profile · talkinflag.com/players
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
