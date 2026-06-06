import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Podcast Episode | Talkin Flag";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;

function parseGuestName(title: string): string | undefined {
  const match = title.match(/\|\s*([^|:]+?)(?:\s*[:–]|$)/);
  return match?.[1]?.trim();
}

function parseEpisodeNumber(title: string): number | undefined {
  const match = title.match(/[Ee]p(?:isode)?\s*(\d+)/);
  return match ? parseInt(match[1]) : undefined;
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let episodeTitle = "Talkin Flag Podcast";
  let guestName = "";
  let episodeNumber: number | undefined;
  let formattedDate = "";

  try {
    if (API_KEY && API_KEY !== "PLACEHOLDER_YOUTUBE_API_KEY" && CHANNEL_ID) {
      const url = new URL("https://www.googleapis.com/youtube/v3/videos");
      url.searchParams.set("key", API_KEY);
      url.searchParams.set("id", id);
      url.searchParams.set("part", "snippet");

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        const item = data.items?.[0];
        if (item?.snippet) {
          episodeTitle = item.snippet.title;
          guestName = parseGuestName(item.snippet.title) ?? "";
          episodeNumber = parseEpisodeNumber(item.snippet.title);
          if (item.snippet.publishedAt) {
            formattedDate = new Date(item.snippet.publishedAt).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric",
            });
          }
        }
      }
    }
  } catch {
    // Fall back to generic episode image
  }

  // Display name: guest name if parseable, otherwise the full title
  const displayName = guestName || episodeTitle;
  const nameFontSize = displayName.length > 35 ? 52 : displayName.length > 22 ? 64 : 78;

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
            width: "420px",
            height: "420px",
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
          {/* Top: Network tag + episode number badge */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#FDDD58", display: "flex" }} />
              <span style={{ color: "#FDDD58", fontSize: "15px", letterSpacing: "0.3em", textTransform: "uppercase" }}>
                TALKIN FLAG
              </span>
            </div>
            {episodeNumber && (
              <div
                style={{
                  backgroundColor: "#FDDD58",
                  color: "#000000",
                  fontSize: "20px",
                  fontWeight: 900,
                  letterSpacing: "0.08em",
                  padding: "5px 18px",
                  textTransform: "uppercase",
                  display: "flex",
                }}
              >
                EP {episodeNumber}
              </div>
            )}
          </div>

          {/* Middle: Guest/episode name */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
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
              {displayName}
            </span>
            {/* If displayName is the guest name, show the episode date below */}
            {formattedDate && (
              <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "18px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {formattedDate}
              </span>
            )}
          </div>

          {/* Bottom */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <svg width="20" height="14" viewBox="0 0 24 17" fill="#FDDD58" aria-hidden="true">
              <path d="M23.498 2.186a3.016 3.016 0 0 0-2.122-2.136C19.505 0 12 0 12 0S4.495 0 2.622.05A3.017 3.017 0 0 0 .502 2.186C0 4.07 0 8 0 8s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 11.93 24 8 24 8s0-3.93-.502-5.814zM9.545 11.568V4.432L15.818 8l-6.273 3.568z" />
            </svg>
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "16px", textTransform: "uppercase", letterSpacing: "0.2em" }}>
              talkinflag.com/podcast
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
