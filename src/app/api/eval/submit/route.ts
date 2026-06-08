import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/eval/admin-client";
import { loadActiveItems } from "@/lib/eval/load";
import { scoreFingerprint, normalizeFingerprint, maxPerDimensionFrom } from "@/lib/eval/score";
import { classifyArchetype } from "@/lib/eval/archetype";
import { scienceRollup } from "@/lib/eval/science";
import { aggregateRoleWeights } from "@/lib/eval/aggregate";
import { DIMENSION_KEYS, DIMENSION_SCIENCE, Fingerprint } from "@/lib/eval/dimensions";

const ROLES = ["host", "coach", "expert", "player"] as const;
type Role = (typeof ROLES)[number];

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { answers?: Record<string, number>; role?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const answers = body.answers ?? {};
  if (typeof answers !== "object" || Array.isArray(answers)) {
    return NextResponse.json({ error: "answers must be an object" }, { status: 400 });
  }

  // Resolve the role this run counts toward. Host/coach/expert require an
  // approved member_role; otherwise the run is recorded as 'player' (no poll power).
  let role: Role = "player";
  const requested = body.role as Role | undefined;
  if (requested && requested !== "player" && ROLES.includes(requested)) {
    const { data: mr } = await supabase
      .from("member_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", requested)
      .eq("status", "approved")
      .maybeSingle();
    if (mr) role = requested;
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

  // Reference vector for the summary "gap vs elite ideal".
  const { data: refRows } = await admin.from("eval_reference").select("key, value");
  const reference: Record<string, number> = {};
  for (const r of refRows ?? []) reference[r.key] = Number(r.value);

  return NextResponse.json({
    fingerprint,
    scienceRollup: sci,
    archetype: { name: archetype.name, blurb: archetype.blurb },
    reference,
    role,
  });
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
