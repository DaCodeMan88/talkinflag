import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/eval/admin-client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { data: player } = await db
    .from("players")
    .select("id, claimed_by, is_claimed, claim_pending")
    .eq("id", id)
    .single();

  if (!player || !player.is_claimed || player.claimed_by !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (player.claim_pending) {
    return NextResponse.json({ error: "Your claim is still pending review." }, { status: 403 });
  }

  const body = await req.json();
  const recruiting_open = typeof body.recruiting_open === "boolean" ? body.recruiting_open : undefined;
  const recruiting_targets = Array.isArray(body.recruiting_targets) ? body.recruiting_targets : undefined;

  const update: Record<string, unknown> = {};
  if (recruiting_open !== undefined) update.recruiting_open = recruiting_open;
  if (recruiting_targets !== undefined) {
    const valid = ["college", "national", "both"];
    update.recruiting_targets = recruiting_targets.filter((t: unknown) => valid.includes(String(t)));
  }

  const { error } = await db.from("players").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
