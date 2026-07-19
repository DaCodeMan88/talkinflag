import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@/lib/supabase";
import { hasDisplayableValue } from "@/lib/profile-visibility";
import { sanitizeStatsPayload, shouldResetVerification, sanitizeIdentityPayload, sanitizeGradYear } from "@/lib/profile-edit";
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
    .select("id, claimed_by, is_claimed, claim_pending, stats")
    .eq("id", id)
    .single();

  if (!player || !player.is_claimed || player.claimed_by !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (player.claim_pending) {
    return NextResponse.json({ error: "Your claim is still pending review." }, { status: 403 });
  }

  const body = await req.json();

  // Identity fields (direct columns)
  const identity: Record<string, unknown> = {};
  if (body.bio !== undefined) identity.bio = String(body.bio).slice(0, 400);
  if (body.instagram !== undefined) {
    const handle = String(body.instagram).replace(/^@/, "").slice(0, 60);
    identity.instagram = handle || null;
  }
  if (body.tiktok !== undefined) {
    const handle = String(body.tiktok).replace(/^@/, "").slice(0, 60);
    identity.tiktok = handle || null;
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

  // Soft identity fields the player may self-edit (position, city).
  // Guarded fields (name/team/level/roster_year/country) are never touched here.
  Object.assign(identity, sanitizeIdentityPayload(body as Record<string, unknown>));

  // Stats JSONB fields — allowlisted + sanitized (anything else the client
  // sends, e.g. team_designation/source/seed_batch/roster_year, is stripped).
  const statsFields = sanitizeStatsPayload(body as Record<string, unknown>);

  const mergedStats: Record<string, unknown> = { ...(player.stats ?? {}), ...statsFields };
  // Drop anything that isn't displayable (null, "", "?", "N/A", empty arrays…)
  // so junk placeholders are removed rather than stored.
  Object.keys(mergedStats).forEach((k) => {
    if (!hasDisplayableValue(mergedStats[k])) delete mergedStats[k];
  });

  if (body.grad_year !== undefined) {
    identity.grad_year = sanitizeGradYear(body.grad_year);
  }

  // Changing the load-bearing facts (caps, world appearances, tournaments,
  // achievements) drops the verified badge until re-verified.
  const update: Record<string, unknown> = { ...identity, stats: mergedStats };
  if (shouldResetVerification(player.stats as Record<string, unknown> | null, statsFields)) {
    update.is_verified = false;
  }

  const { error } = await db
    .from("players")
    .update(update)
    .eq("id", id);

  if (error) {
    console.error("Player profile update error:", error.message);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
