import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";
export const alt = "Flag Football Event | Talkin Flag";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const LEVEL_LABELS: Record<string, string> = {
  youth: "Youth",
  high_school: "High School",
  college: "College",
  national: "National",
  pro: "Pro",
  international: "International",
  olympics: "Olympics / World Games",
};

function formatShortDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let title = "Flag Football Event";
  let location = "";
  let dateStr = "";
  let levelLabel = "";

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
      .from("events")
      .select("title, city, country, start_date, end_date, level")
      .eq("id", id)
      .single();

    if (data) {
      title = data.title;
      location = [data.city, data.country].filter(Boolean).join(", ");
      dateStr = formatShortDate(data.start_date);
      if (data.end_date && data.end_date !== data.start_date) {
        dateStr += ` – ${formatShortDate(data.end_date)}`;
      }
      levelLabel = data.level ? (LEVEL_LABELS[data.level] ?? data.level) : "";
    }
  } catch {
    // Fall back to generic event image
  }

  const titleFontSize = title.length > 35 ? 58 : title.length > 22 ? 72 : 84;

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

        {/* Left border */}
        <div style={{ position: "absolute", left: "72px", top: "60px", bottom: "60px", width: "4px", backgroundColor: "#FDDD58", display: "flex" }} />

        {/* Grid bg */}
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
            width: "400px",
            height: "400px",
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
          {/* Top: Network tag + level badge */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#FDDD58", display: "flex" }} />
              <span style={{ color: "#FDDD58", fontSize: "15px", letterSpacing: "0.3em", textTransform: "uppercase" }}>
                TALKIN FLAG EVENTS
              </span>
            </div>
            {levelLabel && (
              <div
                style={{
                  backgroundColor: "#FDDD58",
                  color: "#000000",
                  fontSize: "18px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  padding: "5px 16px",
                  textTransform: "uppercase",
                  display: "flex",
                }}
              >
                {levelLabel}
              </div>
            )}
          </div>

          {/* Middle: Event title + details */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <span
              style={{
                color: "#FFFFFF",
                fontSize: `${titleFontSize}px`,
                fontWeight: 900,
                textTransform: "uppercase",
                lineHeight: 1.0,
                letterSpacing: "-0.02em",
              }}
            >
              {title}
            </span>
            <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
              {dateStr && (
                <span style={{ color: "#FDDD58", fontSize: "22px", letterSpacing: "0.05em" }}>
                  📅 {dateStr}
                </span>
              )}
              {location && (
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "22px" }}>
                  📍 {location}
                </span>
              )}
            </div>
          </div>

          {/* Bottom */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "16px", textTransform: "uppercase", letterSpacing: "0.2em" }}>
              Flag Football Calendar · talkinflag.com/events
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
