import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.first_name || !body.last_name || !body.position || !body.level) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createServerClient();

  const { error } = await supabase.from("players").insert({
    first_name: body.first_name,
    last_name: body.last_name,
    position: body.position,
    level: body.level,
    school_or_team: body.school_or_team || null,
    country: body.country || null,
    highlight_url: body.highlight_url || null,
    instagram: body.instagram || null,
    bio: body.bio || null,
    is_verified: false,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
