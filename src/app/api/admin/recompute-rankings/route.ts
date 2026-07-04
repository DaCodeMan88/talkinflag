import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { runRecompute } from "@/lib/rankings/recompute";

const CRON_SECRET = process.env.CRON_SECRET ?? "";

function isCronRequest(req: NextRequest): boolean {
  const auth = req.headers.get("Authorization") ?? "";
  return Boolean(CRON_SECRET) && auth === `Bearer ${CRON_SECRET}`;
}

async function recompute() {
  const result = await runRecompute();
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, rankedCount: result.rankedCount });
}

export async function POST(req: NextRequest) {
  // Allow cron invocations via Bearer token; otherwise require an admin session.
  if (!isCronRequest(req)) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  return recompute();
}

// Vercel Cron invokes the weekly recompute via GET (Sunday 02:00 UTC, see
// vercel.json). Vercel automatically attaches `Authorization: Bearer $CRON_SECRET`
// when the CRON_SECRET env var is set, so GET is cron-only — no session path.
export async function GET(req: NextRequest) {
  if (!isCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return recompute();
}
