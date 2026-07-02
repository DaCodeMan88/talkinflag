import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createServerClient();

  const { data: updated, error } = await db
    .from("players")
    .update({
      is_claimed: true,
      claimed_by: user.id,
      claimed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("is_claimed", false) // race guard — no-op if already claimed
    .select("id")
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  if (!updated) return NextResponse.json({ error: "This profile has already been claimed." }, { status: 409 });

  return NextResponse.json({ ok: true });
}
