import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { data: coach } = await supabase
    .from("coaches")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_verified", true)
    .single();

  if (!coach) return NextResponse.json({ ok: false }, { status: 403 });

  // One row per coach-player pair; update last_viewed_at on repeat
  await supabase
    .from("coach_profile_views")
    .upsert(
      { coach_id: coach.id, player_id: id, last_viewed_at: new Date().toISOString() },
      { onConflict: "coach_id,player_id", ignoreDuplicates: false }
    );

  return NextResponse.json({ ok: true });
}
