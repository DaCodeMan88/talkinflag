import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";
export const alt = "Athlete Profile of the Week | Talkin Flag";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  let playerName = "Athlete of the Week";
  let position = "";
  let school = "";
  let photoUrl: string | null = null;
  let initials = "TF";
  let message: string | null = null;

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const now = new Date().toISOString();
    const { data } = await supabase
      .from("featured_athlete")
      .select(
        "message, players(first_name, last_name, position, school_or_team, photo_url)"
      )
      .gte("featured_until", now)
      .order("featured_from", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      const p = (data.players as unknown) as {
        first_name: string;
        last_name: string;
        position: string | null;
        school_or_team: string | null;
        photo_url: string | null;
      } | null;
      if (p) {
        playerName = `${p.first_name} ${p.last_name}`;
        initials = `${p.first_name[0] ?? ""}${p.last_name[0] ?? ""}`;
        position = p.position ?? "";
        school = p.school_or_team ?? "";
        photoUrl = p.photo_url ?? null;
      }
      message = (data.message as string | null) ?? null;
    }
  } catch {
    // Fall back to generic
  }

  const nameFontSize = playerName.length > 20 ? 60 : 76;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          backgroundColor: "#FDDD58",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Dark diagonal slice on right side */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "520px",
            height: "100%",
            backgroundColor: "#000000",
            clipPath: "polygon(15% 0, 100% 0, 100% 100%, 0% 100%)",
            display: "flex",
          }}
        />

        {/* Subtle grid on dark side */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "520px",
            height: "100%",
            display: "flex",
            opacity: 0.06,
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{ flex: 1, borderRight: "1px solid #FDDD58", display: "flex" }}
            />
          ))}
        </div>

        {/* Left: text content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "60px 60px 60px 72px",
            width: "700px",
            height: "100%",
            justifyContent: "space-between",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Top badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                backgroundColor: "#000",
                color: "#FDDD58",
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                padding: "6px 16px",
                display: "flex",
              }}
            >
              Talkin Flag
            </div>
          </div>

          {/* Middle: label + name */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <span
              style={{
                color: "rgba(0,0,0,0.45)",
                fontSize: "20px",
                fontWeight: 700,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
              }}
            >
              Athlete of the Week
            </span>
            <span
              style={{
                color: "#000000",
                fontSize: `${nameFontSize}px`,
                fontWeight: 900,
                textTransform: "uppercase",
                lineHeight: 1.0,
                letterSpacing: "-0.02em",
              }}
            >
              {playerName}
            </span>

            {(position || school) && (
              <span
                style={{
                  color: "rgba(0,0,0,0.55)",
                  fontSize: "20px",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginTop: "6px",
                }}
              >
                {[position, school].filter(Boolean).join(" · ")}
              </span>
            )}

            {message && (
              <span
                style={{
                  color: "rgba(0,0,0,0.6)",
                  fontSize: "18px",
                  fontStyle: "italic",
                  marginTop: "10px",
                  maxWidth: "540px",
                  lineHeight: 1.4,
                }}
              >
                "{message}"
              </span>
            )}
          </div>

          {/* Bottom: URL */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "32px", height: "3px", backgroundColor: "#000", display: "flex" }} />
            <span
              style={{
                color: "rgba(0,0,0,0.4)",
                fontSize: "15px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              talkinflag.com
            </span>
          </div>
        </div>

        {/* Right: photo over dark */}
        <div
          style={{
            position: "absolute",
            right: "60px",
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              width={300}
              height={300}
              style={{
                width: "300px",
                height: "300px",
                borderRadius: "50%",
                objectFit: "cover",
                objectPosition: "top",
                border: "5px solid #FDDD58",
              }}
            />
          ) : (
            <div
              style={{
                width: "300px",
                height: "300px",
                borderRadius: "50%",
                backgroundColor: "rgba(253,221,88,0.15)",
                border: "5px solid #FDDD58",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  color: "#FDDD58",
                  fontSize: "80px",
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
