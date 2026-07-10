import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@/lib/supabase";
import { hasDisplayableValue } from "@/lib/profile-visibility";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authClient = await createClient();

  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createServerClient();

  const { data: player } = await db
    .from("players")
    .select("id, claimed_by, is_claimed, stats")
    .eq("id", id)
    .single();

  if (!player || !player.is_claimed || player.claimed_by !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  // Identity fields (direct columns)
  const identity: Record<string, unknown> = {};
  if (body.bio !== undefined) identity.bio = String(body.bio).slice(0, 400);
  if (body.instagram !== undefined) {
    const handle = String(body.instagram).replace(/^@/, "").slice(0, 60);
    identity.instagram = handle || null;
  }
  if (body.highlight_url !== undefined) {
    const url = String(body.highlight_url).trim();
    const safe = url === "" ? null :
      (url.startsWith("https://www.youtube.com") ||
       url.startsWith("https://youtu.be") ||
       url.startsWith("https://www.hudl.com") ||
       url.startsWith("https://hudl.com")) ? url : null;
    identity.highlight_url = safe;
  }

  // Measurables (direct columns + stats JSONB)
  if (body.height_in !== undefined) {
    const v = parseInt(body.height_in);
    identity.height_in = isNaN(v) || v < 48 || v > 96 ? null : v;
  }
  if (body.weight_lbs !== undefined) {
    const v = parseInt(body.weight_lbs);
    identity.weight_lbs = isNaN(v) || v < 80 || v > 400 ? null : v;
  }

  // Stats JSONB fields
  const statsFields: Record<string, unknown> = {};
  if (body.wingspan_in !== undefined) {
    const v = parseInt(body.wingspan_in);
    statsFields.wingspan_in = isNaN(v) || v < 48 || v > 108 ? null : v;
  }
  if (body.forty_yard !== undefined) {
    const v = parseFloat(body.forty_yard);
    statsFields.forty_yard = isNaN(v) || v < 3.5 || v > 8 ? null : v.toFixed(2);
  }
  if (body.vertical_jump !== undefined) {
    const v = parseInt(body.vertical_jump);
    statsFields.vertical_jump = isNaN(v) || v < 10 || v > 60 ? null : v;
  }
  if (body.years_active !== undefined) {
    const v = parseInt(body.years_active);
    statsFields.years_active = isNaN(v) || v < 0 || v > 30 ? null : v;
  }
  if (body.occupation !== undefined) {
    statsFields.occupation = String(body.occupation).slice(0, 100) || null;
  }
  if (body.education !== undefined) {
    statsFields.education = String(body.education).slice(0, 100) || null;
  }

  const mergedStats: Record<string, unknown> = { ...(player.stats ?? {}), ...statsFields };
  // Drop anything that isn't displayable (null, "", "?", "N/A", empty arrays…)
  // so junk placeholders are removed rather than stored.
  Object.keys(mergedStats).forEach((k) => {
    if (!hasDisplayableValue(mergedStats[k])) delete mergedStats[k];
  });

  if (body.grad_year !== undefined) {
    const v = parseInt(body.grad_year as string);
    identity.grad_year = isNaN(v) || v < 2024 || v > 2032 ? null : v;
  }

  const { error } = await db
    .from("players")
    .update({ ...identity, stats: mergedStats })
    .eq("id", id);

  if (error) {
    console.error("Player profile update error:", error.message);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
