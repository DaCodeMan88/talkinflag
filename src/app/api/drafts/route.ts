import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/eval/admin-client";

// Universal save-&-resume backend. Every read/write is scoped to the
// authenticated user; the service-role client bypasses RLS (the table has no
// policies — see migration 008). Drafts are small in-progress form payloads.

const ALLOWED_KINDS = new Set([
  "quiz:coach",
  "quiz:general",
  "profile",
  "eval",
  "career_update",
]);

const MAX_BYTES = 64 * 1024; // generous cap for an in-progress form payload

function normRef(ref: string | null | undefined): string {
  return (ref ?? "").slice(0, 128);
}

export async function GET(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const kind = req.nextUrl.searchParams.get("kind") ?? "";
  if (!ALLOWED_KINDS.has(kind)) return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  const ref = normRef(req.nextUrl.searchParams.get("ref"));

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("form_drafts")
    .select("data, updated_at")
    .eq("user_id", user.id)
    .eq("kind", kind)
    .eq("ref", ref)
    .maybeSingle();
  if (error) {
    console.error("drafts GET error:", error.message);
    return NextResponse.json({ error: "Could not load draft" }, { status: 500 });
  }
  return NextResponse.json({ draft: data ?? null });
}

export async function PUT(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { kind?: string; ref?: string; data?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const kind = body.kind ?? "";
  if (!ALLOWED_KINDS.has(kind)) return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  const ref = normRef(body.ref);

  const data = body.data;
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return NextResponse.json({ error: "data must be an object" }, { status: 400 });
  }
  if (JSON.stringify(data).length > MAX_BYTES) {
    return NextResponse.json({ error: "Draft too large" }, { status: 413 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("form_drafts")
    .upsert(
      { user_id: user.id, kind, ref, data, updated_at: new Date().toISOString() },
      { onConflict: "user_id,kind,ref" }
    );
  if (error) {
    console.error("drafts PUT error:", error.message);
    return NextResponse.json({ error: "Could not save draft" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const kind = req.nextUrl.searchParams.get("kind") ?? "";
  if (!ALLOWED_KINDS.has(kind)) return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  const ref = normRef(req.nextUrl.searchParams.get("ref"));

  const admin = createAdminClient();
  const { error } = await admin
    .from("form_drafts")
    .delete()
    .eq("user_id", user.id)
    .eq("kind", kind)
    .eq("ref", ref);
  if (error) {
    console.error("drafts DELETE error:", error.message);
    return NextResponse.json({ error: "Could not clear draft" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
