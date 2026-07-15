import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@/lib/supabase";
import { rateLimit, getClientIp, retryAfterSeconds } from "@/lib/rate-limit";
import { sanitizeChangeRequest, guardedFieldLabel } from "@/lib/profile/change-request";
import { notifyAdmins } from "@/lib/claims";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ip = getClientIp(req);
  const rl = rateLimit(`pcr:${ip}`, { limit: 5, windowMs: 60_000 });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests — try again shortly." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds(rl.reset)) } }
    );
  }

  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const change = sanitizeChangeRequest(body?.field, body?.new_value);
  if (!change) return NextResponse.json({ error: "Invalid change request." }, { status: 400 });

  const db = createServerClient();
  const { data: player } = await db
    .from("players")
    .select("id, first_name, last_name, claimed_by, is_claimed, claim_pending, school_or_team, level")
    .eq("id", id)
    .single();
  if (!player || !player.is_claimed || player.claim_pending || player.claimed_by !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: existing } = await db
    .from("profile_change_requests")
    .select("id")
    .eq("player_id", id)
    .eq("field", change.field)
    .eq("status", "pending")
    .maybeSingle();
  if (existing) {
    return NextResponse.json(
      { error: "You already have a pending request for this field." },
      { status: 409 }
    );
  }

  const oldValue = (player as Record<string, unknown>)[change.field];
  const { error } = await db.from("profile_change_requests").insert({
    player_id: id,
    requested_by: user.id,
    field: change.field,
    old_value: oldValue != null ? String(oldValue) : null,
    new_value: change.value,
    status: "pending",
  });
  if (error) {
    console.error("Profile change request insert error:", error.message);
    return NextResponse.json({ error: "Could not save request." }, { status: 500 });
  }

  await notifyAdmins(
    `Profile change request: ${player.first_name} ${player.last_name}`,
    `<div style="font-family:sans-serif;max-width:600px">
       <h2 style="color:#FDDD58">Profile Change Request</h2>
       <p><strong>${escapeHtml(player.first_name)} ${escapeHtml(player.last_name)}</strong> requested a change to
       <strong>${guardedFieldLabel(change.field)}</strong>.</p>
       <p>From: <em>${oldValue != null ? escapeHtml(String(oldValue)) : "—"}</em> → To: <strong>${escapeHtml(change.value)}</strong></p>
       <p><a href="https://talkinflag.com/admin/change-requests">Review in Admin</a></p>
     </div>`
  );

  return NextResponse.json({ ok: true });
}
