"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  saveIqQuestion,
  approveIqQuestion,
  retireIqQuestion,
  type ActionResult,
} from "../actions";

export type IqQuestion = {
  id: string;
  ordinal: number;
  prompt: string;
  choices: string[];
  correct_index: number;
  explanation: string | null;
  review_note: string | null;
  status: string;
};

export default function IqEditor({ q }: { q: IqQuestion }) {
  const [prompt, setPrompt] = useState(q.prompt);
  const [choices, setChoices] = useState<string[]>(q.choices.length ? q.choices : ["", ""]);
  const [correct, setCorrect] = useState(q.correct_index);
  const [explanation, setExplanation] = useState(q.explanation ?? "");
  const [reviewNote, setReviewNote] = useState(q.review_note ?? "");
  const [status, setStatus] = useState(q.status);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  const setChoice = (i: number, v: string) =>
    setChoices((prev) => prev.map((c, idx) => (idx === i ? v : c)));
  const addChoice = () => setChoices((prev) => [...prev, ""]);
  const removeChoice = (i: number) =>
    setChoices((prev) => {
      const next = prev.filter((_, idx) => idx !== i);
      if (correct === i) setCorrect(0);
      else if (correct > i) setCorrect(correct - 1);
      return next;
    });

  const run = (fn: () => Promise<ActionResult>) =>
    startTransition(async () => {
      setResult(null);
      const r = await fn();
      setResult(r);
      if (r.ok && r.newStatus) setStatus(r.newStatus);
    });

  const save = () =>
    run(() =>
      saveIqQuestion(q.id, {
        prompt,
        choices,
        correct_index: correct,
        explanation,
        review_note: reviewNote,
      })
    );

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
          {result.warnings && result.warnings.length > 0 && (
            <ul className="mt-2 space-y-1 text-[#FDDD58] text-xs">
              {result.warnings.map((w, i) => (
                <li key={i}>⚠ {w}</li>
              ))}
            </ul>
          )}
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

      <Field label="Choices — select the correct answer">
        <div className="space-y-2">
          {choices.map((c, i) => (
            <div key={i} className="flex items-center gap-3">
              <input
                type="radio"
                name="correct"
                checked={correct === i}
                onChange={() => setCorrect(i)}
                className="accent-[#FDDD58] w-4 h-4 shrink-0"
              />
              <input
                value={c}
                onChange={(e) => setChoice(i, e.target.value)}
                className="flex-1 bg-black border border-white/15 px-3 py-2 text-white text-sm focus:border-[#FDDD58] outline-none"
              />
              {choices.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeChoice(i)}
                  className="text-white/30 hover:text-red-400 text-lg px-1 shrink-0"
                  aria-label="Remove choice"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addChoice}
            className="text-white/40 hover:text-white text-xs uppercase tracking-widest"
          >
            + Add choice
          </button>
        </div>
      </Field>

      <Field label="Explanation">
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          rows={2}
          className="w-full bg-black border border-white/15 px-3 py-2 text-white text-sm focus:border-[#FDDD58] outline-none"
        />
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
          onClick={save}
          disabled={pending}
          className="bg-[#FDDD58] text-black font-display uppercase tracking-widest text-sm px-6 py-2.5 disabled:opacity-40"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => run(() => approveIqQuestion(q.id))}
          disabled={pending || status === "approved"}
          className="border border-emerald-400/60 text-emerald-300 font-display uppercase tracking-widest text-sm px-6 py-2.5 disabled:opacity-40 hover:bg-emerald-400/10"
        >
          {status === "approved" ? "Approved ✓" : "Approve key"}
        </button>
        <button
          type="button"
          onClick={() => run(() => retireIqQuestion(q.id))}
          disabled={pending || status === "retired"}
          className="border border-white/20 text-white/50 font-display uppercase tracking-widest text-sm px-6 py-2.5 disabled:opacity-40 hover:bg-white/5"
        >
          {status === "retired" ? "Retired" : "Retire"}
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
