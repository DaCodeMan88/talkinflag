import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/eval/admin-client";
import { isAdminEmail } from "@/lib/admin";
import { revalidatePath } from "next/cache";
import { sanitizeChangeRequest, isStatsField } from "@/lib/profile/change-request";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { status } = await req.json().catch(() => ({}));
  if (!["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const db = createAdminClient();

  const { data: reqRow } = await db
    .from("profile_change_requests")
    .select("id, player_id, field, new_value, status")
    .eq("id", id)
    .single();
  if (!reqRow) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (reqRow.status !== "pending") {
    return NextResponse.json({ error: "This request has already been reviewed." }, { status: 409 });
  }

  // Validate BEFORE marking approved — never mark a row approved if the
  // stored value turns out to be inert; leave it pending for an admin to
  // investigate instead of silently lying about what happened.
  let change = null;
  if (status === "approved") {
    change = sanitizeChangeRequest(reqRow.field, reqRow.new_value);
    if (!change) {
      return NextResponse.json(
        { error: "Stored request is no longer valid — cannot apply." },
        { status: 422 },
      );
    }
  }

  // Atomic guard: only transition if still pending, preventing double-processing
  // races (two admin tabs, a slow retry, a replayed request) from clobbering
  // reviewed_by/reviewed_at or re-applying a write that should've been rejected.
  const { data: updated, error: updateError } = await db
    .from("profile_change_requests")
    .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: user.id })
    .eq("id", id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  if (updateError || !updated) {
    return NextResponse.json({ error: "This request was already reviewed by someone else." }, { status: 409 });
  }

  if (change) {
    const now = new Date().toISOString();
    if (isStatsField(change.field)) {
      // roster_year (and future stats-backed fields) live in the `stats` JSONB
      // blob — merge into current stats rather than writing a phantom column.
      const { data: p } = await db
        .from("players")
        .select("stats")
        .eq("id", reqRow.player_id)
        .single();
      const stats = ((p?.stats as Record<string, unknown> | null) ?? {});
      await db
        .from("players")
        .update({ stats: { ...stats, [change.field]: change.value }, updated_at: now })
        .eq("id", reqRow.player_id);
    } else {
      await db
        .from("players")
        .update({ [change.field]: change.value, updated_at: now })
        .eq("id", reqRow.player_id);
    }

    // level/team/roster changes affect rankings — bust the profile + list caches.
    revalidatePath(`/players/${reqRow.player_id}`);
    revalidatePath("/players");
  }

  return NextResponse.json({ ok: true });
}
