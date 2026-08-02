import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { startSession } from "@/lib/assessments/session";

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { kind?: string; subjectKey?: string; totalItems?: number };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const kind = body.kind === "eval" || body.kind === "iq" ? body.kind : null;
  const subjectKey = typeof body.subjectKey === "string" ? body.subjectKey.slice(0, 128) : null;
  const totalItems = Number.isInteger(body.totalItems) ? Number(body.totalItems) : 0;
  if (!kind || !subjectKey || totalItems < 1) {
    return NextResponse.json({ error: "kind, subjectKey and totalItems are required" }, { status: 400 });
  }

  const session = await startSession({
    userId: user.id,
    kind,
    subjectKey,
    totalItems,
    userAgent: req.headers.get("user-agent"),
  });
  return NextResponse.json({ sessionId: session.id });
}
