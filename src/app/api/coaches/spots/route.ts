import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_POSITIONS = ["QB", "WR", "DB", "Rusher"];

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: coach } = await supabase
    .from("coaches")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_verified", true)
    .single();

  if (!coach) return NextResponse.json({ error: "Verified coach account required" }, { status: 403 });

  const body = await req.json();
  const position = VALID_POSITIONS.includes(body.position) ? body.position : null;
  const target_grad_year = body.target_grad_year ? parseInt(body.target_grad_year) : null;

  const { error } = await supabase.from("coach_roster_spots").insert({
    coach_id: coach.id,
    position,
    target_grad_year: target_grad_year && !isNaN(target_grad_year) ? target_grad_year : null,
    state_pref: body.state_pref ? String(body.state_pref).slice(0, 100) : null,
    description: body.description ? String(body.description).slice(0, 500) : null,
    is_active: true,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: coach } = await supabase
    .from("coaches")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!coach) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await supabase
    .from("coach_roster_spots")
    .update({ is_active: false })
    .eq("id", id)
    .eq("coach_id", coach.id);

  return NextResponse.json({ ok: true });
}
