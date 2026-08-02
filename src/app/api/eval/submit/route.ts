import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/eval/admin-client";
import { loadActiveItems } from "@/lib/eval/load";
import { scoreFingerprint, normalizeFingerprint, maxPerDimensionFrom } from "@/lib/eval/score";
import { classifyArchetype } from "@/lib/eval/archetype";
import { scienceRollup } from "@/lib/eval/science";
import { aggregateRoleWeights } from "@/lib/eval/aggregate";
import { getEligibleRoles } from "@/lib/eval/eligibility";
import { getOwnedSession, recordEvent } from "@/lib/assessments/session";
import { DIMENSION_KEYS, DIMENSION_SCIENCE, Fingerprint } from "@/lib/eval/dimensions";

const ROLES = ["host", "coach", "expert", "player"] as const;
type Role = (typeof ROLES)[number];

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { answers?: Record<string, number>; role?: string; sessionId?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const answers = body.answers ?? {};
  if (typeof answers !== "object" || Array.isArray(answers)) {
    return NextResponse.json({ error: "answers must be an object" }, { status: 400 });
  }

  // Resolve the role this run counts toward. Host/coach/expert eligibility is
  // derived from existing systems (admin email / verified coach / approved
  // scout); otherwise the run is recorded as 'player' (no poll power).
  let role: Role = "player";
  const requested = body.role as Role | undefined;
  if (requested && requested !== "player" && ROLES.includes(requested)) {
    const eligible = await getEligibleRoles({ id: user.id, email: user.email });
    if (eligible.includes(requested)) role = requested;
  }

  const active = await loadActiveItems();
  if (!active) return NextResponse.json({ error: "No active questionnaire" }, { status: 500 });
  const { questionnaireId, items } = active;

  // Score server-side from the answer key (never trust the client).
  const raw = scoreFingerprint(items.map((i) => ({ id: i.id, options: i.options })), answers);
  const maxes = maxPerDimensionFrom(items.map((i) => ({ section_key: i.section_key, options: i.options })));
  const fingerprint = normalizeFingerprint(raw, maxes);
  const archetype = classifyArchetype(fingerprint);
  const sci = scienceRollup(fingerprint, DIMENSION_SCIENCE);

  const admin = createAdminClient();
  const { error: insErr } = await admin.from("eval_responses").insert({
    user_id: user.id,
    questionnaire_id: questionnaireId,
    role_at_submit: role,
    answers,
    fingerprint,
    science_rollup: sci,
    archetype: archetype.name,
  });
  if (insErr) {
    console.error("eval submit insert error:", insErr.message);
    return NextResponse.json({ error: "Could not save your results" }, { status: 500 });
  }

  // Recompute this role's aggregate weights (skip players — no poll power).
  if (role !== "player") {
    await recomputeRoleWeights(role);
  }

  // Best-effort: mark the telemetry session complete. A missing or foreign
  // session id is ignored silently — it must never block the submission.
  const sessionId = typeof body.sessionId === "string" ? body.sessionId : null;
  if (sessionId) {
    const owned = await getOwnedSession(sessionId, user.id);
    if (owned) {
      try {
        await recordEvent({ sessionId, type: "complete", answeredCount: Object.keys(answers).length });
      } catch (e) { console.error("session complete error:", e instanceof Error ? e.message : e); }
    }
  }

  // Reference vector for the summary "gap vs elite ideal".
  const { data: refRows } = await admin.from("eval_reference").select("key, value");
  const reference: Record<string, number> = {};
  for (const r of refRows ?? []) reference[r.key] = Number(r.value);

  // "Where you part ways with the crowd": compare this user's fingerprint to the
  // aggregate weighting of their constituency (dim.<role>.*). Players carry no
  // poll aggregate of their own, so they're compared to the host crowd as a
  // neutral reference. Returns the single most-over and most-under dimension, or
  // null when there's no crowd aggregate to compare against.
  const crowdDeviation = await computeCrowdDeviation(role, fingerprint);

  return NextResponse.json({
    fingerprint,
    scienceRollup: sci,
    archetype: { name: archetype.name, blurb: archetype.blurb },
    reference,
    role,
    crowdDeviation,
  });
}

export type CrowdDeviation = { dimension: string; delta: number };

/**
 * Top over- and under-weighted dimensions vs the role's crowd aggregate.
 * `delta` is signed (fingerprint − crowd), rounded to 1dp. Returns null if the
 * crowd aggregate is missing (e.g. no aggregate rows written yet). Players are
 * compared to the host crowd since they have no aggregate of their own.
 */
async function computeCrowdDeviation(
  role: Role,
  fingerprint: Fingerprint
): Promise<CrowdDeviation[] | null> {
  const crowdRole: Role = role === "player" ? "host" : role;
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("ranking_weights")
    .select("key, value")
    .like("key", `dim.${crowdRole}.%`);

  const crowd: Partial<Record<string, number>> = {};
  for (const r of rows ?? []) {
    const dim = String(r.key).slice(`dim.${crowdRole}.`.length);
    crowd[dim] = Number(r.value);
  }
  // Need at least one comparable dimension.
  const comparable = DIMENSION_KEYS.filter((k) => crowd[k] !== undefined && Number.isFinite(crowd[k]));
  if (comparable.length === 0) return null;

  let over: CrowdDeviation | null = null;
  let under: CrowdDeviation | null = null;
  for (const k of comparable) {
    const delta = Math.round((fingerprint[k] - (crowd[k] as number)) * 10) / 10;
    if (over === null || delta > over.delta) over = { dimension: k, delta };
    if (under === null || delta < under.delta) under = { dimension: k, delta };
  }
  const out: CrowdDeviation[] = [];
  if (over) out.push(over);
  // Only add the under if it's a different dimension than the over.
  if (under && (!over || under.dimension !== over.dimension)) out.push(under);
  return out.length > 0 ? out : null;
}

async function recomputeRoleWeights(role: Role) {
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("eval_responses")
    .select("user_id, fingerprint, taken_at")
    .eq("role_at_submit", role)
    .order("taken_at", { ascending: false });

  // latest fingerprint per user
  const latest = new Map<string, Fingerprint>();
  for (const r of rows ?? []) {
    if (!latest.has(r.user_id)) latest.set(r.user_id, r.fingerprint as Fingerprint);
  }
  const agg = aggregateRoleWeights([...latest.values()]);

  const upserts = DIMENSION_KEYS.map((k) => ({
    key: `dim.${role}.${k}`,
    value: agg[k],
    description: `${role} constituency aggregate importance for ${k}`,
    source: "aggregate" as const,
    updated_at: new Date().toISOString(),
  }));
  await admin.from("ranking_weights").upsert(upserts, { onConflict: "key" });
}
