import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";
export const alt = "Player Profile | Talkin Flag";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let playerName = "Flag Football Player";
  let position = "";
  let ranking = "";
  let level = "";
  let photoUrl: string | null = null;
  let school: string | null = null;
  let gradYear: number | null = null;
  let heightIn: number | null = null;
  let weightLbs: number | null = null;
  let initials = "FF";

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await supabase
      .from("players")
      .select("first_name, last_name, position, ranking_national, level, photo_url, school_or_team, grad_year, height_in, weight_lbs")
      .eq("id", id)
      .eq("is_approved", true)
      .single();

    if (data) {
      playerName = `${data.first_name} ${data.last_name}`;
      initials = `${data.first_name[0] ?? ""}${data.last_name[0] ?? ""}`;
      position = data.position ?? "";
      ranking = data.ranking_national ? `#${data.ranking_national}` : "";
      level = data.level
        ? data.level.replaceAll("_", " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
        : "";
      photoUrl = data.photo_url ?? null;
      school = data.school_or_team ?? null;
      gradYear = data.grad_year ?? null;
      heightIn = data.height_in ?? null;
      weightLbs = data.weight_lbs ?? null;
    }
  } catch {
    // Fall back to generic player image
  }

  const nameFontSize = playerName.length > 20 ? 64 : 80;

  // Height formatter
  const heightStr = heightIn
    ? `${Math.floor(heightIn / 12)}'${heightIn % 12}"`
    : null;

  const measurables = [
    heightStr,
    weightLbs ? `${weightLbs} lbs` : null,
  ].filter(Boolean).join(" · ");

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          backgroundColor: "#000000",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Yellow top bar */}
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

        {/* Left column: text content (~780px) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "60px 40px 60px 104px",
            width: "780px",
            height: "100%",
            justifyContent: "space-between",
          }}
        >
          {/* Top: Brand tag + ranking badge */}
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
                  fontSize: "20px",
                  fontWeight: 900,
                  letterSpacing: "0.05em",
                  padding: "6px 16px",
                  display: "flex",
                }}
              >
                {ranking} NATIONALLY
              </div>
            )}
          </div>

          {/* Middle: Name + badges */}
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
              {playerName}
            </span>

            {/* Position + level */}
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              {position && (
                <div
                  style={{
                    backgroundColor: "#FDDD58",
                    color: "#000000",
                    fontSize: "18px",
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
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "16px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {level}
                </span>
              )}
            </div>

            {/* School */}
            {school && (
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "18px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {school}
              </span>
            )}

            {/* Class year + measurables */}
            {(gradYear || measurables) && (
              <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                {gradYear && (
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "15px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Class of {gradYear}
                  </span>
                )}
                {measurables && gradYear && (
                  <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "15px" }}>|</span>
                )}
                {measurables && (
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "15px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    {measurables}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Bottom watermark */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.2em" }}>
              talkinflag.com/players
            </span>
          </div>
        </div>

        {/* Right column: photo (~420px) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "420px",
            height: "100%",
            position: "relative",
          }}
        >
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              width={280}
              height={280}
              style={{
                width: "280px",
                height: "280px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "4px solid #FDDD58",
              }}
            />
          ) : (
            <div
              style={{
                width: "280px",
                height: "280px",
                borderRadius: "50%",
                backgroundColor: "rgba(253,221,88,0.15)",
                border: "4px solid #FDDD58",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  color: "#FDDD58",
                  fontSize: "72px",
                  fontWeight: 900,
                  textTransform: "uppercase",
                }}
              >
                {initials}
              </span>
            </div>
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
