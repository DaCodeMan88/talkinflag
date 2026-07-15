import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/eval/admin-client";
import { isAdminEmail } from "@/lib/admin";
import { revalidatePath } from "next/cache";
import { sanitizeChangeRequest } from "@/lib/profile/change-request";

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

  await db
    .from("profile_change_requests")
    .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: user.id })
    .eq("id", id);

  if (status === "approved") {
    // Re-validate at apply time — never trust the stored value blindly.
    const change = sanitizeChangeRequest(reqRow.field, reqRow.new_value);
    if (change) {
      await db
        .from("players")
        .update({ [change.field]: change.value, updated_at: new Date().toISOString() })
        .eq("id", reqRow.player_id);

      // level/team changes affect rankings — bust the profile + list caches.
      revalidatePath(`/players/${reqRow.player_id}`);
      revalidatePath("/players");
    }
  }

  return NextResponse.json({ ok: true });
}
