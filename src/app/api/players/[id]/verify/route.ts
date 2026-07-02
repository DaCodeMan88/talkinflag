import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@/lib/supabase";

const VALID_STAT_KEYS = [
  "height_in", "weight_lbs", "wingspan_in",
  "forty_yard", "vertical_jump",
  "passing_yards", "td_passes",
  "receiving_yards", "receiving_tds", "interceptions",
  "total_tds", "years_active",
] as const;

const VALID_SOURCE_TYPES = ["maxpreps", "hudl", "nfhs", "ifaf", "coach", "other"] as const;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createServerClient();

  const { data: player } = await db
    .from("players")
    .select("id, claimed_by, is_claimed, stats, height_in, weight_lbs")
    .eq("id", id)
    .single();

  if (!player || !player.is_claimed || player.claimed_by !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const stat_key = String(body.stat_key ?? "");
  const source_type = String(body.source_type ?? "");
  const source_url = String(body.source_url ?? "").trim().slice(0, 500);
  const coach_id = body.coach_id ? String(body.coach_id) : null;

  if (!VALID_STAT_KEYS.includes(stat_key as typeof VALID_STAT_KEYS[number])) {
    return NextResponse.json({ error: "Invalid stat key" }, { status: 400 });
  }
  if (!VALID_SOURCE_TYPES.includes(source_type as typeof VALID_SOURCE_TYPES[number])) {
    return NextResponse.json({ error: "Invalid source type" }, { status: 400 });
  }
  if (source_type !== "coach" && !source_url) {
    return NextResponse.json({ error: "Source URL is required" }, { status: 400 });
  }
  if (source_type === "coach" && !coach_id) {
    return NextResponse.json({ error: "Coach is required for coach sign-off" }, { status: 400 });
  }

  // Get the current stat value from player
  const stats = (player.stats ?? {}) as Record<string, unknown>;
  let stat_value: string | null = null;
  if (stat_key === "height_in") stat_value = player.height_in ? String(player.height_in) : null;
  else if (stat_key === "weight_lbs") stat_value = player.weight_lbs ? String(player.weight_lbs) : null;
  else stat_value = stats[stat_key] != null ? String(stats[stat_key]) : null;

  if (!stat_value) {
    return NextResponse.json({ error: "Add this stat to your profile before submitting for verification" }, { status: 400 });
  }

  // Check for existing pending submission for same stat
  const { data: existing } = await db
    .from("stat_verifications")
    .select("id, status")
    .eq("player_id", id)
    .eq("stat_key", stat_key)
    .in("status", ["pending", "approved"])
    .single();

  if (existing) {
    const msg = existing.status === "approved"
      ? "This stat is already verified"
      : "A verification request for this stat is already pending";
    return NextResponse.json({ error: msg }, { status: 409 });
  }

  const { error } = await db.from("stat_verifications").insert({
    player_id: id,
    stat_key,
    stat_value,
    source_type,
    source_url: source_url || null,
    coach_id,
    status: "pending",
  });

  if (error) {
    console.error("Stat verification error:", error.message);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
