import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@/lib/supabase";
import { rateLimit, getClientIp, retryAfterSeconds } from "@/lib/rate-limit";
import { notifyAdmins } from "@/lib/claims";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getClientIp(req);
  const { success, reset } = rateLimit(`coach-claim:${ip}`, { limit: 5, windowMs: 60_000 });
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds(reset)) } }
    );
  }

  // Service-role client — the target row has user_id = null, which RLS won't let
  // a normal user update (coaches_owner_update requires auth.uid() = user_id).
  const db = createServerClient();

  const { data: coach } = await db
    .from("coaches")
    .select("id, user_id, first_name, last_name, team, is_verified")
    .eq("id", id)
    .maybeSingle();

  if (!coach) {
    return NextResponse.json({ error: "Coach profile not found." }, { status: 404 });
  }

  // Already yours — treat as success so the button just lands them on the dashboard.
  if (coach.user_id === user.id) return NextResponse.json({ ok: true });

  // Claimed by someone else.
  if (coach.user_id) {
    return NextResponse.json(
      { error: "This coach profile has already been claimed." },
      { status: 409 }
    );
  }

  // Only publicly-listed (verified) profiles can be claimed.
  if (!coach.is_verified) {
    return NextResponse.json({ error: "This profile isn't available to claim." }, { status: 404 });
  }

  // One coach profile per account.
  const { data: mine } = await db
    .from("coaches")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (mine) {
    return NextResponse.json(
      { error: "Your account is already linked to a coach profile. Contact us if you need to change it." },
      { status: 409 }
    );
  }

  // Link the profile to the account but drop it back to pending review — an admin
  // re-verifies the claim before the coach badge / powers are restored. This keeps
  // a scammer from instantly taking over a verified coach's profile.
  const { data: updated, error } = await db
    .from("coaches")
    .update({
      user_id: user.id,
      status: "pending",
      is_verified: false,
      verified_at: null,
    })
    .eq("id", id)
    .is("user_id", null) // race guard — no-op if claimed in the meantime
    .select("id, first_name, last_name")
    .maybeSingle();

  if (error) {
    console.error("Coach claim error:", error.message);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
  if (!updated) {
    return NextResponse.json({ error: "This coach profile has already been claimed." }, { status: 409 });
  }

  revalidatePath("/coaches");
  revalidatePath(`/coaches/${id}`);

  await notifyAdmins(
    `Coach claim pending review: ${updated.first_name} ${updated.last_name}`,
    `
      <div style="font-family:sans-serif;max-width:600px">
        <h2 style="color:#FDDD58">Coach Profile Claim — Pending Review</h2>
        <p><strong>${updated.first_name} ${updated.last_name}</strong> (${coach.team}) was just claimed and is now pending your verification.</p>
        <p><strong>Claimed by:</strong> ${user.email}</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <p><a href="https://talkinflag.com/admin/coaches">Review in Admin → Coach Applications</a></p>
      </div>
    `
  );

  return NextResponse.json({ ok: true });
}
