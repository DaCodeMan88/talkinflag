import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const body = await req.json();
  const { full_name, email, location, affiliation, event_history, why_flag } = body;

  if (!full_name || !email || !location || !why_flag) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { error } = await supabase.from("scout_applications").insert({
    user_id: user?.id ?? null,
    full_name: full_name.trim(),
    email: email.trim().toLowerCase(),
    location: location.trim(),
    affiliation: affiliation?.trim() || null,
    event_history: event_history?.trim() || null,
    why_flag: why_flag.trim(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
