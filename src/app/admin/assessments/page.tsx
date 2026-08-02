import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/eval/admin-client";
import { getAdminUser } from "@/lib/admin";
import { completionRate, dropOffHistogram } from "@/lib/assessments/session";

export const dynamic = "force-dynamic";

// ---------- pure local helpers (all guarded against empty input) ----------

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function fmtDuration(sec: number | null): string {
  if (sec === null || !Number.isFinite(sec) || sec < 0) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Most common total_items in the cohort; falls back to the max seen. */
function representativeTotal(rows: { total_items: number }[]): number {
  const counts = new Map<number, number>();
  let modal = 0;
  let modalN = 0;
  let max = 0;
  for (const r of rows) {
    const t = r.total_items;
    if (!t || t < 1) continue;
    if (t > max) max = t;
    const c = (counts.get(t) ?? 0) + 1;
    counts.set(t, c);
    if (c > modalN) {
      modalN = c;
      modal = t;
    }
  }
  return modal || max;
}

function assessmentLabel(kind: string, subjectKey: string): string {
  const k = `${kind}/${subjectKey}`;
  if (k === "eval/active") return "Evaluation Philosophy";
  if (k === "iq/general") return "Core Flag IQ";
  if (k === "iq/coach") return "Coach IQ";
  if (kind === "eval") return "Evaluation Philosophy";
  if (kind === "iq") return `${subjectKey.charAt(0).toUpperCase()}${subjectKey.slice(1)} IQ`;
  return k;
}

function truncate(s: string, n = 80): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

// ---------- types ----------

type SessionRow = {
  id: string;
  kind: string;
  subject_key: string;
  total_items: number;
  last_index: number;
  started_at: string;
  completed_at: string | null;
};

type AnswerEvent = {
  session_id: string;
  item_id: string | null;
  correct: boolean | null;
  ms_on_item: number | null;
};

/** ordered prompts (index = ordinal position) + item_id → prompt map. */
type ItemLookup = { ordered: string[]; byId: Map<string, string> };

export default async function AdminAssessmentsPage() {
  if (!(await getAdminUser())) redirect("/");

  const db = createAdminClient();

  const [{ data: sessionsRaw }, { data: eventsRaw }, { data: activeQuestionnaire }, { data: activeQuizzes }] =
    await Promise.all([
      db
        .from("assessment_sessions")
        .select("id, kind, subject_key, total_items, last_index, started_at, completed_at")
        .order("started_at", { ascending: false })
        .limit(20000),
      db
        .from("assessment_events")
        .select("session_id, item_id, correct, ms_on_item")
        .eq("type", "answer")
        .limit(100000),
      db.from("eval_questionnaires").select("id").eq("is_active", true).limit(1).maybeSingle(),
      db.from("iq_quizzes").select("id, category").eq("is_active", true),
    ]);

  const sessions = (sessionsRaw ?? []) as SessionRow[];
  const events = (eventsRaw ?? []) as AnswerEvent[];

  // Resolve item prompts per assessment key ("eval/active", "iq/general", ...).
  const itemLookups = new Map<string, ItemLookup>();

  // eval → active questionnaire's items, ordered by ordinal.
  if (activeQuestionnaire?.id) {
    const { data: evalItems } = await db
      .from("eval_items")
      .select("id, ordinal, prompt")
      .eq("questionnaire_id", activeQuestionnaire.id)
      .order("ordinal", { ascending: true });
    const rows = (evalItems ?? []) as { id: string; ordinal: number; prompt: string }[];
    itemLookups.set("eval/active", {
      ordered: rows.map((r) => r.prompt),
      byId: new Map(rows.map((r) => [r.id, r.prompt])),
    });
  }

  // iq → active quiz per category, its questions ordered by ordinal.
  const quizzes = (activeQuizzes ?? []) as { id: string; category: string }[];
  if (quizzes.length > 0) {
    const { data: iqQuestions } = await db
      .from("iq_questions")
      .select("id, ordinal, prompt, quiz_id")
      .in(
        "quiz_id",
        quizzes.map((q) => q.id)
      )
      .order("ordinal", { ascending: true });
    const rows = (iqQuestions ?? []) as { id: string; ordinal: number; prompt: string; quiz_id: string }[];
    for (const q of quizzes) {
      const qs = rows.filter((r) => r.quiz_id === q.id);
      itemLookups.set(`iq/${q.category}`, {
        ordered: qs.map((r) => r.prompt),
        byId: new Map(qs.map((r) => [r.id, r.prompt])),
      });
    }
  }

  // session_id → assessment key (so answer events can be grouped by assessment).
  const sessionKey = new Map<string, string>();
  const groups = new Map<string, SessionRow[]>();
  for (const s of sessions) {
    const key = `${s.kind}/${s.subject_key}`;
    sessionKey.set(s.id, key);
    const arr = groups.get(key);
    if (arr) arr.push(s);
    else groups.set(key, [s]);
  }

  // Group answer events by assessment key, then by item_id.
  type ItemStat = { correctTrue: number; correctSeen: number; ms: number[] };
  const eventsByKey = new Map<string, Map<string, ItemStat>>();
  for (const e of events) {
    if (!e.item_id) continue;
    const key = sessionKey.get(e.session_id);
    if (!key) continue;
    let byItem = eventsByKey.get(key);
    if (!byItem) {
      byItem = new Map();
      eventsByKey.set(key, byItem);
    }
    let stat = byItem.get(e.item_id);
    if (!stat) {
      stat = { correctTrue: 0, correctSeen: 0, ms: [] };
      byItem.set(e.item_id, stat);
    }
    if (e.correct !== null && e.correct !== undefined) {
      stat.correctSeen += 1;
      if (e.correct) stat.correctTrue += 1;
    }
    if (typeof e.ms_on_item === "number" && e.ms_on_item >= 0) stat.ms.push(e.ms_on_item);
  }

  // Stable, sensible ordering of cards.
  const order = ["eval/active", "iq/general", "iq/coach"];
  const keys = [...groups.keys()].sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    return a.localeCompare(b);
  });

  const totalSessions = sessions.length;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="border-l-4 border-[#FDDD58] pl-6 mb-10">
        <h1 className="font-display text-4xl uppercase text-white leading-none">Assessments</h1>
        <p className="text-white/40 mt-2 text-sm">
          Completion funnel, drop-off, and item difficulty across the evaluation and IQ quizzes.
        </p>
      </div>

      {totalSessions === 0 ? (
        <div className="bg-[#0d0d0d] border border-white/10 p-10 text-center">
          <p className="text-white/50 text-sm">
            No assessment activity yet — numbers appear here as members take the evaluation and quizzes.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {keys.map((key) => {
            const [kind, subjectKey] = key.split("/");
            const rows = groups.get(key)!;
            const starts = rows.length;
            const completed = rows.filter((r) => r.completed_at);
            const completions = completed.length;
            const rate = completionRate(rows);

            const durations = completed
              .map((r) => (new Date(r.completed_at!).getTime() - new Date(r.started_at).getTime()) / 1000)
              .filter((d) => Number.isFinite(d) && d >= 0);
            const medianSec = median(durations);

            const totalItems = representativeTotal(rows);
            const histogram = totalItems > 0 ? dropOffHistogram(rows, totalItems) : [];
            const maxBar = histogram.length ? Math.max(...histogram) : 0;

            // The 3 tallest drop-off indices (count > 0).
            const topDrop = histogram
              .map((count, index) => ({ index, count }))
              .filter((b) => b.count > 0)
              .sort((a, b) => b.count - a.count)
              .slice(0, 3);
            const topDropSet = new Set(topDrop.map((b) => b.index));

            const lookup = itemLookups.get(key);
            const promptAt = (index: number): string => {
              const p = lookup?.ordered[index];
              return p ? truncate(p) : `Question ${index + 1}`;
            };

            // Hardest / most-skipped items.
            const byItem = eventsByKey.get(key) ?? new Map();
            const itemRows = [...byItem.entries()].map(([itemId, stat]) => {
              const pct = stat.correctSeen > 0 ? (stat.correctTrue / stat.correctSeen) * 100 : null;
              const med = median(stat.ms);
              const prompt = lookup?.byId.get(itemId) ?? "Unknown item";
              return { itemId, pct, med, prompt, seen: stat.correctSeen, samples: stat.ms.length };
            });

            const isIq = kind === "iq";
            const hardest = isIq
              ? itemRows
                  .filter((r) => r.pct !== null)
                  .sort((a, b) => (a.pct! - b.pct!))
                  .slice(0, 5)
              : itemRows
                  .filter((r) => r.med !== null)
                  .sort((a, b) => (b.med! - a.med!))
                  .slice(0, 5);

            return (
              <section key={key} className="bg-[#0d0d0d] border border-white/10 p-6">
                <div className="flex items-baseline justify-between flex-wrap gap-2 mb-6">
                  <h2 className="font-display text-2xl uppercase tracking-widest text-white">
                    {assessmentLabel(kind, subjectKey)}
                  </h2>
                  <span className="text-white/30 text-[10px] uppercase tracking-widest">
                    {kind} · {subjectKey} · {totalItems} items
                  </span>
                </div>

                {/* Headline stat tiles */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 border border-white/10 mb-6">
                  <div className="bg-[#0d0d0d] p-5">
                    <p className="font-display text-3xl text-white">{starts}</p>
                    <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1">Starts</p>
                  </div>
                  <div className="bg-[#0d0d0d] p-5">
                    <p className="font-display text-3xl text-white">{completions}</p>
                    <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1">Completions</p>
                  </div>
                  <div className="bg-[#0d0d0d] p-5">
                    <p className="font-display text-4xl text-[#FDDD58] leading-none">{rate}%</p>
                    <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1">Completion rate</p>
                  </div>
                  <div className="bg-[#0d0d0d] p-5">
                    <p className="font-display text-3xl text-white">{fmtDuration(medianSec)}</p>
                    <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1">Median time</p>
                  </div>
                </div>

                {/* Drop-off histogram */}
                <div className="mb-6">
                  <p className="text-white/40 text-[10px] uppercase tracking-widest mb-3">
                    Drop-off by question (unfinished sessions)
                  </p>
                  {maxBar === 0 ? (
                    <p className="text-white/25 text-xs">No abandoned sessions — everyone who started finished.</p>
                  ) : (
                    <>
                      <div className="overflow-x-auto pb-1">
                        <div className="flex items-end gap-1 h-32 min-w-max">
                          {histogram.map((count, index) => {
                            const pctH = maxBar > 0 ? Math.max((count / maxBar) * 100, count > 0 ? 6 : 0) : 0;
                            const hot = topDropSet.has(index);
                            return (
                              <div key={index} className="flex flex-col items-center justify-end w-6 shrink-0 h-full">
                                <span className="text-white/40 text-[9px] mb-1">{count > 0 ? count : ""}</span>
                                <div
                                  className={`w-full ${hot ? "bg-red-500" : "bg-[#FDDD58]/60"}`}
                                  style={{ height: `${pctH}%` }}
                                  title={`Q${index + 1}: ${count} dropped`}
                                />
                                <span className="text-white/25 text-[9px] mt-1">{index + 1}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {topDrop.length > 0 && (
                        <ul className="mt-4 space-y-1.5">
                          {topDrop.map((b) => (
                            <li key={b.index} className="flex items-start gap-2 text-xs">
                              <span className="bg-red-500/90 text-black font-display px-1.5 py-0.5 text-[10px] shrink-0">
                                {b.count} left
                              </span>
                              <span className="text-white/60">
                                Q{b.index + 1} — {promptAt(b.index)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </div>

                {/* Hardest / most-skipped items */}
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-widest mb-3">
                    {isIq ? "Hardest items (lowest % correct)" : "Slowest items (median time on question)"}
                  </p>
                  {hardest.length === 0 ? (
                    <p className="text-white/25 text-xs">Not enough answer data yet.</p>
                  ) : (
                    <ul className="divide-y divide-white/5 border border-white/10">
                      {hardest.map((r) => {
                        const miscalibrated = isIq && r.pct !== null && (r.pct < 20 || r.pct > 95);
                        return (
                          <li key={r.itemId} className="flex items-center justify-between gap-3 px-4 py-3">
                            <span className="text-white/70 text-sm min-w-0 break-words">{truncate(r.prompt, 90)}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              {miscalibrated && (
                                <span className="bg-red-500/90 text-black font-display text-[9px] uppercase px-1.5 py-0.5 tracking-widest">
                                  Mis-calibrated
                                </span>
                              )}
                              {isIq && r.pct !== null ? (
                                <span className="font-display text-[#FDDD58] text-sm tabular-nums">
                                  {Math.round(r.pct)}%
                                </span>
                              ) : (
                                <span className="font-display text-[#FDDD58] text-sm tabular-nums">
                                  {r.med !== null ? `${(r.med / 1000).toFixed(1)}s` : "—"}
                                </span>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
