import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify scout
  const { data: scout } = await supabase
    .from("scouts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!scout) return NextResponse.json({ error: "Not an approved scout" }, { status: 403 });

  const { player_id, stats, event_name, event_date } = await req.json();
  if (!player_id || !stats || !Array.isArray(stats) || stats.length === 0) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const notes = [event_name, event_date].filter(Boolean).join(" · ");

  const rows = stats.map((s: { stat_key: string; stat_value: string }) => ({
    player_id,
    stat_key: s.stat_key,
    stat_value: s.stat_value,
    source_type: "scout_event",
    scout_id: scout.id,
    notes: notes || null,
    status: "pending",
  }));

  const { error } = await supabase.from("stat_verifications").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, submitted: rows.length });
}
