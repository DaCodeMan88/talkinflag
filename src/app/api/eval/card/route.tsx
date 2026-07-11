import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/eval/admin-client";
import { classifyArchetype } from "@/lib/eval/archetype";
import { DIMENSION_KEYS, DIMENSION_LABELS, Fingerprint } from "@/lib/eval/dimensions";

// Node runtime (default): this route reads auth cookies, and edge-cookie
// handling is fiddly. ImageResponse works fine on Node too. Do NOT add
// `export const runtime = "edge"`.

const MAX = 10;

// Satori (next/og) does NOT support <text> inside <svg> — it throws
// "<text> nodes are not currently supported". So the rings/spokes/polygons are
// inline SVG, but the axis labels are absolutely-positioned HTML <div> overlays.
const LABEL_W = 130;
const LABEL_H = 26;

/** Port of RadarChart's polar math → SVG shapes + div label overlays. */
function Radar({
  size,
  member,
  ideal,
  axes,
}: {
  size: number;
  member: number[];
  ideal: number[];
  axes: string[];
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 74;
  const n = axes.length;
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i: number, value: number): [number, number] => {
    const rad = (Math.max(0, Math.min(MAX, value)) / MAX) * r;
    return [cx + rad * Math.cos(angle(i)), cy + rad * Math.sin(angle(i))];
  };
  const poly = (vals: number[]) => vals.map((v, i) => point(i, v).join(",")).join(" ");
  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <div style={{ position: "relative", display: "flex", width: `${size}px`, height: `${size}px` }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", top: 0, left: 0 }}>
        {rings.map((f, ri) => (
          <polygon key={`r${ri}`} points={poly(axes.map(() => MAX * f))} fill="none" stroke="#333333" strokeWidth={1} />
        ))}
        {axes.map((_, i) => {
          const [x, y] = point(i, MAX);
          return <line key={`s${i}`} x1={cx} y1={cy} x2={x} y2={y} stroke="#333333" strokeWidth={1} />;
        })}
        {/* elite ideal (grey) then user (yellow) */}
        <polygon points={poly(ideal)} fill="rgba(120,120,120,0.14)" stroke="#666666" strokeWidth={2} />
        <polygon points={poly(member)} fill="rgba(253,221,88,0.28)" stroke="#FDDD58" strokeWidth={3} />
      </svg>
      {axes.map((label, i) => {
        const [x, y] = point(i, MAX + 1.15);
        return (
          <div
            key={`t${i}`}
            style={{
              position: "absolute",
              left: `${x - LABEL_W / 2}px`,
              top: `${y - LABEL_H / 2}px`,
              width: `${LABEL_W}px`,
              height: `${LABEL_H}px`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              fontSize: "17px",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            {label}
          </div>
        );
      })}
    </div>
  );
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const isStory = searchParams.get("format") === "story";
  const width = 1080;
  const height = isStory ? 1920 : 1080;

  // Auth first — only ever serve the authed user's OWN latest response.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const admin = createAdminClient();
  const [{ data: row }, { data: refRows }] = await Promise.all([
    admin
      .from("eval_responses")
      .select("fingerprint, taken_at")
      .eq("user_id", user.id)
      .order("taken_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin.from("eval_reference").select("key, value"),
  ]);

  if (!row) return new Response("No evaluation found", { status: 404 });

  const reference: Record<string, number> = {};
  for (const r of refRows ?? []) reference[r.key] = Number(r.value);

  const fp = row.fingerprint as Fingerprint;
  const archetype = classifyArchetype(fp);
  const axes = DIMENSION_KEYS.map((k) => DIMENSION_LABELS[k].split(" ")[0]);
  const member = DIMENSION_KEYS.map((k) => fp[k] ?? 0);
  const ideal = DIMENSION_KEYS.map((k) => reference[`dim.${k}`] ?? 0);
  const top3 = [...DIMENSION_KEYS].sort((a, b) => fp[b] - fp[a]).slice(0, 3);

  const pad = isStory ? 100 : 80;
  const radarSize = isStory ? 700 : 600;
  const nameSize = archetype.name.length > 22 ? (isStory ? 72 : 60) : isStory ? 88 : 72;

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
        {/* Yellow glow */}
        <div
          style={{
            position: "absolute",
            top: "-140px",
            left: "-140px",
            width: "560px",
            height: "560px",
            borderRadius: "50%",
            backgroundColor: "#FDDD58",
            opacity: 0.06,
            display: "flex",
          }}
        />

        {/* Header: kicker + archetype name */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", width: "100%" }}>
          <span style={{ color: "#FDDD58", fontSize: "26px", letterSpacing: "0.32em", textTransform: "uppercase" }}>
            My Evaluation Philosophy
          </span>
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
            {archetype.name}
          </span>
        </div>

        {/* Radar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
          <Radar size={radarSize} member={member} ideal={ideal} axes={axes} />
        </div>

        {/* Legend + top-3 */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px", width: "100%" }}>
          <div style={{ display: "flex", gap: "40px", alignItems: "center" }}>
            <span style={{ color: "#FDDD58", fontSize: "22px", textTransform: "uppercase", letterSpacing: "0.15em" }}>● You</span>
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "22px", textTransform: "uppercase", letterSpacing: "0.15em" }}>● Elite ideal</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "20px", textTransform: "uppercase", letterSpacing: "0.2em" }}>
              You value most
            </span>
            <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
              {top3.map((k) => (
                <div
                  key={k}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    backgroundColor: "rgba(253,221,88,0.12)",
                    border: "1px solid rgba(253,221,88,0.4)",
                    padding: "8px 18px",
                  }}
                >
                  <span style={{ color: "#FFFFFF", fontSize: "24px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {DIMENSION_LABELS[k]}
                  </span>
                  <span style={{ color: "#FDDD58", fontSize: "24px", fontWeight: 900 }}>{(fp[k] ?? 0).toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", marginTop: "10px" }}>
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "26px", textAlign: "center" }}>
            What&apos;s your eval philosophy?
          </span>
          <span style={{ color: "#FDDD58", fontSize: `${isStory ? 40 : 34}px`, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            talkinflag.com/evaluate
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
