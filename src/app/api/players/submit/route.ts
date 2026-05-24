import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

const VALID_POSITIONS = ["QB", "WR", "DB", "LB", "C", "Rusher", "Utility"];
const VALID_LEVELS = ["high_school", "college", "national", "pro"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Required field validation
    if (!body.first_name?.trim()) {
      return NextResponse.json({ error: "First name is required" }, { status: 400 });
    }
    if (!body.last_name?.trim()) {
      return NextResponse.json({ error: "Last name is required" }, { status: 400 });
    }
    if (!body.position) {
      return NextResponse.json({ error: "Position is required" }, { status: 400 });
    }
    if (!body.level) {
      return NextResponse.json({ error: "Level is required" }, { status: 400 });
    }

    // Sanitize enum fields
    const position = VALID_POSITIONS.includes(body.position) ? body.position : null;
    const level = VALID_LEVELS.includes(body.level) ? body.level : null;

    if (!position) {
      return NextResponse.json({ error: "Invalid position" }, { status: 400 });
    }
    if (!level) {
      return NextResponse.json({ error: "Invalid level" }, { status: 400 });
    }

    // Validate highlight URL if provided
    let highlightUrl: string | null = null;
    if (body.highlight_url?.trim()) {
      const url = body.highlight_url.trim();
      if (url.startsWith("http://") || url.startsWith("https://")) {
        highlightUrl = url.slice(0, 500);
      }
    }

    const supabase = createServerClient();
    const { error } = await supabase.from("players").insert({
      first_name: body.first_name.trim().slice(0, 100),
      last_name: body.last_name.trim().slice(0, 100),
      position,
      level,
      school_or_team: body.school_or_team?.trim().slice(0, 200) || null,
      country: body.country?.trim().slice(0, 100) || null,
      highlight_url: highlightUrl,
      instagram: body.instagram?.trim().slice(0, 100) || null,
      bio: body.bio?.trim().slice(0, 1000) || null,
      is_verified: false,
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
