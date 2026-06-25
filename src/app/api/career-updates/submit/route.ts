import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/eval/admin-client";
import { getEligibleRoles } from "@/lib/eval/eligibility";
import { isValidKind, kindsForRoles, kindDef, type CareerRole } from "@/lib/career/kinds";
import { rateLimit, getClientIp, retryAfterSeconds } from "@/lib/rate-limit";

const MAX_LEN = 280;

function clampStr(v: unknown, max = MAX_LEN): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t ? t.slice(0, max) : undefined;
}

export async function POST(req: NextRequest) {
  // Per-IP rate limit (auth required, but still cap abuse).
  const ip = getClientIp(req);
  const rl = rateLimit(`career-submit:${ip}`, { limit: 5, windowMs: 60_000 });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests — try again shortly." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds(rl.reset)) } },
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Honeypot.
  if (typeof body.website_url === "string" && body.website_url.trim()) {
    return NextResponse.json({ ok: true }); // silently accept-and-drop bots
  }

  const kind = String(body.kind ?? "");
  if (!isValidKind(kind)) {
    return NextResponse.json({ error: "Invalid update type" }, { status: 400 });
  }

  // Roles the member actually holds; players always allowed for achievements.
  const roles = (await getEligibleRoles(user)).filter((r): r is CareerRole =>
    r === "coach" || r === "expert" || r === "player",
  );
  const allowedKinds = new Set(kindsForRoles(roles).map((k) => k.kind));
  if (!allowedKinds.has(kind)) {
    return NextResponse.json({ error: "You can't submit that update type." }, { status: 403 });
  }

  // The role they submit as: the most specific role they hold that this kind
  // allows (coach/expert credentials over a plain player achievement).
  const def = kindDef(kind)!;
  const ROLE_PRIORITY: CareerRole[] = ["coach", "expert", "player"];
  const submitRole: CareerRole =
    ROLE_PRIORITY.find((r) => roles.includes(r) && def.roles.includes(r)) ?? "player";

  // Build a sanitized detail object from the allowed fields for this kind.
  const rawDetail = (body.detail ?? {}) as Record<string, unknown>;
  const detail: Record<string, string> = {};
  for (const f of def.fields) {
    const v = clampStr(rawDetail[f], f === "description" ? 600 : MAX_LEN);
    if (v) detail[f] = v;
  }
  if (Object.keys(detail).length === 0) {
    return NextResponse.json({ error: "Add at least one detail." }, { status: 400 });
  }

  const evidenceUrl = clampStr(body.evidence_url, 500);
  if (evidenceUrl && !/^https?:\/\//i.test(evidenceUrl)) {
    return NextResponse.json({ error: "Evidence link must be a URL." }, { status: 400 });
  }

  const db = createAdminClient();
  const { error } = await db.from("career_updates").insert({
    subject_user_id: user.id,
    role: submitRole,
    kind,
    detail,
    evidence_url: evidenceUrl ?? null,
    status: "pending",
  });

  if (error) {
    return NextResponse.json({ error: "Could not save update." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
