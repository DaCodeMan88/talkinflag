"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PerspectiveSummary, { EvalResult } from "./PerspectiveSummary";
import { useAutosaveDraft } from "@/hooks/useAutosaveDraft";
import { ResumeBanner, SaveIndicator } from "@/components/ui/DraftControls";

type EvalDraft = { role: string; started: boolean; index: number; answers: Record<string, number> };

export type RunnerItem = {
  id: string;
  section_key: string;
  ordinal: number;
  prompt: string;
  options: { label: string }[];
};
export type Section = { key: string; label: string };

const ROLE_LABELS: Record<string, string> = {
  host: "Host",
  coach: "Coach",
  expert: "Expert",
  player: "Just for me (Player)",
};

export default function EvaluationRunner({
  items,
  sections,
  eligibleRoles,
}: {
  items: RunnerItem[];
  sections: Section[];
  eligibleRoles: string[];
}) {
  const roleOptions = useMemo(() => [...eligibleRoles, "player"], [eligibleRoles]);
  const [role, setRole] = useState(roleOptions[0]);
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EvalResult | null>(null);

  const total = items.length;
  const item = items[index];
  const sectionLabel = sections.find((s) => s.key === item?.section_key)?.label ?? "";
  const sectionIndex = sections.findIndex((s) => s.key === item?.section_key) + 1;
  const answeredCount = Object.keys(answers).length;

  // Save & resume across the whole evaluation flow.
  const draft = useAutosaveDraft<EvalDraft>({
    kind: "eval",
    value: { role, started, index, answers },
    enabled: !result,
    isEmpty: (v) => Object.keys(v.answers).length === 0,
  });

  const submit = useCallback(
    async (finalAnswers: Record<string, number>) => {
      setSubmitting(true);
      setError(null);
      try {
        const res = await fetch("/api/eval/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: finalAnswers, role }),
        });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Submission failed");
        setResult(await res.json());
        draft.clear();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setSubmitting(false);
      }
    },
    [role, draft]
  );

  const choose = useCallback(
    (choiceIdx: number) => {
      if (!item) return;
      const next = { ...answers, [item.id]: choiceIdx };
      setAnswers(next);
      setTimeout(() => {
        if (index + 1 >= total) submit(next);
        else setIndex((i) => i + 1);
      }, 140);
    },
    [item, answers, index, total, submit]
  );

  useEffect(() => {
    if (!started || result) return;
    const onKey = (e: KeyboardEvent) => {
      if (item && e.key >= "1" && e.key <= String(Math.min(9, item.options.length))) {
        choose(Number(e.key) - 1);
      } else if (e.key === "ArrowLeft" && index > 0) {
        setIndex((i) => i - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, result, item, index, choose]);

  if (result) return <PerspectiveSummary result={result} />;

  // --- intro / role selection ---
  if (!started) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-14 text-brand-white text-center">
        <p className="font-display uppercase tracking-widest text-brand-yellow text-sm">Talkin Flag</p>
        <h1 className="font-display uppercase tracking-widest text-4xl sm:text-6xl mt-2 leading-none">
          How Do You<br />Judge an Athlete?
        </h1>
        <p className="mt-5 text-white/80">
          50 quick calls across 10 areas of the game. There are no wrong answers — we&apos;re mapping <em>your</em> eye
          for talent. Takes about 3 minutes. Tap or press 1–5.
        </p>

        {draft.resumable && (
          <div className="mt-6 text-left">
            <ResumeBanner
              updatedAt={draft.resumable.updatedAt}
              source={draft.resumable.source}
              label="your evaluation"
              onResume={() => {
                const v = draft.resume();
                if (v) {
                  setAnswers(v.answers ?? {});
                  setIndex(Math.min(v.index ?? 0, total - 1));
                  if (v.role) setRole(v.role);
                  setStarted(v.started ?? true);
                }
              }}
              onDismiss={draft.dismissResume}
            />
          </div>
        )}

        <div className="mt-8 text-left rounded-2xl bg-brand-gray border border-white/10 p-5">
          <p className="font-display uppercase tracking-widest text-xs text-brand-yellow">Answer as</p>
          <div className="mt-3 grid gap-2">
            {roleOptions.map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`text-left rounded-xl px-4 py-3 border transition ${
                  role === r ? "border-brand-yellow bg-brand-yellow/10" : "border-white/15 hover:border-white/40"
                }`}
              >
                <span className="font-display uppercase tracking-widest text-sm">{ROLE_LABELS[r] ?? r}</span>
                {r !== "player" && (
                  <span className="block text-[11px] text-white/50">Your answers shape the {ROLE_LABELS[r]} Poll.</span>
                )}
                {r === "player" && (
                  <span className="block text-[11px] text-white/50">For your own insight — no poll weight.</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setStarted(true)}
          className="mt-8 rounded-full bg-brand-yellow text-brand-black font-display uppercase tracking-widest px-10 py-4"
        >
          Begin
        </button>
      </div>
    );
  }

  // --- question ---
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 text-brand-white min-h-[80vh] flex flex-col">
      {/* progress */}
      <div className="sticky top-0 pt-2 pb-3 bg-brand-black/80 backdrop-blur">
        <div className="flex justify-between text-[11px] uppercase tracking-widest text-white/60">
          <span>
            Section {sectionIndex}/10 · <span className="text-brand-yellow">{sectionLabel}</span>
          </span>
          <span className="flex items-center gap-3">
            <SaveIndicator status={draft.status} />
            <span>{answeredCount}/{total}</span>
          </span>
        </div>
        <div className="mt-2 h-1.5 rounded bg-white/10 overflow-hidden">
          <div className="h-full bg-brand-yellow transition-all duration-300" style={{ width: `${(answeredCount / total) * 100}%` }} />
        </div>
      </div>

      <div key={item.id} className="flex-1 flex flex-col justify-center py-8 animate-[fadeIn_240ms_ease]">
        <p className="font-display uppercase tracking-widest text-brand-yellow text-xs">Question {index + 1}</p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-semibold leading-snug">{item.prompt}</h2>
        <div className="mt-6 grid gap-3">
          {item.options.map((o, i) => {
            const selected = answers[item.id] === i;
            return (
              <button
                key={i}
                onClick={() => choose(i)}
                disabled={submitting}
                className={`flex items-center gap-3 text-left rounded-xl px-4 py-4 border transition ${
                  selected ? "border-brand-yellow bg-brand-yellow/15" : "border-white/15 hover:border-brand-yellow/70 hover:bg-white/5"
                }`}
              >
                <span className="shrink-0 w-7 h-7 rounded-full border border-white/30 grid place-items-center text-xs">{i + 1}</span>
                <span className="text-base">{o.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between items-center pb-4 text-xs uppercase tracking-widest text-white/50">
        <button onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} className="disabled:opacity-30">
          ← Back
        </button>
        {submitting && <span className="text-brand-yellow">Scoring…</span>}
        {error && <span className="text-red-400 normal-case tracking-normal">{error} — <button className="underline" onClick={() => submit(answers)}>retry</button></span>}
        <span>Press 1–{Math.min(5, item.options.length)}</span>
      </div>
    </div>
  );
}
