import { redirect, notFound } from "next/navigation";
import { createAdminClient } from "@/lib/eval/admin-client";
import { getAdminUser } from "@/lib/admin";
import IqEditor, { type IqQuestion } from "./IqEditor";
import EvalEditor, { type EvalItem } from "./EvalEditor";

export const dynamic = "force-dynamic";

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

async function itemStats(itemId: string) {
  const db = createAdminClient();
  const { data } = await db
    .from("assessment_events")
    .select("correct, ms_on_item")
    .eq("type", "answer")
    .eq("item_id", itemId)
    .limit(100000);
  const rows = (data ?? []) as { correct: boolean | null; ms_on_item: number | null }[];
  const seen = rows.filter((r) => r.correct !== null && r.correct !== undefined);
  const correctTrue = seen.filter((r) => r.correct).length;
  const ms = rows
    .map((r) => r.ms_on_item)
    .filter((m): m is number => typeof m === "number" && m >= 0);
  const med = median(ms);
  return {
    served: rows.length,
    pctCorrect: seen.length > 0 ? Math.round((correctTrue / seen.length) * 100) : null,
    medianSec: med !== null ? med / 1000 : null,
  };
}

export default async function QuestionEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  if (!(await getAdminUser())) redirect("/");
  const { id } = await params;
  const { type } = await searchParams;
  const isEval = type === "eval";

  const db = createAdminClient();
  const stats = await itemStats(id);

  if (isEval) {
    const { data } = await db
      .from("eval_items")
      .select("id, ordinal, prompt, context, options, item_type, review_note, reviewed_at")
      .eq("id", id)
      .maybeSingle();
    if (!data) notFound();
    const item = data as EvalItem;
    return (
      <Shell title={`Eval item #${item.ordinal}`} stats={stats} isIq={false}>
        <EvalEditor item={item} />
      </Shell>
    );
  }

  const { data } = await db
    .from("iq_questions")
    .select("id, ordinal, prompt, choices, correct_index, explanation, review_note, status")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const q = {
    ...(data as Omit<IqQuestion, "choices">),
    choices: Array.isArray((data as { choices: unknown }).choices)
      ? ((data as { choices: unknown[] }).choices as string[])
      : [],
  } as IqQuestion;

  return (
    <Shell title={`IQ question #${q.ordinal}`} stats={stats} isIq>
      <IqEditor q={q} />
    </Shell>
  );
}

function Shell({
  title,
  stats,
  isIq,
  children,
}: {
  title: string;
  stats: { served: number; pctCorrect: number | null; medianSec: number | null };
  isIq: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="border-l-4 border-[#FDDD58] pl-6 mb-8">
        <h1 className="font-display text-3xl uppercase text-white leading-none">{title}</h1>
        <p className="text-white/40 mt-2 text-sm">Author and review this item.</p>
      </div>

      <div className="grid grid-cols-3 gap-px bg-white/10 border border-white/10 mb-8">
        <div className="bg-[#0d0d0d] p-4">
          <p className="font-display text-2xl text-white">{stats.served}</p>
          <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1">Times served</p>
        </div>
        <div className="bg-[#0d0d0d] p-4">
          <p className="font-display text-2xl text-[#FDDD58]">
            {isIq ? (stats.pctCorrect !== null ? `${stats.pctCorrect}%` : "—") : "—"}
          </p>
          <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1">% correct</p>
        </div>
        <div className="bg-[#0d0d0d] p-4">
          <p className="font-display text-2xl text-white">
            {stats.medianSec !== null ? `${stats.medianSec.toFixed(1)}s` : "—"}
          </p>
          <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1">Median time</p>
        </div>
      </div>

      {children}
    </div>
  );
}
