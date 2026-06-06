import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: coach } = await supabase
    .from("coaches")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!coach) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { note } = await req.json();

  await supabase
    .from("coach_player_notes")
    .upsert(
      { coach_id: coach.id, player_id: playerId, note: String(note ?? "").slice(0, 1000), updated_at: new Date().toISOString() },
      { onConflict: "coach_id,player_id" }
    );

  return NextResponse.json({ ok: true });
}
