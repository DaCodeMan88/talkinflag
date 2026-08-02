# Assessments 10x — Evaluation, Flag IQ & Coach IQ Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the Evaluation Philosophy, Flag IQ and Coach IQ assessments so they measure something real (varied question *types*, not 50 clones of one Likert item), can't be gamed by test-wise guessing, are instrumented end-to-end so completion rate is a number we can watch, and are owner-editable by Ambra and Coach Jon without a deploy.

**Architecture:** Three layers, in dependency order. (1) A shared `assessment_sessions` + `assessment_events` spine that gives us per-item drop-off telemetry *and* the server-side nonce that makes per-attempt option shuffling tamper-proof. (2) A typed item system — `item_type ∈ likert | forced_choice | budget | rank | scenario` — with one pure scoring function per type, replacing the current "every item is a 0–4 Likert on its own dimension" model that produces flat, non-discriminating fingerprints. (3) UX and content on top: chunked rounds with checkpoints, instant IQ feedback, deeper results, and an admin authoring/review surface that finally lets the owners confirm the Coach IQ answer key.

**Tech Stack:** Next.js 15 App Router · TypeScript · Tailwind · Supabase (Postgres + RLS) · Vitest · Resend

---

## Why This Plan Exists — Evidence From the Live System

Ambra and Coach Jon said: *"the questions seem all too similar likewise with the answers that most people will select… There needs to be a better variety of mix up types questions and answers to choose from and ways to answer. Keep the quizzes and assessments from being boring or feeling redundant."*

That feedback is not a matter of taste. It is mechanically true and provable from the data:

| Finding | Evidence | Consequence |
|---|---|---|
| **Every eval item is the same question.** All 50 items in `scripts/data/eval-items.json` share the identical stem `"When you evaluate a player, how much does it matter that a player …?"`, all are `style:"importance"`, all have exactly 5 options, all score `[0,1,2,3,4]` ascending into their own section's dimension. | `Counter(prompt[:40])` → `{'When you evaluate a player, how much doe': 50}` | Ambra's exact complaint. Nothing forces a tradeoff, so nothing discriminates. |
| **Ceiling effect, confirmed in production.** Of 397 real answers across the 5 submitted evaluations: option 4 = 53.9%, option 3 = 33.0%, option 2 = 12.3%, option 1 = 0.8%, **option 0 = never chosen, not once.** | `SELECT choice, count(*) FROM eval_responses` unnested | The 5-point scale is effectively a 3-point scale skewed to the top. "Everything matters a lot" is the only reachable answer. |
| **Fingerprints are flat, so archetypes are noise.** One live respondent scored `athleticism 10, football_iq 10, defense 10, clutch 10, intangibles 10, versatility 10, ball_skills 9.75, production 9, competition 9, consistency 9` — and was labeled "Athlete-First Scout." | `SELECT archetype, fingerprint FROM eval_responses` | `classifyArchetype` uses raw Euclidean distance, so **magnitude dominates shape**: a max-everything vector always lands on whichever centroid has the largest norm. The label is meaningless. |
| **Coach IQ answer key is guessable.** 28 of 32 correct answers sit at `correct_index === 1`, and **31 of 32** times the correct answer is the single longest string in the choice array. | `scripts/data/iq-questions-coach.json` | Answering "always B" scores 87%. Answering "always the longest one" scores 97% — with zero flag football knowledge. |
| **Core IQ has the same bias.** 32/40 at index 1; 30/40 longest-is-correct. | `scripts/data/iq-questions.json` | Same exploit, 80–75%. |
| **This is a rankings-integrity problem, not just a quiz problem.** Coach IQ `score_pct` is the primary driver of coach voting weight in TF Rankings (`src/lib/eval/coachWeight.ts`). | `CLAUDE.md` → Coach IQ Quiz Phase 2 | A gamed 97% buys real influence over the public rankings. |
| **Nobody has ever taken Coach IQ.** `iq_attempts` has 10 rows, all `category='general'`, avg 80.0%. Zero coach attempts. | `SELECT category, count(*) FROM iq_attempts` | The owner action "confirm each Coach IQ `correct_index`" has been open since 2026-06-25 because there is no surface to do it in. |
| **We cannot measure completion rate at all.** There is no start event, no per-item event, no abandon record. `form_drafts` (6 rows) is the only incidental signal. | schema sweep | "Improve completion rate" is currently unfalsifiable. Phase 0 exists to fix this before anything else. |
| **No option shuffling anywhere.** Both runners render `options` in stored order every time. | `EvaluationRunner.tsx:197`, `IQQuizRunner.tsx:199` | Retakes are memorization, and position bias above is fully exploitable. |
| **Latent normalization bug.** `maxPerDimensionFrom` credits only the *highest-scoring option's* dimension per item. It is accidentally correct today only because every item is single-dimension. | `src/lib/eval/score.ts:47-57` | The moment we introduce mixed-dimension items (Phase 2), normalization silently breaks. Task 8 fixes it first, with tests. |

**Out of scope for this plan** (from the same meeting notes, tracked separately): removing "Top 10 Plays" and "Athlete of the Week", and the admin blog authoring/SEO tooling. Those are their own plans — do not touch them here.

---

## Design Decisions (read before Task 1)

**1. Sessions are the spine.** `assessment_sessions` solves three problems with one table: it records start/last-seen/complete (→ completion rate), it stores `last_index` (→ where people quit), and it holds a server-side `nonce` used to derive the option permutation. The client never sends a permutation — it sends the session id, and the server re-derives the identical shuffle from `(nonce, item_id)`. That is what makes shuffling safe for a scored quiz.

**2. Item types, not styles.** The existing `style` column (`importance | tradeoff`) is unused in scoring — every row is `importance`. We add a real `item_type` column and a discriminated union in TypeScript. Each type gets one pure, tested scoring function. Old `likert` items keep working unchanged, so the 5 existing `eval_responses` rows stay readable.

**3. Fewer, harder items.** The eval goes 50 → 28. Forced choices and budget allocations extract far more signal per question than Likert agreement, and 28 items is ~2.5 minutes instead of ~4. Both quality *and* completion improve; they are not in tension here.

**4. Archetype by shape, not magnitude.** Replace Euclidean distance with cosine similarity on the mean-centered vector. A max-everything respondent then gets classified by their *relative* emphasis, and if they genuinely have no emphasis they get an explicit "Balanced Evaluator" archetype rather than a random label.

**5. Backward compatibility is required.** `eval_responses.answers` currently holds `Record<itemId, number>`. New types need `number | number[] | Record<string, number>`. Scoring must accept both shapes. Do not migrate or rewrite the 5 existing rows.

**6. Do not re-run the rankings recompute.** `CLAUDE.md` is explicit: the live cohort recompute has already been run against production. Nothing in this plan may trigger it. Re-seeding the eval bank changes `ranking_weights` only via new submissions, which is correct and intended.

---

## Task Map

| # | Task | Layer |
|---|---|---|
| 1 | `assessment_sessions` + `assessment_events` migration | Spine |
| 2 | Pure permutation module (`shuffle.ts`) | Spine |
| 3 | Session lifecycle lib + API routes | Spine |
| 4 | Wire sessions into both runners (telemetry only) | Spine |
| 5 | Admin funnel dashboard `/admin/assessments` | Spine |
| 6 | Answer-key bias audit script | Integrity |
| 7 | De-bias + shuffle the IQ banks | Integrity |
| 8 | Fix `maxPerDimensionFrom` for mixed-dimension items | Integrity |
| 9 | Archetype: cosine shape matching + Balanced | Integrity |
| 10 | `item_type` migration + typed item schema | Types |
| 11 | Scoring: `forced_choice` | Types |
| 12 | Scoring: `budget` | Types |
| 13 | Scoring: `rank` | Types |
| 14 | Scoring: `scenario` + unified dispatcher | Types |
| 15 | Author the new 28-item eval bank | Content |
| 16 | Runner UI: one component per item type | UX |
| 17 | Rounds + checkpoint screens | UX |
| 18 | IQ instant-feedback mode + streaks | UX |
| 19 | Results depth: sections, percentile, what-to-study | UX |
| 20 | Admin authoring/review surface for both banks | Owner |
| 21 | Abandoned-assessment email nudge | Retention |
| 22 | Full verification + owner note | Ship |

Tasks 1–9 are independently shippable and carry no content risk. Tasks 10–16 must land together (the runner must understand every type in the bank before the bank ships). Commit after every task.

---

## Task 1: Assessment sessions + events schema

**Files:**
- Create: `supabase/migrations/020_assessment_sessions.sql`
- Test: verified by SQL, applied via Supabase MCP `apply_migration`

**Step 1: Write the migration**

```sql
-- Assessment telemetry + tamper-proof shuffle spine.
-- Serves BOTH the eval questionnaire and the IQ quizzes.
-- `nonce` is server-only: the client sends a session id, never a permutation.

CREATE TABLE IF NOT EXISTS assessment_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('eval','iq')),
  subject_key TEXT NOT NULL,              -- eval: questionnaire id · iq: category
  nonce TEXT NOT NULL,                    -- server-only shuffle seed
  total_items INTEGER NOT NULL,
  answered_count INTEGER NOT NULL DEFAULT 0,
  last_index INTEGER NOT NULL DEFAULT 0,  -- furthest question reached (drop-off point)
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,               -- NULL = not finished
  nudged_at TIMESTAMPTZ,                  -- set when the abandon email fires (Task 21)
  user_agent TEXT
);
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_user ON assessment_sessions(user_id, kind);
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_open
  ON assessment_sessions(kind, completed_at, last_seen_at) WHERE completed_at IS NULL;

CREATE TABLE IF NOT EXISTS assessment_events (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES assessment_sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('start','answer','back','resume','checkpoint','complete')),
  item_index INTEGER,                     -- 0-based position in the run
  item_id UUID,                           -- eval_items.id / iq_questions.id
  correct BOOLEAN,                        -- iq only; NULL for eval
  ms_on_item INTEGER,                     -- time spent before answering
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_assessment_events_session ON assessment_events(session_id, id);
CREATE INDEX IF NOT EXISTS idx_assessment_events_item ON assessment_events(item_id, type);

-- Service-role only (matches eval_items / iq_questions): the nonce must never
-- reach a browser, and per-item difficulty stats are not public.
ALTER TABLE assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_events   ENABLE ROW LEVEL SECURITY;
```

**Step 2: Apply it**

Use the Supabase MCP `apply_migration` tool against project `wxeuybksowhncalrnttl`, name `020_assessment_sessions`.

**Step 3: Verify**

Run via MCP `execute_sql`:
```sql
select table_name, count(*) cols from information_schema.columns
where table_name in ('assessment_sessions','assessment_events') group by 1;
```
Expected: two rows, `assessment_sessions` 13 cols, `assessment_events` 8 cols.

**Step 4: Confirm RLS has no policies (service-role only)**

```sql
select tablename, count(*) from pg_policies
where tablename like 'assessment_%' group by 1;
```
Expected: **zero rows.** If any policy exists, drop it — these tables are service-role only, per the RLS sweep rules in `CLAUDE.md`.

**Step 5: Commit**

```bash
git add supabase/migrations/020_assessment_sessions.sql && git commit -m "feat: assessment session + event telemetry schema"
```

---

## Task 2: Deterministic option shuffle

The permutation must be derivable identically on every request from `(nonce, itemId)` with no stored state, and must be a genuine permutation (never drop or duplicate an option).

**Files:**
- Create: `src/lib/assessments/shuffle.ts`
- Test: `src/lib/assessments/shuffle.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { permutationFor, applyPermutation, invertChoice } from "./shuffle";

describe("permutationFor", () => {
  it("is deterministic for the same nonce + item", () => {
    expect(permutationFor("n1", "item-a", 4)).toEqual(permutationFor("n1", "item-a", 4));
  });

  it("differs across items and across nonces", () => {
    const a = permutationFor("n1", "item-a", 5);
    const b = permutationFor("n1", "item-b", 5);
    const c = permutationFor("n2", "item-a", 5);
    expect(a).not.toEqual(b);
    expect(a).not.toEqual(c);
  });

  it("is always a true permutation of 0..n-1", () => {
    for (const n of [2, 3, 4, 5, 9]) {
      const p = permutationFor("seed", `i${n}`, n);
      expect([...p].sort((x, y) => x - y)).toEqual([...Array(n).keys()]);
    }
  });
});

describe("applyPermutation / invertChoice", () => {
  it("round-trips a chosen display index back to the stored index", () => {
    const options = ["a", "b", "c", "d"];
    const perm = permutationFor("n1", "item-a", 4);
    const shown = applyPermutation(options, perm);
    for (let displayed = 0; displayed < 4; displayed++) {
      const stored = invertChoice(perm, displayed);
      expect(options[stored]).toBe(shown[displayed]);
    }
  });

  it("returns -1 for an out-of-range displayed index", () => {
    expect(invertChoice(permutationFor("n", "i", 4), 9)).toBe(-1);
    expect(invertChoice(permutationFor("n", "i", 4), -1)).toBe(-1);
  });
});
```

**Step 2: Run it and watch it fail**

Run: `npx vitest run src/lib/assessments/shuffle.test.ts`
Expected: FAIL — `Failed to resolve import "./shuffle"`.

**Step 3: Implement**

```ts
// Deterministic, stateless option shuffling.
//
// The server derives the permutation from a session nonce it never reveals, so
// a client cannot claim a permutation that maps its answer onto the key. Same
// nonce + same item => same order on every render and at submit time.

/** FNV-1a — small, fast, dependency-free, good enough to seed a PRNG. */
function hash32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 — deterministic PRNG in [0,1). */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Permutation of 0..length-1. `perm[displayIndex] = storedIndex`, i.e. the
 * option shown in slot i is the stored option at perm[i].
 */
export function permutationFor(nonce: string, itemId: string, length: number): number[] {
  const next = rng(hash32(`${nonce}:${itemId}`));
  const p = [...Array(length).keys()];
  for (let i = length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  return p;
}

/** Reorder options into display order. */
export function applyPermutation<T>(options: T[], perm: number[]): T[] {
  return perm.map((storedIdx) => options[storedIdx]);
}

/** Map a displayed choice index back to the stored index. -1 if out of range. */
export function invertChoice(perm: number[], displayedIndex: number): number {
  if (!Number.isInteger(displayedIndex) || displayedIndex < 0 || displayedIndex >= perm.length) return -1;
  return perm[displayedIndex];
}
```

**Step 4: Run tests**

Run: `npx vitest run src/lib/assessments/shuffle.test.ts`
Expected: PASS, 5 tests.

> If "differs across items" ever fails for a tiny `n`, that is a legitimate collision, not a bug — two 2-option items can collide. Keep the test at `n=5`.

**Step 5: Commit**

```bash
git add src/lib/assessments/shuffle.ts src/lib/assessments/shuffle.test.ts && git commit -m "feat: deterministic tamper-proof option shuffle"
```

---

## Task 3: Session lifecycle library + API

**Files:**
- Create: `src/lib/assessments/session.ts`
- Create: `src/app/api/assessments/session/route.ts` (POST = start)
- Create: `src/app/api/assessments/event/route.ts` (POST = record event / heartbeat)
- Test: `src/lib/assessments/session.test.ts`

**Step 1: Write the failing test** (pure logic only — the DB calls are thin wrappers)

```ts
import { describe, it, expect } from "vitest";
import { completionRate, dropOffHistogram, isAbandoned } from "./session";

describe("completionRate", () => {
  it("is completed/started as a 0-100 percentage", () => {
    expect(completionRate([{ completed_at: "x" }, { completed_at: null }, { completed_at: "y" }])).toBe(66.7);
  });
  it("is 0 when nothing has started", () => {
    expect(completionRate([])).toBe(0);
  });
});

describe("dropOffHistogram", () => {
  it("buckets unfinished sessions by their furthest question", () => {
    const h = dropOffHistogram(
      [
        { completed_at: null, last_index: 0 },
        { completed_at: null, last_index: 3 },
        { completed_at: null, last_index: 3 },
        { completed_at: "done", last_index: 27 },
      ],
      28
    );
    expect(h[0]).toBe(1);
    expect(h[3]).toBe(2);
    expect(h[27]).toBe(0); // completed sessions are not drop-offs
    expect(h).toHaveLength(28);
  });
});

describe("isAbandoned", () => {
  const now = new Date("2026-08-01T12:00:00Z");
  it("is true for an unfinished session idle over 30 minutes with real progress", () => {
    expect(isAbandoned({ completed_at: null, answered_count: 6, last_seen_at: "2026-08-01T11:00:00Z" }, now)).toBe(true);
  });
  it("is false while the session is still warm", () => {
    expect(isAbandoned({ completed_at: null, answered_count: 6, last_seen_at: "2026-08-01T11:50:00Z" }, now)).toBe(false);
  });
  it("is false when they never really started", () => {
    expect(isAbandoned({ completed_at: null, answered_count: 0, last_seen_at: "2026-08-01T11:00:00Z" }, now)).toBe(false);
  });
  it("is false once completed", () => {
    expect(isAbandoned({ completed_at: "x", answered_count: 28, last_seen_at: "2026-08-01T11:00:00Z" }, now)).toBe(false);
  });
});
```

**Step 2: Run it, watch it fail**

Run: `npx vitest run src/lib/assessments/session.test.ts` → FAIL (module not found).

**Step 3: Implement `src/lib/assessments/session.ts`**

```ts
import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/eval/admin-client";

export type SessionKind = "eval" | "iq";

export type SessionRow = {
  id: string;
  nonce: string;
  total_items: number;
  answered_count: number;
  last_index: number;
  completed_at: string | null;
};

const ABANDON_AFTER_MS = 30 * 60 * 1000;

// ---------- pure helpers (tested) ----------

export function completionRate(rows: { completed_at: string | null }[]): number {
  if (rows.length === 0) return 0;
  const done = rows.filter((r) => r.completed_at).length;
  return Math.round((done / rows.length) * 1000) / 10;
}

/** Count of unfinished sessions whose furthest question was index i. */
export function dropOffHistogram(
  rows: { completed_at: string | null; last_index: number }[],
  totalItems: number
): number[] {
  const out = new Array(totalItems).fill(0);
  for (const r of rows) {
    if (r.completed_at) continue;
    const i = Math.min(Math.max(r.last_index, 0), totalItems - 1);
    out[i] += 1;
  }
  return out;
}

/** Unfinished, idle past the window, and they had actually engaged. */
export function isAbandoned(
  row: { completed_at: string | null; answered_count: number; last_seen_at: string },
  now: Date = new Date()
): boolean {
  if (row.completed_at) return false;
  if (row.answered_count < 1) return false;
  return now.getTime() - new Date(row.last_seen_at).getTime() > ABANDON_AFTER_MS;
}

// ---------- DB wrappers (service role only) ----------

export async function startSession(args: {
  userId: string;
  kind: SessionKind;
  subjectKey: string;
  totalItems: number;
  userAgent?: string | null;
}): Promise<SessionRow> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("assessment_sessions")
    .insert({
      user_id: args.userId,
      kind: args.kind,
      subject_key: args.subjectKey,
      nonce: randomBytes(16).toString("hex"),
      total_items: args.totalItems,
      user_agent: args.userAgent ?? null,
    })
    .select("id, nonce, total_items, answered_count, last_index, completed_at")
    .single();
  if (error) throw new Error(`startSession: ${error.message}`);
  await db.from("assessment_events").insert({ session_id: data.id, type: "start", item_index: 0 });
  return data as SessionRow;
}

/** Load a session, enforcing ownership. Returns null if missing or not theirs. */
export async function getOwnedSession(sessionId: string, userId: string): Promise<SessionRow | null> {
  const db = createAdminClient();
  const { data } = await db
    .from("assessment_sessions")
    .select("id, nonce, total_items, answered_count, last_index, completed_at")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .limit(1);
  return (data?.[0] as SessionRow) ?? null;
}

export async function recordEvent(args: {
  sessionId: string;
  type: "answer" | "back" | "resume" | "checkpoint" | "complete";
  itemIndex?: number;
  itemId?: string | null;
  correct?: boolean | null;
  msOnItem?: number | null;
  answeredCount?: number;
}): Promise<void> {
  const db = createAdminClient();
  await db.from("assessment_events").insert({
    session_id: args.sessionId,
    type: args.type,
    item_index: args.itemIndex ?? null,
    item_id: args.itemId ?? null,
    correct: args.correct ?? null,
    ms_on_item: args.msOnItem ?? null,
  });

  const patch: Record<string, unknown> = { last_seen_at: new Date().toISOString() };
  if (args.itemIndex !== undefined) patch.last_index = args.itemIndex;
  if (args.answeredCount !== undefined) patch.answered_count = args.answeredCount;
  if (args.type === "complete") patch.completed_at = new Date().toISOString();
  await db.from("assessment_sessions").update(patch).eq("id", args.sessionId);
}
```

> **`last_index` is furthest-reached, not current.** Going Back must not lower it. The update above sets it directly; change to a guarded update if a Back event ever regresses the number in practice — verify in Task 5's dashboard before trusting the histogram.

**Step 4: Run tests → PASS (9 tests).**

**Step 5: Add the two API routes**

`src/app/api/assessments/session/route.ts`:
```ts
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
  // nonce stays server-side — only the id goes to the client.
  return NextResponse.json({ sessionId: session.id });
}
```

`src/app/api/assessments/event/route.ts`: same auth shape; read `{ sessionId, type, itemIndex, itemId, msOnItem, answeredCount }`, call `getOwnedSession` and **404 if it returns null** (never trust a client-supplied session id), reject `type === "complete"` (only the submit routes may complete a session), then `recordEvent`. Return `{ ok: true }`.

**Step 6: Typecheck and commit**

```bash
npx tsc --noEmit && npx vitest run src/lib/assessments
```
```bash
git add src/lib/assessments src/app/api/assessments && git commit -m "feat: assessment session lifecycle + telemetry API"
```

---

## Task 4: Wire sessions into both runners (telemetry only, no UX change yet)

This task must be behaviourally invisible. Nothing about how the quiz looks or scores changes — we are only lighting up the funnel.

**Files:**
- Create: `src/hooks/useAssessmentSession.ts`
- Modify: `src/components/eval/EvaluationRunner.tsx`, `src/components/iq/IQQuizRunner.tsx`
- Modify: `src/app/api/eval/submit/route.ts`, `src/app/api/iq/submit/route.ts`

**Step 1: Write the hook**

`src/hooks/useAssessmentSession.ts` — client hook exposing `{ sessionId, track }`:
- On mount (once, guarded by a ref so React 19 StrictMode double-invoke can't create two sessions), `POST /api/assessments/session` with `{ kind, subjectKey, totalItems }`, store `sessionId` in state.
- `track(type, { itemIndex, itemId, answeredCount })` fires `POST /api/assessments/event` with `keepalive: true` and **swallows all errors** — telemetry must never break a quiz.
- Track ms-on-item internally: keep a `lastItemAtRef` timestamp, send the delta as `msOnItem`, reset on each answer.

**Step 2: Call it from `EvaluationRunner`**

- `const { sessionId, track } = useAssessmentSession({ kind: "eval", subjectKey: "active", totalItems: total, enabled: started });`
- In `choose()`, after `setAnswers(next)`: `track("answer", { itemIndex: index, itemId: item.id, answeredCount: Object.keys(next).length })`.
- In the Back handler: `track("back", { itemIndex: index })`.
- In the resume handler: `track("resume", { itemIndex: v.index ?? 0 })`.
- Pass `sessionId` in the `submit()` POST body.

**Step 3: Same in `IQQuizRunner`** with `kind: "iq"`, `subjectKey: category`.

**Step 4: Complete the session server-side**

In both submit routes, after the successful insert, read `sessionId` from the body and — only if `getOwnedSession(sessionId, user.id)` returns a row — call `recordEvent({ sessionId, type: "complete", answeredCount })`. A missing or foreign session id is ignored silently; it must never block a submission.

**Step 5: Verify end-to-end in the browser**

```bash
npm run dev
```
Use `preview_start` with the `.claude/launch.json` config, sign in, start `/iq/general`, answer 3 questions, then close the tab. Then:
```sql
select s.kind, s.subject_key, s.answered_count, s.last_index, s.completed_at,
       (select count(*) from assessment_events e where e.session_id = s.id) events
from assessment_sessions s order by s.started_at desc limit 5;
```
Expected: one row, `answered_count = 3`, `last_index = 2`, `completed_at` NULL, `events = 4` (1 start + 3 answers). Then finish a full run and confirm a second row lands with `completed_at` set.

**Step 6: Commit**

```bash
git add -A && git commit -m "feat: instrument eval + IQ runners with session telemetry"
```

---

## Task 5: Admin funnel dashboard

**Files:**
- Create: `src/app/admin/assessments/page.tsx`
- Modify: `src/components/admin/AdminSidebar.tsx` (add the nav link)

**Step 1: Build the page.** Server component, `export const dynamic = "force-dynamic"`. **Gate with `getAdminUser`** — middleware does not protect `/admin` (see the RLS sweep note in `CLAUDE.md`). Use `createAdminClient` for all reads.

Render, per assessment (`eval`, `iq:general`, `iq:coach`):
- **Starts · Completions · Completion rate** (`completionRate`) — the headline number this whole plan is judged on.
- **Median time to complete** — from `started_at` → `completed_at` on completed rows.
- **Drop-off histogram** (`dropOffHistogram`) as a simple bar row; highlight the three tallest bars in red with the question prompt beside each. This is the "which question loses people" view.
- **Hardest / most-skipped items** — group `assessment_events` by `item_id` where `type='answer'`: percent correct (IQ) and median `ms_on_item`. Flag any IQ item under 20% or over 95% correct as mis-calibrated.

**Step 2: Verify** at `http://localhost:3000/admin/assessments` — numbers must reconcile with the raw SQL from Task 4 Step 5. Check 375px width.

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: admin assessment funnel dashboard"
```

---

## Task 6: Answer-key bias audit script

**Files:**
- Create: `scripts/audit-answer-key.ts`
- Test: `src/lib/assessments/bias.test.ts`
- Create: `src/lib/assessments/bias.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { positionBias, longestChoiceBias, chiSquareUniform } from "./bias";

const q = (choices: string[], correct_index: number) => ({ choices, correct_index });

describe("positionBias", () => {
  it("reports the share of keys at each index", () => {
    const r = positionBias([q(["a","b","c","d"], 1), q(["a","b","c","d"], 1), q(["a","b","c","d"], 0)]);
    expect(r.counts).toEqual([1, 2, 0, 0]);
    expect(r.maxShare).toBeCloseTo(0.667, 2);
  });
});

describe("longestChoiceBias", () => {
  it("counts how often the key is the longest string", () => {
    const r = longestChoiceBias([
      q(["short", "a much longer correct answer"], 1),
      q(["short", "tiny"], 0),
    ]);
    expect(r.hits).toBe(1);
    expect(r.share).toBe(0.5);
  });
});

describe("chiSquareUniform", () => {
  it("is ~0 for a uniform distribution", () => {
    expect(chiSquareUniform([10, 10, 10, 10])).toBeCloseTo(0, 5);
  });
  it("is large for a degenerate one", () => {
    expect(chiSquareUniform([40, 0, 0, 0])).toBeGreaterThan(50);
  });
});
```

**Step 2: Run → FAIL.**

**Step 3: Implement `src/lib/assessments/bias.ts`** with those three pure functions. `positionBias` returns `{ counts, maxShare }`; `longestChoiceBias` returns `{ hits, share, flagged: number[] }` where `flagged` holds the ordinals where the key is strictly longest **and** at least 1.5× the mean length of the distractors; `chiSquareUniform` is `Σ (o−e)²/e`.

**Step 4: Run → PASS (4 tests).**

**Step 5: Write `scripts/audit-answer-key.ts`** — reads both JSON banks, prints a per-quiz report (position counts, chi-square, longest-choice share, flagged ordinals) and **exits 1** if `maxShare > 0.4` or `longestChoiceBias.share > 0.4`. This makes bias a build-time gate, not a memory.

**Step 6: Run it against today's banks**

Run: `npx tsx scripts/audit-answer-key.ts`
Expected: **exit 1**, reporting general `index 1 = 80%`, longest = 75%; coach `index 1 = 87.5%`, longest = 96.9%. That failing output is the baseline this task documents.

**Step 7: Commit**

```bash
git add scripts/audit-answer-key.ts src/lib/assessments/bias.ts src/lib/assessments/bias.test.ts && git commit -m "feat: answer-key bias audit (fails on current banks by design)"
```

---

## Task 7: De-bias and shuffle the IQ banks

Two independent fixes: position bias dies at runtime (shuffle), longest-choice bias needs content work (distractor padding).

**Files:**
- Create: `scripts/rebalance-answer-key.ts`
- Modify: `scripts/data/iq-questions.json`, `scripts/data/iq-questions-coach.json`
- Modify: `src/lib/iq/load.ts`, `src/app/api/iq/submit/route.ts`, `src/app/iq/[category]/page.tsx`, `src/components/iq/IQQuizRunner.tsx`

**Step 1: Runtime shuffle — the real fix.**
- `loadActiveQuiz` gains an optional `nonce`. When present, `stripQuestion` applies `permutationFor(nonce, q.id, q.choices.length)` to the choices before returning them.
- `/iq/[category]/page.tsx` starts the session server-side (so the nonce exists before first paint), passes `sessionId` to the runner, and renders shuffled choices.
- `/api/iq/submit` loads the session, re-derives each permutation, and maps every submitted displayed index back through `invertChoice` **before** `scoreAttempt`. If `invertChoice` returns `-1`, treat that answer as unanswered.
- The per-question `results` payload must report `correct_index` in **displayed** space, or the results screen will point at the wrong choice. Map it forward: `displayedCorrect = perm.indexOf(q.correct_index)`.

> This is the subtle part of the task. Write it carefully and prove it in Step 3 — a wrong direction on the mapping silently scores everyone wrong.

**Step 2: Content de-bias.** Run `npx tsx scripts/rebalance-answer-key.ts` — deterministically permutes each stored question's `choices` array and rewrites `correct_index` to match, so the *stored* distribution is uniform too (defence in depth if shuffling is ever disabled). Then hand-edit the flagged questions from Task 6 so distractors are length-comparable to the key. Coach IQ needs this most: 31/32.

**Step 3: Verify the round-trip with a real attempt**

Take `/iq/general` locally answering deliberately — for 5 questions pick the choice you *know* is right by content, note the displayed position, submit, and confirm the score matches and the results screen underlines the same choice you clicked. Then:
```bash
npx tsx scripts/audit-answer-key.ts
```
Expected: **exit 0**, both quizzes under the 40% thresholds.

**Step 4: Re-seed**

```bash
npx tsx --env-file=.env.local scripts/seed-iq.ts && npx tsx --env-file=.env.local scripts/seed-iq-coach.ts
```

> Re-seeding deletes and reinserts `iq_questions`, which mints **new question ids**. Historical `iq_attempts.answers` keyed by the old ids become unreadable per-question (aggregate scores are unaffected). With 10 attempts on a pre-launch site that is an acceptable trade — but do it once, here, not repeatedly.

**Step 5: Commit**

```bash
git add -A && git commit -m "fix: de-bias IQ answer keys + per-attempt option shuffling"
```

---

## Task 8: Fix `maxPerDimensionFrom` for mixed-dimension items

Must land **before** any mixed-dimension item exists, or normalization breaks silently.

**Files:**
- Modify: `src/lib/eval/score.ts:47-57`
- Modify: `src/lib/eval/eval.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { maxPerDimensionFrom } from "./score";

describe("maxPerDimensionFrom with mixed-dimension items", () => {
  it("credits the max attainable points for EVERY dimension present", () => {
    const items = [
      { options: [ { dimension: "football_iq", points: 4 }, { dimension: "athleticism", points: 4 } ] },
      { options: [ { dimension: "football_iq", points: 4 }, { dimension: "clutch", points: 4 } ] },
    ];
    expect(maxPerDimensionFrom(items)).toEqual({ football_iq: 8, athleticism: 4, clutch: 4 });
  });

  it("takes the best option per dimension within one item", () => {
    const items = [{ options: [ { dimension: "defense", points: 1 }, { dimension: "defense", points: 3 } ] }];
    expect(maxPerDimensionFrom(items)).toEqual({ defense: 3 });
  });

  it("still matches the old behaviour for single-dimension Likert items", () => {
    const items = [
      { options: [0,1,2,3,4].map((p) => ({ dimension: "clutch", points: p })) },
      { options: [0,1,2,3,4].map((p) => ({ dimension: "clutch", points: p })) },
    ];
    expect(maxPerDimensionFrom(items)).toEqual({ clutch: 8 });
  });
});
```

**Step 2: Run → FAIL** (first case yields `{football_iq: 8}` only; the current code credits one dimension per item).

**Step 3: Rewrite**

```ts
/**
 * Highest attainable raw score per dimension across the whole bank.
 * For each item, a dimension can earn at most the best points any single option
 * awards it (you pick one option), so we sum that per-item best across items.
 * Correct for single-dimension Likert AND mixed-dimension forced-choice items.
 */
export function maxPerDimensionFrom(items: ScoringItem[]): Record<string, number> {
  const max: Record<string, number> = {};
  for (const item of items) {
    const bestInItem: Record<string, number> = {};
    for (const o of item.options) {
      if (!o?.dimension) continue;
      bestInItem[o.dimension] = Math.max(bestInItem[o.dimension] ?? 0, o.points);
    }
    for (const [dim, pts] of Object.entries(bestInItem)) {
      if (pts > 0) max[dim] = (max[dim] ?? 0) + pts;
    }
  }
  return max;
}
```

**Step 4: Run the whole eval suite**

Run: `npx vitest run src/lib/eval`
Expected: all pass, including the pre-existing tests — the single-dimension case is unchanged.

**Step 5: Commit**

```bash
git add src/lib/eval/score.ts src/lib/eval/eval.test.ts && git commit -m "fix: max-per-dimension handles mixed-dimension items"
```

---

## Task 9: Archetype by shape, not magnitude

**Files:**
- Modify: `src/lib/eval/archetype.ts`, `src/lib/eval/vector.ts`
- Test: `src/lib/eval/archetype.test.ts` (new)

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { classifyArchetype } from "./archetype";
import { DIMENSION_KEYS, Fingerprint } from "./dimensions";

const fp = (partial: Partial<Record<string, number>>): Fingerprint =>
  Object.fromEntries(DIMENSION_KEYS.map((k) => [k, partial[k] ?? 5])) as Fingerprint;

describe("classifyArchetype", () => {
  it("labels a flat max-everything vector Balanced Evaluator, not a random archetype", () => {
    // This is a REAL production fingerprint (eval_responses row 1), which the
    // old Euclidean classifier mislabeled 'Athlete-First Scout'.
    const flat = fp({ clutch: 10, defense: 10, production: 9, athleticism: 10, ball_skills: 9.75,
                      competition: 9, consistency: 9, football_iq: 10, intangibles: 10, versatility: 10 });
    expect(classifyArchetype(flat).name).toBe("Balanced Evaluator");
  });

  it("matches on shape, independent of overall magnitude", () => {
    const low  = fp({ football_iq: 5, defense: 4.5, versatility: 4, athleticism: 1.5, production: 1 });
    const high = fp({ football_iq: 10, defense: 9, versatility: 8, athleticism: 3, production: 2 });
    expect(classifyArchetype(low).name).toBe("Film-Room Evaluator");
    expect(classifyArchetype(high).name).toBe(classifyArchetype(low).name);
  });

  it("still separates genuinely different emphases", () => {
    const numbers = fp({ production: 10, athleticism: 8, competition: 7, football_iq: 2, intangibles: 2 });
    expect(classifyArchetype(numbers).name).toBe("Numbers Purist");
  });
});
```

**Step 2: Run → FAIL** (test 1 returns "Athlete-First Scout" — the exact production bug).

**Step 3: Implement**

Add to `vector.ts`:
```ts
/** Mean-center a vector — strips overall magnitude, keeps relative emphasis. */
export function center(a: number[]): number[] {
  const mean = a.reduce((x, y) => x + y, 0) / (a.length || 1);
  return a.map((v) => v - mean);
}

/** Cosine similarity in [-1,1]. Returns 0 if either vector is degenerate. */
export function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += (a[i] ?? 0) * (b[i] ?? 0);
    na += (a[i] ?? 0) ** 2;
    nb += (b[i] ?? 0) ** 2;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** Spread of a vector — how much emphasis it actually expresses. */
export function stdev(a: number[]): number {
  const mean = a.reduce((x, y) => x + y, 0) / (a.length || 1);
  return Math.sqrt(a.reduce((s, v) => s + (v - mean) ** 2, 0) / (a.length || 1));
}
```

In `archetype.ts`, append a `Balanced Evaluator` archetype (centroid: 5 across the board, blurb: *"You don't over-index on any one trait — you weigh the whole player. Rare, and hard to fool."*) and rewrite the classifier:

```ts
const FLAT_STDEV_THRESHOLD = 1.0;

export function classifyArchetype(fingerprint: Fingerprint): Archetype {
  const v = DIMENSION_KEYS.map((k) => fingerprint[k] ?? 0);
  // A near-flat vector expresses no preference — say so, don't invent one.
  if (stdev(v) < FLAT_STDEV_THRESHOLD) {
    return ARCHETYPES.find((a) => a.name === "Balanced Evaluator")!;
  }
  const cv = center(v);
  let best = ARCHETYPES[0];
  let bestSim = -Infinity;
  for (const a of ARCHETYPES) {
    if (a.name === "Balanced Evaluator") continue;
    const sim = cosine(cv, center(DIMENSION_KEYS.map((k) => a.centroid[k])));
    if (sim > bestSim) { bestSim = sim; best = a; }
  }
  return best;
}
```

**Step 4: Run → PASS.** Then `npx vitest run src/lib/eval` — the whole suite.

**Step 5: Backfill the label on existing rows.** The 5 stored `eval_responses.archetype` strings were computed with the old classifier. Write `scripts/reclassify-archetypes.ts` to recompute from each stored `fingerprint` and update the row. Run it once and print the before/after table.

**Step 6: Commit**

```bash
git add -A && git commit -m "fix: classify archetypes by shape (cosine) + add Balanced Evaluator"
```

---

## Task 10: `item_type` migration + typed schema

**Files:**
- Create: `supabase/migrations/021_eval_item_types.sql`
- Create: `src/lib/eval/item-types.ts`

**Step 1: Migration**

```sql
-- Typed evaluation items. `style` (importance|tradeoff) is superseded but kept
-- so existing rows and the v1 seed remain valid.
ALTER TABLE eval_items
  ADD COLUMN IF NOT EXISTS item_type TEXT NOT NULL DEFAULT 'likert'
    CHECK (item_type IN ('likert','forced_choice','budget','rank','scenario')),
  ADD COLUMN IF NOT EXISTS context TEXT,        -- scenario vignette / setup text
  ADD COLUMN IF NOT EXISTS round INTEGER;       -- chunk number for checkpoints (Task 17)

-- Every existing v1 item is a Likert importance item; the default covers them.
CREATE INDEX IF NOT EXISTS idx_eval_items_round ON eval_items(questionnaire_id, round, ordinal);
```

Apply via MCP `apply_migration`, name `021_eval_item_types`.

**Step 2: Define the TypeScript union** in `src/lib/eval/item-types.ts`:

```ts
import { DimensionKey } from "./dimensions";

export const ITEM_TYPES = ["likert", "forced_choice", "budget", "rank", "scenario"] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

export type ScoredOption = { label: string; dimension: DimensionKey; points: number };

/**
 * What the client sends back per item, by type:
 *   likert        -> number                    (chosen option index)
 *   forced_choice -> number                    (chosen option index)
 *   scenario      -> number                    (chosen option index)
 *   rank          -> number[]                  (option indices, best first)
 *   budget        -> Record<string, number>    (option index -> points, sums to 100)
 */
export type ItemAnswer = number | number[] | Record<string, number>;

export function isRankAnswer(a: ItemAnswer): a is number[] { return Array.isArray(a); }
export function isBudgetAnswer(a: ItemAnswer): a is Record<string, number> {
  return typeof a === "object" && a !== null && !Array.isArray(a);
}
export function isChoiceAnswer(a: ItemAnswer): a is number {
  return typeof a === "number" && Number.isInteger(a) && a >= 0;
}
```

**Step 3: Verify + commit**

```sql
select column_name from information_schema.columns where table_name='eval_items' and column_name in ('item_type','context','round');
```
Expected: 3 rows.
```bash
git add -A && git commit -m "feat: typed evaluation items (item_type/context/round)"
```

---

## Task 11: Scoring — `forced_choice`

The single most important type. Options map to **different** dimensions with **equal** points, so picking one necessarily declines the others. This is what kills the ceiling effect.

**Files:**
- Create: `src/lib/eval/score-types.ts`
- Test: `src/lib/eval/score-types.test.ts`

**Step 1: Failing test**

```ts
import { describe, it, expect } from "vitest";
import { scoreForcedChoice } from "./score-types";

const item = {
  item_type: "forced_choice" as const,
  options: [
    { label: "The one who always makes the right read", dimension: "football_iq", points: 4 },
    { label: "The one who runs away from everybody",     dimension: "athleticism", points: 4 },
    { label: "The one who never drops it",               dimension: "ball_skills", points: 4 },
  ],
};

describe("scoreForcedChoice", () => {
  it("awards the chosen dimension and nothing to the rivals", () => {
    expect(scoreForcedChoice(item, 1)).toEqual({ athleticism: 4 });
  });
  it("ignores an out-of-range choice", () => {
    expect(scoreForcedChoice(item, 7)).toEqual({});
    expect(scoreForcedChoice(item, -1)).toEqual({});
  });
  it("ignores a non-choice answer shape", () => {
    expect(scoreForcedChoice(item, [0, 1] as never)).toEqual({});
  });
});
```

**Step 2: Run → FAIL. Step 3: Implement** `scoreForcedChoice(item, answer): Partial<Record<DimensionKey, number>>` — validate with `isChoiceAnswer`, bounds-check, return `{ [opt.dimension]: opt.points }`.

**Step 4: Run → PASS. Step 5: Commit**

```bash
git add src/lib/eval/score-types.ts src/lib/eval/score-types.test.ts && git commit -m "feat: forced-choice item scoring"
```

---

## Task 12: Scoring — `budget`

"You have 100 points. Spend them across these five traits." Purely ipsative — cannot be maxed.

**Step 1: Failing test** (append to `score-types.test.ts`)

```ts
import { scoreBudget } from "./score-types";

const budgetItem = {
  item_type: "budget" as const,
  options: [
    { label: "Football IQ",   dimension: "football_iq", points: 4 },
    { label: "Athleticism",   dimension: "athleticism", points: 4 },
    { label: "Ball skills",   dimension: "ball_skills", points: 4 },
    { label: "Intangibles",   dimension: "intangibles", points: 4 },
  ],
};

describe("scoreBudget", () => {
  it("scales each allocation to the item's max points", () => {
    // 50/25/25/0 of 100 -> half of 4, quarter of 4, quarter of 4, 0
    expect(scoreBudget(budgetItem, { "0": 50, "1": 25, "2": 25, "3": 0 }))
      .toEqual({ football_iq: 2, athleticism: 1, ball_skills: 1, intangibles: 0 });
  });
  it("normalizes when the allocation does not sum to 100", () => {
    expect(scoreBudget(budgetItem, { "0": 10, "1": 10 })).toEqual({ football_iq: 2, athleticism: 2 });
  });
  it("returns nothing for an all-zero or empty allocation", () => {
    expect(scoreBudget(budgetItem, { "0": 0, "1": 0 })).toEqual({});
    expect(scoreBudget(budgetItem, {})).toEqual({});
  });
  it("ignores negative and non-numeric allocations", () => {
    expect(scoreBudget(budgetItem, { "0": -50, "1": 100 })).toEqual({ athleticism: 4 });
  });
});
```

**Step 2: FAIL → Step 3: Implement.** Sum the valid non-negative allocations; if the total is 0 return `{}`; otherwise each dimension gets `round((alloc/total) * maxPoints, 3)` where `maxPoints` is the item's option `points`. Normalizing by the actual total (not by 100) makes the client's sum-to-100 constraint a UX nicety rather than a scoring dependency.

**Step 4: PASS. Step 5: Commit** `"feat: budget-allocation item scoring"`.

---

## Task 13: Scoring — `rank`

**Step 1: Failing test**

```ts
import { scoreRank } from "./score-types";

const rankItem = {
  item_type: "rank" as const,
  options: [
    { label: "Wins the rep every time",       dimension: "consistency", points: 4 },
    { label: "Wins the rep that decides it",  dimension: "clutch",      points: 4 },
    { label: "Wins reps at three positions",  dimension: "versatility", points: 4 },
  ],
};

describe("scoreRank", () => {
  it("awards descending points by placement", () => {
    // 3 options, max 4 -> 1st=4, 2nd=2, 3rd=0
    expect(scoreRank(rankItem, [1, 0, 2])).toEqual({ clutch: 4, consistency: 2, versatility: 0 });
  });
  it("ignores duplicate or out-of-range indices", () => {
    expect(scoreRank(rankItem, [1, 1, 9])).toEqual({ clutch: 4 });
  });
  it("scores a partial ordering", () => {
    expect(scoreRank(rankItem, [2])).toEqual({ versatility: 4 });
  });
  it("returns nothing for a non-array answer", () => {
    expect(scoreRank(rankItem, 0 as never)).toEqual({});
  });
});
```

**Step 2: FAIL → Step 3: Implement.** Points for placement `i` of `n` options with max `m`: `m * (n - 1 - i) / (n - 1)`, rounded to 3dp. Dedupe with a `Set`, bounds-check every index.

**Step 4: PASS. Step 5: Commit** `"feat: ranking item scoring"`.

---

## Task 14: `scenario` + unified dispatcher

`scenario` scores like `forced_choice` but options carry **unequal** points (some reads are simply better) and the item has `context` prose.

**Step 1: Failing test**

```ts
import { scoreItem } from "./score-types";

describe("scoreItem dispatcher", () => {
  const likert = { item_type: "likert" as const, options: [0,1,2,3,4].map((p) => ({ label: `${p}`, dimension: "clutch", points: p })) };

  it("routes likert to index-based points", () => {
    expect(scoreItem(likert, 4)).toEqual({ clutch: 4 });
  });
  it("routes forced_choice", () => {
    expect(scoreItem(
      { item_type: "forced_choice", options: [
        { label: "a", dimension: "defense", points: 4 },
        { label: "b", dimension: "clutch", points: 4 }] }, 0)).toEqual({ defense: 4 });
  });
  it("routes scenario with unequal points", () => {
    expect(scoreItem(
      { item_type: "scenario", options: [
        { label: "Bail to the sideline", dimension: "football_iq", points: 1 },
        { label: "Take the checkdown",   dimension: "football_iq", points: 4 }] }, 1)).toEqual({ football_iq: 4 });
  });
  it("returns {} for an unknown type rather than throwing", () => {
    expect(scoreItem({ item_type: "nope" as never, options: [] }, 0)).toEqual({});
  });
  it("returns {} for a missing answer", () => {
    expect(scoreItem(likert, undefined as never)).toEqual({});
  });
});
```

**Step 2: FAIL → Step 3: Implement `scoreItem`** as a `switch` over `item_type` delegating to the four scorers (likert and scenario share the index-based path).

**Step 4: Rewrite `scoreFingerprint`** in `src/lib/eval/score.ts` to call `scoreItem` per item and accumulate into the fingerprint, accepting `Record<string, ItemAnswer>`. The existing signature `Record<string, number>` is a subtype, so the 5 stored responses and every existing test keep passing.

**Step 5: Run the full suite**

Run: `npx vitest run`
Expected: every test passes, including the untouched `eval.test.ts`, `aggregate.test.ts`, `coachWeight.test.ts`.

**Step 6: Commit** `"feat: unified typed item scoring dispatcher"`.

---

## Task 15: Author the new 28-item evaluation bank

This is the content task that answers Ambra and Coach Jon directly.

**Files:**
- Create: `scripts/data/eval-items-v2.json`
- Modify: `scripts/seed-eval.ts` (read v2, seed as questionnaire **version 2**, `is_active=true`; leave v1 rows intact and `is_active=false`)
- Test: `src/lib/eval/bank.test.ts`

**Composition — 28 items across 5 formats, 5 rounds:**

| Round | Items | Types | Feel |
|---|---|---|---|
| 1 — "Snap judgments" | 6 | `forced_choice` | Two or three players described in one line. Pick one. Fast, opinionated, no scale. |
| 2 — "Spend your points" | 2 | `budget` | 100 points across 5 traits — one for offense, one for defense. |
| 3 — "You're on the sideline" | 6 | `scenario` | A real game situation with `context` prose; the four reads score unequally. |
| 4 — "Rank them" | 4 | `rank` | Drag 3–4 traits into order. |
| 5 — "Where do you actually stand" | 10 | `likert` | Kept, but every stem is rewritten and the anchors are **concrete behaviours**, not adverbs. |

**Authoring rules — these are the fix, follow them literally:**
1. **No two items may share a stem.** A test enforces it (Step 2).
2. **No `likert` item may use the old stem** `"When you evaluate a player, how much does it matter…"`. Write each as a distinct question in the owner's voice.
3. **Likert anchors must be behavioural.** Not `Nice to have / Matters / Big factor` but e.g. *"I'd still start them without it"* → *"I wouldn't put them on the field"*. Anchors must be reusable **at most twice** across the bank (test-enforced).
4. **Every forced_choice option maps to a different dimension, equal points (4).**
5. **Scenario options must be defensible reads**, not one obvious answer and three jokes — Coach Jon will check this. Vary which option index is strongest (the shuffle handles display, but the JSON should not be lazy either).
6. **Coverage:** each of the 10 dimensions must be a scorable option in **at least 5** items. Test-enforced.
7. **Keep the taxonomy fields** (`science_dimension`, `taxonomy_trait_id`, `taxonomy_tier`, `source_citation`) on every item — `seed-eval.ts` derives the `eval_reference` elite-ideal vector from `taxonomy_tier`, and `PerspectiveSummary`'s "gap vs elite ideal" line breaks without it.
8. **Set `round` 1–5** on every item to drive Task 17's checkpoints.

**Step 1: Write the bank guard test first**

```ts
import { describe, it, expect } from "vitest";
import bank from "../../../scripts/data/eval-items-v2.json";
import { DIMENSION_KEYS } from "./dimensions";

const items = bank.items as Array<{
  ordinal: number; prompt: string; item_type: string; round: number;
  options: { label: string; dimension: string; points: number }[];
  taxonomy_tier: number; science_dimension: string | null;
}>;

describe("eval bank v2", () => {
  it("has 28 items with unique, contiguous ordinals", () => {
    expect(items).toHaveLength(28);
    expect([...new Set(items.map((i) => i.ordinal))]).toHaveLength(28);
  });

  it("uses all five item types with the planned mix", () => {
    const byType = items.reduce<Record<string, number>>((a, i) => ({ ...a, [i.item_type]: (a[i.item_type] ?? 0) + 1 }), {});
    expect(byType).toEqual({ forced_choice: 6, budget: 2, scenario: 6, rank: 4, likert: 10 });
  });

  it("never repeats a question stem — the core complaint", () => {
    expect(new Set(items.map((i) => i.prompt.trim().toLowerCase())).size).toBe(28);
  });

  it("has retired the old boilerplate stem entirely", () => {
    expect(items.filter((i) => /how much does it matter/i.test(i.prompt))).toHaveLength(0);
  });

  it("reuses no answer-anchor set more than twice", () => {
    const counts = new Map<string, number>();
    for (const i of items) {
      const k = i.options.map((o) => o.label).join("|");
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    expect([...counts.values()].every((n) => n <= 2)).toBe(true);
  });

  it("makes forced_choice a genuine tradeoff: distinct dimensions, equal points", () => {
    for (const i of items.filter((x) => x.item_type === "forced_choice")) {
      const dims = i.options.map((o) => o.dimension);
      expect(new Set(dims).size).toBe(dims.length);
      expect(new Set(i.options.map((o) => o.points)).size).toBe(1);
    }
  });

  it("scores every dimension in at least 5 items", () => {
    for (const d of DIMENSION_KEYS) {
      const n = items.filter((i) => i.options.some((o) => o.dimension === d && o.points > 0)).length;
      expect(n, `${d} appears in only ${n} items`).toBeGreaterThanOrEqual(5);
    }
  });

  it("keeps the taxonomy fields the reference vector depends on", () => {
    for (const i of items) expect(i.taxonomy_tier).toBeGreaterThanOrEqual(1);
  });

  it("assigns every item to a round 1-5", () => {
    expect(items.every((i) => i.round >= 1 && i.round <= 5)).toBe(true);
  });
});
```

**Step 2: Run → FAIL** (no `eval-items-v2.json`).

**Step 3: Author the bank** until every assertion passes. Sample items to set the tone:

```json
{
  "ordinal": 1, "round": 1, "item_type": "forced_choice", "section_key": "football_iq",
  "prompt": "Two players, same stat line. Who do you take?",
  "options": [
    { "label": "The one who's never in the wrong spot", "dimension": "football_iq", "points": 4 },
    { "label": "The one nobody can stay in front of",   "dimension": "athleticism", "points": 4 },
    { "label": "The one who catches everything thrown near them", "dimension": "ball_skills", "points": 4 }
  ],
  "style": "tradeoff", "science_dimension": "S1", "taxonomy_trait_id": 3, "taxonomy_tier": 1,
  "source_citation": "Biopsychosocial Architecture of Elite Athletic Performance — Tier 1 cognitive traits"
},
{
  "ordinal": 9, "round": 3, "item_type": "scenario", "section_key": "clutch",
  "context": "Down 4, 18 seconds left, no timeouts, ball on your own 35. Your QB takes the snap and the rush is home in two seconds.",
  "prompt": "What do you most want to see from them?",
  "options": [
    { "label": "Throw it away, live for one more play", "dimension": "football_iq", "points": 4 },
    { "label": "Scramble and try to make something",    "dimension": "athleticism", "points": 2 },
    { "label": "Force it deep — you need the yards",    "dimension": "clutch",      "points": 1 },
    { "label": "Dump it to the checkdown and hustle up","dimension": "consistency", "points": 3 }
  ],
  "style": "tradeoff", "science_dimension": "S3", "taxonomy_trait_id": 41, "taxonomy_tier": 2,
  "source_citation": "Psychological characteristics & coping under pressure"
},
{
  "ordinal": 7, "round": 2, "item_type": "budget", "section_key": "production",
  "prompt": "You're building one offensive player from scratch. Spend 100 points.",
  "options": [
    { "label": "Football IQ",  "dimension": "football_iq", "points": 4 },
    { "label": "Explosiveness","dimension": "athleticism", "points": 4 },
    { "label": "Hands",        "dimension": "ball_skills", "points": 4 },
    { "label": "Versatility",  "dimension": "versatility", "points": 4 },
    { "label": "Production",   "dimension": "production",  "points": 4 }
  ],
  "style": "tradeoff", "science_dimension": null, "taxonomy_trait_id": 12, "taxonomy_tier": 2,
  "source_citation": "Composite — offensive trait allocation"
}
```

**Step 4: Run → PASS (9 tests).**

**Step 5: Owner review gate.** Export the bank to a readable markdown table (`docs/eval-bank-v2-review.md`) for Ambra and Coach Jon. **Do not seed production until they sign off** — this is precisely the content they flagged. Local/preview seeding is fine.

**Step 6: Seed v2**

```bash
npx tsx --env-file=.env.local scripts/seed-eval.ts
```
Then verify v1 is deactivated and v2 is live:
```sql
select version, title, is_active, (select count(*) from eval_items where questionnaire_id = q.id) items
from eval_questionnaires q order by version;
```
Expected: v1 `is_active=false` / 50 items, v2 `is_active=true` / 28 items.

**Step 7: Commit** `"feat: 28-item multi-format evaluation bank (v2)"`.

---

## Task 16: Runner UI — one component per item type

**Files:**
- Create: `src/components/eval/items/ForcedChoiceItem.tsx`, `BudgetItem.tsx`, `RankItem.tsx`, `ScenarioItem.tsx`, `LikertItem.tsx`, `index.tsx` (dispatcher)
- Modify: `src/components/eval/EvaluationRunner.tsx`
- Modify: `src/lib/eval/load.ts` (carry `item_type`, `context`, `round` through `RawItem`/`PublicItem`/`stripAnswers`)

**Step 1: Extend the item types through the loader.** `stripAnswers` must pass `item_type`, `context` and `round` while still stripping `dimension`/`points`. The answer key never reaches the client — that invariant is non-negotiable.

**Step 2: Build each component.** Shared contract: `{ item, value, onChange, onCommit }`. Only the choice types auto-advance; `budget` and `rank` need an explicit Continue because there is no single tap that means "done".

- **`ForcedChoiceItem`** — big tappable cards, no numeric scale, no "how much" language. Auto-advance on tap (140ms, matching today's feel).
- **`ScenarioItem`** — renders `context` in a distinct panel above the prompt (yellow left border, `text-white/70`), then choice cards. Auto-advance.
- **`BudgetItem`** — a slider row per option plus a live "**X of 100 left**" counter that turns yellow at 0. Continue is disabled until the remaining budget is 0. Include a "Split evenly" reset button. **Must work at 375px** — sliders and labels stack.
- **`RankItem`** — avoid HTML5 drag-and-drop; it is unreliable on touch, and mobile is the majority here. Use up/down arrow buttons per row with `aria-label`s ("Move Clutch up"), plus tap-to-select-then-tap-to-place. Keyboard: `↑`/`↓` reorder the focused row.
- **`LikertItem`** — today's rendering, unchanged.

**Step 3: Dispatch in `EvaluationRunner`.** Replace the inline `item.options.map(...)` block (currently `EvaluationRunner.tsx:196-213`) with `<AssessmentItem item={item} value={answers[item.id]} onChange={…} onCommit={…} />`. Keep number-key shortcuts for choice types only; suppress them for `budget`/`rank` where digits would fight the inputs.

**Step 4: Update the answers state type** from `Record<string, number>` to `Record<string, ItemAnswer>`, including the `EvalDraft` type so save-and-resume keeps working with the new shapes.

**Step 5: Verify in the browser.** Take the full 28-item run locally. Confirm: every type renders and records; Back preserves a budget allocation and a ranking; refresh mid-run offers Resume and restores both; the run submits and returns a fingerprint that is **not** flat.

```sql
select archetype, fingerprint from eval_responses order by taken_at desc limit 1;
```
Expected: a visible spread — `stdev` across the 10 dimensions above 1.0, and an archetype that is not "Balanced Evaluator" unless you genuinely answered evenly. If it comes back flat at 9–10 across the board, the forced-choice items are not being scored: check `scoreItem` dispatch and `maxPerDimensionFrom`.

**Step 6: Commit** `"feat: per-item-type evaluation runner UI"`.

---

## Task 17: Rounds and checkpoints

Retention lever: 28 questions in one undifferentiated stack reads as a chore. Five named rounds with a 3-second breather between them reads as a game.

**Files:**
- Create: `src/components/eval/CheckpointScreen.tsx`
- Modify: `src/components/eval/EvaluationRunner.tsx`
- Modify: `src/components/iq/IQQuizRunner.tsx` (rounds of 10 for the 40-item Core IQ; 8 for Coach IQ)

**Step 1: Build `CheckpointScreen`** — round name, "Round 2 of 5 done", a progress ribbon, one line of earned feedback (`"You've leaned hard on Football IQ so far"` — computed client-side from answers so far, no server call), an honest time-remaining estimate from the median ms-on-item, and a single Continue. Auto-advance after 4s unless `prefers-reduced-motion`, in which case require the tap.

**Step 2: Fire a `checkpoint` telemetry event** at each boundary via `track("checkpoint", { itemIndex })`. This turns the drop-off histogram into a per-round funnel — the number Ambra will actually care about.

**Step 3: Replace the header.** `Section 3/10` (`EvaluationRunner.tsx:181`) becomes `Round 2 of 5 · Snap Judgments`, and the progress bar fills within the round with a subtle full-run bar beneath.

**Step 4: Verify** — take the run, confirm 4 checkpoints, confirm the reduced-motion path requires a tap, confirm 4 `checkpoint` rows land in `assessment_events`.

**Step 5: Commit** `"feat: rounds + checkpoint screens"`.

---

## Task 18: IQ instant feedback + streaks

Today all 40 explanations dump at the end — the highest-value retention content arrives after the decision to leave has been made.

**Files:**
- Modify: `src/components/iq/IQQuizRunner.tsx`, `src/app/api/iq/submit/route.ts`
- Create: `src/app/api/iq/check/route.ts`

**Step 1: `POST /api/iq/check`** — `{ sessionId, questionId, choice }` → auth, `getOwnedSession` (404 if not theirs), re-derive the permutation, invert the choice, compare to the key, record an `answer` event with `correct`, return `{ correct, correctIndexDisplayed, explanation }`.

> **Guard against key-farming:** reject a `check` for a `questionId` that already has an `answer` event in this session. Without that, a client can walk every option and read the key back one call at a time.

**Step 2: Instant-feedback UI.** After a tap: the chosen card turns green or red, the correct one outlines green if they missed, the explanation slides in, and Continue appears. Add a **mode toggle on the quiz intro** — "Instant feedback (learn as you go)" vs "Test mode (results at the end)" — defaulting to instant. Test mode is what a coach establishing credibility will want; instant is what a casual visitor will finish.

**Step 3: Streak counter.** A small flame + run-count in the sticky header, resetting on a miss, with a `+N` pop on a new best. Respect `prefers-reduced-motion`.

**Step 4: Keep the end-of-quiz review** — it is still the study artifact. In instant mode, collapse already-seen explanations by default.

**Step 5: Verify** — take `/iq/general` in both modes; confirm the check route 404s for a foreign `sessionId`, and confirm the second `check` for the same question is rejected.

**Step 6: Commit** `"feat: IQ instant feedback mode + streaks"`.

---

## Task 19: Results depth

**Files:**
- Modify: `src/components/eval/PerspectiveSummary.tsx`, `src/components/iq/IQQuizRunner.tsx` (results branch)
- Create: `src/lib/assessments/percentile.ts` + `percentile.test.ts`

**Step 1: Failing test for `percentileOf`** — value against a sorted sample, returns 0–100; empty sample returns `null` (never a fake "50th percentile" on no data).

**Step 2: Implement**, then compute at submit time from `iq_attempts.score_pct` / `eval_responses.fingerprint`.

**Step 3: Enrich the IQ results screen:** score, grade, **percentile among all takers** (only once `n ≥ 20`, otherwise show "You're one of the first 12 to take this"), per-domain breakdown (rules / scheme / situational — the `domain` field already lives in `iq-questions-coach.json` and just needs the analytics column), the two weakest domains with links to relevant blog posts and `/how-rankings-work`, and a "Retake — beat 84" CTA showing the delta on a repeat run.

**Step 4: Enrich `PerspectiveSummary`:** keep the radar and archetype, add **"Where you disagree with the crowd"** — the two dimensions where the user deviates most from the aggregate for their role (read `ranking_weights` `dim.<role>.*`). That is the genuinely interesting, shareable output, and it only becomes possible once fingerprints stop being flat.

**Step 5: Verify** at 375px and with a fresh account (percentile suppression path).

**Step 6: Commit** `"feat: percentile, domain breakdown and crowd-comparison results"`.

---

## Task 20: Admin authoring and review surface

Unblocks the owner action open since 2026-06-25 — Ambra and Coach Jon confirming the Coach IQ answer key — and lets them fix a bad question without a deploy.

**Files:**
- Create: `src/app/admin/assessments/questions/page.tsx`, `[id]/page.tsx`, `actions.ts`
- Create: `supabase/migrations/022_question_review.sql`

**Step 1: Migration** — add `reviewed_by UUID`, `reviewed_at TIMESTAMPTZ`, `review_note TEXT` to both `iq_questions` and `eval_items`; add `status TEXT DEFAULT 'draft' CHECK (status IN ('draft','approved','retired'))` to `iq_questions`.

**Step 2: Build the list** — every question in a bank with its stats from `assessment_events` (percent correct, median seconds, times served), an unmistakable **"Needs review"** chip on `status='draft'` rows, and filters for draft / mis-calibrated / never-served. Coach IQ's 32 drafts are the top of this list on day one.

**Step 3: Build the editor** — edit prompt, choices, correct answer, explanation; **Approve** (sets `status='approved'`, stamps `reviewed_by`/`reviewed_at`) and **Retire**. On save, re-run the bias check from Task 6 against the whole bank and warn inline if the edit pushes position or longest-choice share back over 40%.

**Step 4: Gate it.** `getAdminUser` on the page **and** an `isAdminEmail` re-check inside every server action — per the RLS rules, middleware protects nothing here. Use `createAdminClient` for all writes.

**Step 5: Verify** — sign in as an admin, approve one Coach IQ question, confirm the stamp lands in the DB; sign in as a non-admin and confirm both the page and a direct server-action call are refused.

**Step 6: Commit** `"feat: admin question authoring + answer-key review"`.

---

## Task 21: Abandoned-assessment nudge email

**Files:**
- Create: `src/lib/emails/assessment-nudge.ts` + test
- Create: `src/app/api/cron/assessment-nudge/route.ts`
- Modify: `vercel.json` (daily cron)

**Step 1: Failing test** for `assessmentNudgeEmail({ firstName, kind, answered, total, resumeUrl })` — pure, returns `{ subject, html }`. Assert the subject names the remaining count, the html contains the resume URL, and the tone matches `src/lib/emails/lifecycle.ts` (encouraging, never scolding — same rule as the denial emails).

**Step 2: Implement**, then the cron route: `CRON_SECRET` bearer check (`CRON_SECRET` is already set in Vercel), select sessions where `isAbandoned` and `nudged_at IS NULL` and `started_at > now() - interval '7 days'`, send via `sendEmail`, stamp `nudged_at`.

**Step 3: One nudge per session, ever.** The `nudged_at` stamp is the guard. Never nudge a session with `answered_count < 3` — that is a bounce, not an abandonment, and emailing it reads as spam.

**Step 4: Verify** by pointing the cron at a seeded fake session with a back-dated `last_seen_at` and confirming exactly one send, then a second invocation sending zero.

**Step 5: Commit** `"feat: abandoned-assessment nudge email"`.

---

## Task 22: Full verification + owner note

**Step 1: Green across the board**

```bash
npx tsc --noEmit && npx vitest run && npm run build && npx tsx scripts/audit-answer-key.ts
```
Expected: tsc clean, all tests pass, build green, audit **exit 0**.

**Step 2: Manual click-through** (local preview, desktop **and** 375px):
- `/evaluate` — all 28 items, all 5 types, 4 checkpoints, resume after a mid-run refresh, non-flat fingerprint, sensible archetype.
- `/iq/general` — instant mode, streak, percentile suppression on a fresh account.
- `/iq/coach` — shuffled choices, test mode, coach explainer intact.
- `/admin/assessments` — funnel numbers reconcile with raw SQL.
- `/admin/assessments/questions` — approve a question, confirm the stamp.

**Step 3: Confirm the safety invariants**
```sql
-- Answer key must never be reachable without the service role, and the nonce never leaves the server.
select tablename, count(*) policies from pg_policies
where tablename in ('eval_items','iq_questions','assessment_sessions','assessment_events') group by 1;
```
Expected: **zero rows.**

Then grep the client bundle for leakage:
```bash
grep -rn "correct_index\|nonce" src/components/ src/hooks/ || echo "clean"
```
Expected: `correct_index` appears **only** in `IQQuizRunner`'s results branch (post-submit, legitimately revealed); `nonce` appears nowhere.

**Step 4: Baseline the metrics** so the next session can prove the 10x:
```sql
select kind, subject_key, count(*) starts, count(completed_at) completions,
       round(100.0*count(completed_at)/count(*),1) completion_pct
from assessment_sessions group by 1,2;
```
Record the result in `CLAUDE.md` as the pre-launch baseline.

**Step 5: Write `docs/ambra-update-2026-08-01-assessments.md`** covering, in her language:
- What she and Coach Jon flagged, and the proof they were right (all 50 questions were literally the same question; option 0 was never once chosen; 87% of the Coach IQ key was answer B and 97% was "the longest one").
- What the evaluation feels like now: 28 questions, five different ways to answer, ~2.5 minutes instead of ~4.
- **The two things needing her:** sign off on the v2 bank in `docs/eval-bank-v2-review.md`, and confirm the 32 Coach IQ answers at `/admin/assessments/questions` — until then Coach IQ shouldn't formally drive voting weight.
- Where to watch completion rate herself: `/admin/assessments`.

**Step 6: Merge**

Use `superpowers:finishing-a-development-branch`. Do **not** run the rankings recompute.

**Step 7: Update `CLAUDE.md`** — new Active Roadmap entry with the shipped commit, the baseline numbers, and the two open owner actions.

---

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Shuffle inverted the wrong way → everyone silently scored wrong | Task 7 Step 3 is a deliberate manual round-trip check before re-seeding; `invertChoice` is unit-tested both directions. |
| Re-seeding IQ mints new question ids, orphaning 10 historical attempts' per-question data | Accepted and called out in Task 7. Aggregate scores survive. Do it once. |
| New fingerprints aren't comparable to the 5 old ones | They aren't, and shouldn't be — the old ones are ceiling-effect artifacts. v1 stays in the DB, deactivated, for reference. Aggregate `ranking_weights` will shift as v2 responses come in; that is the intended correction. |
| Budget/rank items are fiddly on a phone | No drag-and-drop; arrow buttons and sliders, explicitly verified at 375px in Tasks 16 and 22. |
| Owner doesn't approve the v2 bank | Task 15 Step 5 gates production seeding on their sign-off. Everything up to it ships regardless. |
| Telemetry writes slow the quiz | All `track()` calls are fire-and-forget with `keepalive` and swallowed errors; nothing awaits them. |
| Instant-feedback `check` route leaks the answer key | One check per question per session, enforced server-side (Task 18 Step 1). |
