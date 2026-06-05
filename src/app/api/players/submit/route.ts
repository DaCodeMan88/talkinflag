import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

const VALID_POSITIONS = ["QB", "WR", "DB", "Rusher"];
const VALID_LEVELS = ["high_school", "college", "national", "international", "youth"];
const VALID_GENDERS = ["male", "female"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.first_name?.trim()) return NextResponse.json({ error: "First name is required" }, { status: 400 });
    if (!body.last_name?.trim())  return NextResponse.json({ error: "Last name is required" }, { status: 400 });
    if (!body.position)           return NextResponse.json({ error: "Position is required" }, { status: 400 });
    if (!body.level)              return NextResponse.json({ error: "Level is required" }, { status: 400 });

    const position = VALID_POSITIONS.includes(body.position) ? body.position : null;
    const level    = VALID_LEVELS.includes(body.level) ? body.level : null;
    const gender   = VALID_GENDERS.includes(body.gender) ? body.gender : null;

    if (!position) return NextResponse.json({ error: "Invalid position" }, { status: 400 });
    if (!level)    return NextResponse.json({ error: "Invalid level" }, { status: 400 });

    // Highlight URL allowlist
    let highlightUrl: string | null = null;
    if (body.highlight_url?.trim()) {
      const url = body.highlight_url.trim();
      if (
        url.startsWith("https://www.youtube.com") ||
        url.startsWith("https://youtu.be") ||
        url.startsWith("https://www.hudl.com") ||
        url.startsWith("https://hudl.com")
      ) {
        highlightUrl = url.slice(0, 500);
      }
    }

    // Height — two separate fields merged into height_in
    let height_in: number | null = null;
    const ft = parseInt(body.height_ft ?? "");
    const inch = parseInt(body.height_in_rem ?? "");
    if (!isNaN(ft) && !isNaN(inch)) {
      const total = ft * 12 + inch;
      if (total >= 48 && total <= 96) height_in = total;
    }

    // Weight
    const weight_lbs_raw = parseInt(body.weight_lbs ?? "");
    const weight_lbs = !isNaN(weight_lbs_raw) && weight_lbs_raw >= 80 && weight_lbs_raw <= 400
      ? weight_lbs_raw : null;

    // Grad year
    const grad_year_raw = parseInt(body.grad_year ?? "");
    const grad_year = !isNaN(grad_year_raw) && grad_year_raw >= 2024 && grad_year_raw <= 2035
      ? grad_year_raw : null;

    // Stats JSONB — measurables
    const stats: Record<string, unknown> = {};
    const forty = parseFloat(body.forty_yard ?? "");
    if (!isNaN(forty) && forty >= 3.5 && forty <= 8) stats.forty_yard = forty.toFixed(2);

    const vert = parseInt(body.vertical_jump ?? "");
    if (!isNaN(vert) && vert >= 10 && vert <= 60) stats.vertical_jump = vert;

    const wing = parseInt(body.wingspan_in ?? "");
    if (!isNaN(wing) && wing >= 48 && wing <= 108) stats.wingspan_in = wing;

    const supabase = createServerClient();
    const { error } = await supabase.from("players").insert({
      first_name:    body.first_name.trim().slice(0, 100),
      last_name:     body.last_name.trim().slice(0, 100),
      position,
      level,
      gender,
      grad_year,
      school_or_team: body.school_or_team?.trim().slice(0, 200) || null,
      city:           body.city?.trim().slice(0, 100) || null,
      state:          body.state?.trim().slice(0, 100) || null,
      country:        body.country?.trim().slice(0, 100) || null,
      height_in,
      weight_lbs,
      highlight_url:  highlightUrl,
      instagram:      body.instagram?.trim().replace(/^@/, "").slice(0, 100) || null,
      bio:            body.bio?.trim().slice(0, 1000) || null,
      stats:          Object.keys(stats).length > 0 ? stats : null,
      is_verified:    false,
    });

    if (error) {
      console.error("Player submission error:", error.message);
      return NextResponse.json({ error: "Failed to submit profile" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
