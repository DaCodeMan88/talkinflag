"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { saveEvalItem, approveEvalItem, type ActionResult } from "../actions";

export type EvalItem = {
  id: string;
  ordinal: number;
  prompt: string;
  context: string | null;
  options: unknown;
  item_type: string | null;
  review_note: string | null;
  reviewed_at: string | null;
};

export default function EvalEditor({ item }: { item: EvalItem }) {
  const [prompt, setPrompt] = useState(item.prompt);
  const [context, setContext] = useState(item.context ?? "");
  const [reviewNote, setReviewNote] = useState(item.review_note ?? "");
  const [reviewed, setReviewed] = useState(item.reviewed_at !== null);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<ActionResult>, onOk?: () => void) =>
    startTransition(async () => {
      setResult(null);
      const r = await fn();
      setResult(r);
      if (r.ok && onOk) onOk();
    });

  const optionList = Array.isArray(item.options)
    ? (item.options as unknown[]).map((o) =>
        typeof o === "string" ? o : typeof o === "object" && o !== null ? JSON.stringify(o) : String(o)
      )
    : [];

  return (
    <div className="space-y-6">
      {result && (
        <div
          className={`px-4 py-3 text-sm border ${
            result.ok
              ? "border-emerald-400/40 text-emerald-300 bg-emerald-400/5"
              : "border-red-500/40 text-red-300 bg-red-500/5"
          }`}
        >
          {result.ok ? "Saved." : result.error}
        </div>
      )}

      <Field label="Prompt">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="w-full bg-black border border-white/15 px-3 py-2 text-white text-sm focus:border-[#FDDD58] outline-none"
        />
      </Field>

      <Field label="Context">
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          rows={2}
          className="w-full bg-black border border-white/15 px-3 py-2 text-white text-sm focus:border-[#FDDD58] outline-none"
        />
      </Field>

      <Field label={`Options (read-only · ${item.item_type ?? "likert"})`}>
        {optionList.length === 0 ? (
          <p className="text-white/25 text-xs">No structured options on this item.</p>
        ) : (
          <ul className="border border-white/10 divide-y divide-white/5">
            {optionList.map((o, i) => (
              <li key={i} className="px-3 py-2 text-white/60 text-sm break-words">
                {o}
              </li>
            ))}
          </ul>
        )}
        <p className="text-white/25 text-[11px] mt-1">
          Evaluation options are scored config — edit them in the seed data, not here.
        </p>
      </Field>

      <Field label="Review note (internal)">
        <textarea
          value={reviewNote}
          onChange={(e) => setReviewNote(e.target.value)}
          rows={2}
          className="w-full bg-black border border-white/15 px-3 py-2 text-white text-sm focus:border-[#FDDD58] outline-none"
        />
      </Field>

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="button"
          onClick={() =>
            run(() => saveEvalItem(item.id, { prompt, context, review_note: reviewNote }))
          }
          disabled={pending}
          className="bg-[#FDDD58] text-black font-display uppercase tracking-widest text-sm px-6 py-2.5 disabled:opacity-40"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => run(() => approveEvalItem(item.id), () => setReviewed(true))}
          disabled={pending || reviewed}
          className="border border-emerald-400/60 text-emerald-300 font-display uppercase tracking-widest text-sm px-6 py-2.5 disabled:opacity-40 hover:bg-emerald-400/10"
        >
          {reviewed ? "Reviewed ✓" : "Mark reviewed"}
        </button>
        <Link
          href="/admin/assessments/questions"
          className="text-white/40 hover:text-white text-sm self-center ml-auto"
        >
          ← Back to list
        </Link>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-2">{label}</label>
      {children}
    </div>
  );
}
