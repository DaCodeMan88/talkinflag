import { redirect } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/eval/admin-client";
import { getAdminUser } from "@/lib/admin";

export const dynamic = "force-dynamic";

// ---------- helpers ----------

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function truncate(s: string, n = 90): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

function quizLabel(category: string, title: string | null): string {
  if (category === "coach") return "Coach IQ";
  if (category === "general") return "Core Flag IQ";
  return title || `${category.charAt(0).toUpperCase()}${category.slice(1)} IQ`;
}

// ---------- types ----------

type Filter = "all" | "draft" | "miscalibrated" | "never-served";

type IqRow = {
  id: string;
  quiz_id: string;
  ordinal: number;
  prompt: string;
  status: string;
  domain: string | null;
  served: number;
  pctCorrect: number | null;
  medianSec: number | null;
};

type EvalRow = {
  id: string;
  section_key: string;
  ordinal: number;
  prompt: string;
  item_type: string | null;
  reviewed_at: string | null;
  served: number;
  medianSec: number | null;
};

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  if (!(await getAdminUser())) redirect("/");
  const { filter: filterParam } = await searchParams;
  const filter: Filter = (["draft", "miscalibrated", "never-served"] as const).includes(
    filterParam as never
  )
    ? (filterParam as Filter)
    : "all";

  const db = createAdminClient();

  const [{ data: quizzesRaw }, { data: iqRaw }, { data: evalItemsRaw }, { data: eventsRaw }] =
    await Promise.all([
      db.from("iq_quizzes").select("id, category, title"),
      db
        .from("iq_questions")
        .select("id, quiz_id, ordinal, prompt, status, domain")
        .order("quiz_id", { ascending: true })
        .order("ordinal", { ascending: true }),
      db
        .from("eval_items")
        .select("id, section_key, ordinal, prompt, item_type, reviewed_at")
        .order("ordinal", { ascending: true }),
      db
        .from("assessment_events")
        .select("item_id, correct, ms_on_item")
        .eq("type", "answer")
        .limit(200000),
    ]);

  const quizzes = (quizzesRaw ?? []) as { id: string; category: string; title: string | null }[];
  const quizById = new Map(quizzes.map((q) => [q.id, q]));

  // Aggregate per-item stats from answer events.
  type Stat = { served: number; correctSeen: number; correctTrue: number; ms: number[] };
  const stats = new Map<string, Stat>();
  for (const e of (eventsRaw ?? []) as {
    item_id: string | null;
    correct: boolean | null;
    ms_on_item: number | null;
  }[]) {
    if (!e.item_id) continue;
    let s = stats.get(e.item_id);
    if (!s) {
      s = { served: 0, correctSeen: 0, correctTrue: 0, ms: [] };
      stats.set(e.item_id, s);
    }
    s.served += 1;
    if (e.correct !== null && e.correct !== undefined) {
      s.correctSeen += 1;
      if (e.correct) s.correctTrue += 1;
    }
    if (typeof e.ms_on_item === "number" && e.ms_on_item >= 0) s.ms.push(e.ms_on_item);
  }

  const statFor = (id: string) => {
    const s = stats.get(id);
    if (!s) return { served: 0, pctCorrect: null as number | null, medianSec: null as number | null };
    const med = median(s.ms);
    return {
      served: s.served,
      pctCorrect: s.correctSeen > 0 ? (s.correctTrue / s.correctSeen) * 100 : null,
      medianSec: med !== null ? med / 1000 : null,
    };
  };

  const iqRows: IqRow[] = ((iqRaw ?? []) as Omit<IqRow, "served" | "pctCorrect" | "medianSec">[]).map(
    (r) => ({ ...r, ...statFor(r.id) })
  );
  const evalRows: EvalRow[] = ((evalItemsRaw ?? []) as Omit<
    EvalRow,
    "served" | "medianSec"
  >[]).map((r) => {
    const s = statFor(r.id);
    return { ...r, served: s.served, medianSec: s.medianSec };
  });

  // Filters.
  const iqMiscalibrated = (r: IqRow) =>
    r.served > 0 && r.pctCorrect !== null && (r.pctCorrect < 20 || r.pctCorrect > 95);
  const filteredIq = iqRows.filter((r) => {
    if (filter === "draft") return r.status === "draft";
    if (filter === "miscalibrated") return iqMiscalibrated(r);
    if (filter === "never-served") return r.served === 0;
    return true;
  });
  const filteredEval = evalRows.filter((r) => {
    if (filter === "draft") return r.reviewed_at === null;
    if (filter === "miscalibrated") return false; // eval has no correct answer
    if (filter === "never-served") return r.served === 0;
    return true;
  });

  const draftCount = iqRows.filter((r) => r.status === "draft").length;
  const coachDrafts = iqRows.filter(
    (r) => r.status === "draft" && quizById.get(r.quiz_id)?.category === "coach"
  ).length;
  const evalUnreviewed = evalRows.filter((r) => r.reviewed_at === null).length;

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "draft", label: "Needs review" },
    { key: "miscalibrated", label: "Mis-calibrated" },
    { key: "never-served", label: "Never served" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="border-l-4 border-[#FDDD58] pl-6 mb-8">
        <h1 className="font-display text-4xl uppercase text-white leading-none">Questions</h1>
        <p className="text-white/40 mt-2 text-sm">
          Author and review the IQ answer keys and evaluation items. Confirm each Coach IQ key so it
          formally counts toward voting influence.
        </p>
      </div>

      {/* Needs-review banner */}
      {(draftCount > 0 || evalUnreviewed > 0) && (
        <div className="bg-[#FDDD58]/10 border border-[#FDDD58]/40 px-5 py-4 mb-8">
          <p className="text-[#FDDD58] font-display uppercase tracking-widest text-sm">
            {draftCount} IQ question{draftCount === 1 ? "" : "s"} awaiting review
            {coachDrafts > 0 && ` · ${coachDrafts} Coach IQ`}
            {evalUnreviewed > 0 && ` · ${evalUnreviewed} eval item${evalUnreviewed === 1 ? "" : "s"}`}
          </p>
          <p className="text-white/50 text-xs mt-1">
            Approving an IQ question confirms its answer key. Retired questions stop being served.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((f) => {
          const active = filter === f.key;
          const href = f.key === "all" ? "?" : `?filter=${f.key}`;
          return (
            <Link
              key={f.key}
              href={href}
              className={`px-3 py-1.5 text-xs font-display uppercase tracking-widest border transition-colors ${
                active
                  ? "bg-[#FDDD58] text-black border-[#FDDD58]"
                  : "border-white/15 text-white/50 hover:text-white hover:border-white/40"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {/* IQ questions */}
      <section className="mb-12">
        <h2 className="font-display text-xl uppercase tracking-widest text-white mb-3">
          IQ Questions <span className="text-white/30 text-sm">({filteredIq.length})</span>
        </h2>
        {filteredIq.length === 0 ? (
          <p className="text-white/30 text-sm py-6">No IQ questions match this filter.</p>
        ) : (
          <div className="border border-white/10 divide-y divide-white/5">
            {filteredIq.map((r) => {
              const quiz = quizById.get(r.quiz_id);
              const miscal = iqMiscalibrated(r);
              return (
                <Link
                  key={r.id}
                  href={`/admin/assessments/questions/${r.id}?type=iq`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                >
                  <span className="text-white/25 text-[10px] font-display uppercase tracking-widest w-24 shrink-0">
                    {quiz ? quizLabel(quiz.category, quiz.title) : "—"}
                  </span>
                  <span className="text-white/20 text-xs tabular-nums w-8 shrink-0">#{r.ordinal}</span>
                  <span className="text-white/70 text-sm min-w-0 flex-1 break-words">
                    {truncate(r.prompt)}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {r.status === "draft" && (
                      <span className="bg-[#FDDD58] text-black font-display text-[9px] uppercase px-1.5 py-0.5 tracking-widest">
                        Needs review
                      </span>
                    )}
                    {r.status === "approved" && (
                      <span className="text-emerald-400 font-display text-[9px] uppercase px-1.5 py-0.5 tracking-widest border border-emerald-400/40">
                        Approved
                      </span>
                    )}
                    {r.status === "retired" && (
                      <span className="text-white/30 font-display text-[9px] uppercase px-1.5 py-0.5 tracking-widest border border-white/20">
                        Retired
                      </span>
                    )}
                    {miscal && (
                      <span className="bg-red-500/90 text-black font-display text-[9px] uppercase px-1.5 py-0.5 tracking-widest">
                        Mis-cal
                      </span>
                    )}
                    <span className="text-white/40 text-[11px] tabular-nums w-28 text-right">
                      {r.served === 0
                        ? "never served"
                        : `${r.served}× · ${
                            r.pctCorrect !== null ? `${Math.round(r.pctCorrect)}%` : "—"
                          } · ${r.medianSec !== null ? `${r.medianSec.toFixed(1)}s` : "—"}`}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Eval items */}
      <section>
        <h2 className="font-display text-xl uppercase tracking-widest text-white mb-3">
          Evaluation Items <span className="text-white/30 text-sm">({filteredEval.length})</span>
        </h2>
        {filteredEval.length === 0 ? (
          <p className="text-white/30 text-sm py-6">No evaluation items match this filter.</p>
        ) : (
          <div className="border border-white/10 divide-y divide-white/5">
            {filteredEval.map((r) => (
              <Link
                key={r.id}
                href={`/admin/assessments/questions/${r.id}?type=eval`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
              >
                <span className="text-white/25 text-[10px] font-display uppercase tracking-widest w-24 shrink-0">
                  {r.section_key}
                </span>
                <span className="text-white/20 text-xs tabular-nums w-8 shrink-0">#{r.ordinal}</span>
                <span className="text-white/70 text-sm min-w-0 flex-1 break-words">
                  {truncate(r.prompt)}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-white/25 text-[10px] uppercase tracking-widest">
                    {r.item_type ?? "likert"}
                  </span>
                  {r.reviewed_at ? (
                    <span className="text-emerald-400 font-display text-[9px] uppercase px-1.5 py-0.5 tracking-widest border border-emerald-400/40">
                      Reviewed ✓
                    </span>
                  ) : (
                    <span className="bg-[#FDDD58] text-black font-display text-[9px] uppercase px-1.5 py-0.5 tracking-widest">
                      Needs review
                    </span>
                  )}
                  <span className="text-white/40 text-[11px] tabular-nums w-20 text-right">
                    {r.served === 0
                      ? "never served"
                      : `${r.served}× · ${r.medianSec !== null ? `${r.medianSec.toFixed(1)}s` : "—"}`}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
