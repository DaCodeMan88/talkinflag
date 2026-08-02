import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getOwnedSession, recordEvent } from "@/lib/assessments/session";

const ALLOWED_TYPES = ["answer", "back", "resume", "checkpoint"] as const;
type AllowedType = (typeof ALLOWED_TYPES)[number];

function isNonNegInt(v: unknown): v is number {
  return Number.isInteger(v) && (v as number) >= 0;
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    sessionId?: string;
    type?: string;
    itemIndex?: number;
    itemId?: string;
    msOnItem?: number;
    answeredCount?: number;
    correct?: boolean;
  };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const sessionId = typeof body.sessionId === "string" && body.sessionId.length > 0 ? body.sessionId : null;
  const type = ALLOWED_TYPES.includes(body.type as AllowedType) ? (body.type as AllowedType) : null;
  if (!sessionId || !type) {
    return NextResponse.json({ error: "sessionId and a valid type are required" }, { status: 400 });
  }

  // NEVER trust a client-supplied session id — enforce ownership.
  const session = await getOwnedSession(sessionId, user.id);
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  // Telemetry must never break the quiz: swallow write failures.
  try {
    await recordEvent({
      sessionId,
      type,
      itemIndex: isNonNegInt(body.itemIndex) ? body.itemIndex : undefined,
      itemId: typeof body.itemId === "string" && body.itemId.length > 0 ? body.itemId : undefined,
      msOnItem: isNonNegInt(body.msOnItem) ? body.msOnItem : undefined,
      answeredCount: isNonNegInt(body.answeredCount) ? body.answeredCount : undefined,
      correct: typeof body.correct === "boolean" ? body.correct : undefined,
    });
  } catch (e) {
    console.error("assessment event insert error:", e instanceof Error ? e.message : e);
  }

  return NextResponse.json({ ok: true });
}
