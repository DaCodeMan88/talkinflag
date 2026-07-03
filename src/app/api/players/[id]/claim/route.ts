import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@/lib/supabase";
import { rateLimit, getClientIp, retryAfterSeconds } from "@/lib/rate-limit";
import { hasClaimedProfile, logClaimEvent, notifyAdmins } from "@/lib/claims";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getClientIp(req);
  const { success, reset } = rateLimit(`claim:${ip}`, { limit: 5, windowMs: 60_000 });
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds(reset)) } }
    );
  }

  const db = createServerClient();

  if (await hasClaimedProfile(db, user.id)) {
    return NextResponse.json(
      { error: "You've already claimed a profile. Contact us if you need to change it." },
      { status: 409 }
    );
  }

  const { data: updated, error } = await db
    .from("players")
    .update({
      is_claimed: true,
      claimed_by: user.id,
      claimed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("is_claimed", false) // race guard — no-op if already claimed
    .select("id, first_name, last_name")
    .maybeSingle();

  if (error) {
    console.error("Player claim error:", error.message);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
  if (!updated) return NextResponse.json({ error: "This profile has already been claimed." }, { status: 409 });

  await logClaimEvent(db, { playerId: id, userId: user.id, action: "claim", actor: "self" });

  await notifyAdmins(
    `New profile claim: ${updated.first_name} ${updated.last_name}`,
    `
      <div style="font-family:sans-serif;max-width:600px">
        <h2 style="color:#FDDD58">New Profile Claim</h2>
        <p><strong>${updated.first_name} ${updated.last_name}</strong> was just claimed.</p>
        <p><strong>Claimed by:</strong> ${user.email}</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <p><a href="https://talkinflag.com/admin/claims">Review in Admin → Recent Claims</a></p>
      </div>
    `
  );

  return NextResponse.json({ ok: true });
}
