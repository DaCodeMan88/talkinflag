import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";
import { cohortRankLabel } from "@/lib/rankings/cohort";

// Shareable player card as a real PNG (1080×1080 post / 1080×1920 story) so the
// OS share sheet can hand an image file to Instagram (Post/Story). This is the
// size/layout adaptation of opengraph-image.tsx — same brand design, but square
// and vertical, and with the URL baked in (images can't link).
export const runtime = "edge";

const bool = (sp: URLSearchParams, key: string, def: boolean): boolean => {
  const v = sp.get(key);
  if (v === null) return def;
  return v === "1" || v === "true";
};

function formatHeightImperial(h: number): string {
  return `${Math.floor(h / 12)}'${h % 12}"`;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);

  const format = searchParams.get("format") === "story" ? "story" : "post";
  const isStory = format === "story";
  const width = 1080;
  const height = isStory ? 1920 : 1080;

  // Requested visibility (client toggles arrive as 1/0). Stat params are only
  // honoured if the stat is ALSO server-verified (see below) — never trust the
  // client to reveal an unverified measurable.
  const wantPhoto = bool(searchParams, "photo", true);
  const wantSchool = bool(searchParams, "school", true);
  const wantYear = bool(searchParams, "year", true);
  const wantRank = bool(searchParams, "rank", true);
  const wantHeight = bool(searchParams, "height", false);
  const wantWeight = bool(searchParams, "weight", false);
  const wantForty = bool(searchParams, "forty", false);
  const wantVertical = bool(searchParams, "vertical", false);

  let playerName = "";
  let position = "";
  let ranking = "";
  let level = "";
  let photoUrl: string | null = null;
  let school: string | null = null;
  let gradYear: number | null = null;
  let heightIn: number | null = null;
  let weightLbs: number | null = null;
  let fortyYard: string | null = null;
  let verticalJump: string | null = null;
  let initials = "FF";
  const verified = new Set<string>();

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await supabase
      .from("players")
      .select(
        "first_name, last_name, position, ranking_national, level, photo_url, school_or_team, grad_year, height_in, weight_lbs, stats"
      )
      .eq("id", id)
      .eq("is_approved", true)
      .single();

    // Unknown / unapproved id → 404 (matches the profile page's visibility).
    if (!data) {
      return new Response("Not found", { status: 404 });
    }

    playerName = `${data.first_name} ${data.last_name}`;
    initials = `${data.first_name?.[0] ?? ""}${data.last_name?.[0] ?? ""}`;
    position = data.position ?? "";
    ranking = cohortRankLabel(data.level, data.ranking_national) ?? "";
    level = data.level
      ? data.level.replaceAll("_", " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
      : "";
    photoUrl = data.photo_url ?? null;
    school = data.school_or_team ?? null;
    gradYear = data.grad_year ?? null;
    heightIn = data.height_in ?? null;
    weightLbs = data.weight_lbs ?? null;
    const ext = (data.stats ?? {}) as Record<string, unknown>;
    fortyYard =
      ext.forty_yard !== undefined && ext.forty_yard !== null && ext.forty_yard !== ""
        ? String(ext.forty_yard)
        : null;
    verticalJump =
      ext.vertical_jump !== undefined && ext.vertical_jump !== null && ext.vertical_jump !== ""
        ? String(ext.vertical_jump)
        : null;

    // Re-derive verified stat keys server-side — the ONLY source of truth for
    // whether a measurable may appear on the card.
    const { data: verifications } = await supabase
      .from("stat_verifications")
      .select("stat_key")
      .eq("player_id", id)
      .eq("status", "approved");
    for (const v of verifications ?? []) verified.add(v.stat_key as string);
  } catch {
    return new Response("Error", { status: 500 });
  }

  const showPhoto = wantPhoto && !!photoUrl;
  const showRank = wantRank && !!ranking;
  const showSchool = wantSchool && !!school;
  const showYear = wantYear && !!gradYear;

  // A stat renders only if the client asked for it AND it's server-verified.
  const statsRow = [
    wantHeight && verified.has("height_in") && heightIn ? formatHeightImperial(heightIn) : null,
    wantWeight && verified.has("weight_lbs") && weightLbs ? `${weightLbs} lbs` : null,
    wantForty && verified.has("forty_yard") && fortyYard ? `${fortyYard}s 40yd` : null,
    wantVertical && verified.has("vertical_jump") && verticalJump ? `${verticalJump}" vert` : null,
  ]
    .filter(Boolean)
    .join("  ·  ");

  // Size tokens differ between the square post and the taller 9:16 story.
  const pad = isStory ? 110 : 90;
  const photoSize = isStory ? 460 : 380;
  const nameSize = playerName.length > 18 ? (isStory ? 108 : 88) : isStory ? 132 : 104;
  const brandSize = isStory ? 30 : 26;

  return new ImageResponse(
    (
      <div
        style={{
          width: `${width}px`,
          height: `${height}px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#000000",
          fontFamily: "sans-serif",
          padding: `${pad}px`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Yellow top bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "10px", backgroundColor: "#FDDD58", display: "flex" }} />

        {/* Subtle grid bg */}
        <div style={{ position: "absolute", inset: 0, display: "flex", opacity: 0.03 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} style={{ flex: 1, borderRight: "1px solid #FDDD58", display: "flex" }} />
          ))}
        </div>

        {/* Yellow glow */}
        <div
          style={{
            position: "absolute",
            bottom: "-140px",
            right: "-140px",
            width: "560px",
            height: "560px",
            borderRadius: "50%",
            backgroundColor: "#FDDD58",
            opacity: 0.07,
            display: "flex",
          }}
        />

        {/* Top: brand tag + rank */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "14px", height: "14px", borderRadius: "50%", backgroundColor: "#FDDD58", display: "flex" }} />
            <span style={{ color: "#FDDD58", fontSize: `${brandSize}px`, letterSpacing: "0.3em", textTransform: "uppercase" }}>
              TALKIN FLAG
            </span>
          </div>
          {showRank && (
            <div
              style={{
                backgroundColor: "#FDDD58",
                color: "#000000",
                fontSize: `${brandSize + 2}px`,
                fontWeight: 900,
                letterSpacing: "0.05em",
                padding: "8px 20px",
                display: "flex",
              }}
            >
              {ranking.toUpperCase()}
            </div>
          )}
        </div>

        {/* Middle: photo + name block, centered */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            gap: isStory ? "56px" : "40px",
          }}
        >
          {showPhoto && photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              width={photoSize}
              height={photoSize}
              style={{
                width: `${photoSize}px`,
                height: `${photoSize}px`,
                borderRadius: "50%",
                objectFit: "cover",
                border: "6px solid #FDDD58",
              }}
            />
          ) : (
            <div
              style={{
                width: `${photoSize}px`,
                height: `${photoSize}px`,
                borderRadius: "50%",
                backgroundColor: "rgba(253,221,88,0.15)",
                border: "6px solid #FDDD58",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "#FDDD58", fontSize: `${Math.round(photoSize * 0.35)}px`, fontWeight: 900, textTransform: "uppercase" }}>
                {initials}
              </span>
            </div>
          )}

          {/* Name */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "22px", width: "100%" }}>
            <span
              style={{
                color: "#FFFFFF",
                fontSize: `${nameSize}px`,
                fontWeight: 900,
                textTransform: "uppercase",
                lineHeight: 1.0,
                letterSpacing: "-0.02em",
                textAlign: "center",
              }}
            >
              {playerName}
            </span>

            {/* Position + level */}
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              {position && (
                <div
                  style={{
                    backgroundColor: "#FDDD58",
                    color: "#000000",
                    fontSize: "26px",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    padding: "6px 20px",
                    textTransform: "uppercase",
                    display: "flex",
                  }}
                >
                  {position}
                </div>
              )}
              {level && (
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "24px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {level}
                </span>
              )}
            </div>

            {/* School */}
            {showSchool && (
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "26px", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center" }}>
                {school}
              </span>
            )}

            {/* Class year + stats */}
            {(showYear || statsRow) && (
              <div style={{ display: "flex", gap: "24px", alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
                {showYear && (
                  <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "22px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Class of {gradYear}
                  </span>
                )}
                {showYear && statsRow && (
                  <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "22px" }}>|</span>
                )}
                {statsRow && (
                  <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "22px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    {statsRow}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom watermark — carries the URL since the image can't link */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
          <span style={{ color: "#FDDD58", fontSize: `${isStory ? 40 : 34}px`, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em" }}>
            talkinflag.com
          </span>
        </div>
      </div>
    ),
    {
      width,
      height,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
