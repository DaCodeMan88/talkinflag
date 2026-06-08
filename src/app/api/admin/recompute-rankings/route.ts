import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runRecompute } from "@/lib/rankings/recompute";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? "").split(",").map((e) => e.trim()).filter(Boolean);
const CRON_SECRET  = process.env.CRON_SECRET ?? "";

export async function POST(req: NextRequest) {
  // Allow cron invocations via Bearer token
  const auth = req.headers.get("Authorization") ?? "";
  const isCron = CRON_SECRET && auth === `Bearer ${CRON_SECRET}`;

  if (!isCron) {
    // Require authenticated admin session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await runRecompute();
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, rankedCount: result.rankedCount });
}
