"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PerspectiveSummary, { EvalResult } from "./PerspectiveSummary";
import CheckpointScreen from "./CheckpointScreen";
import { useAutosaveDraft } from "@/hooks/useAutosaveDraft";
import { useAssessmentSession } from "@/hooks/useAssessmentSession";
import { ResumeBanner, SaveIndicator } from "@/components/ui/DraftControls";
import { AssessmentItem } from "@/components/eval/items";
import { chunkByRound, roundProgress } from "@/lib/assessments/rounds";
import type { ItemAnswer } from "@/lib/eval/item-types";

/** Round number → display name for the 5-round evaluation. */
const ROUND_NAMES: Record<number, string> = {
  1: "Snap Judgments",
  2: "Spend Your Points",
  3: "You're on the Sideline",
  4: "Rank Them",
  5: "Where You Stand",
};

type EvalDraft = { role: string; started: boolean; index: number; answers: Record<string, ItemAnswer> };

export type RunnerItem = {
  id: string;
  section_key: string;
  ordinal: number;
  prompt: string;
  style: string;
  item_type: string;
  context: string | null;
  round: number | null;
  options: { label: string }[];
};
export type Section = { key: string; label: string };

const ROLE_LABELS: Record<string, string> = {
  host: "Host",
  coach: "Coach",
  expert: "Expert",
  player: "Just for me (Player)",
};

/**
 * Honest-ish time estimate: median observed ms-per-item × remaining items,
 * falling back to a flat 6s/item before we have data. Returns seconds.
 */
function estimateSecondsLeft(times: number[], remaining: number): number {
  if (remaining <= 0) return 0;
  if (times.length === 0) return remaining * 6;
  const sorted = [...times].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  return Math.round((remaining * median) / 1000);
}

export default function EvaluationRunner({
  items,
  eligibleRoles,
}: {
  items: RunnerItem[];
  /** Retained for API compatibility; rounds now drive the progress header. */
  sections?: Section[];
  eligibleRoles: string[];
}) {
  const roleOptions = useMemo(() => [...eligibleRoles, "player"], [eligibleRoles]);
  const [role, setRole] = useState(roleOptions[0]);
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, ItemAnswer>>({});
  // Mirror of `answers` so the deferred (post-140ms) commit reads the latest
  // value even when onChange fired in the same tick as onCommit.
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EvalResult | null>(null);
  // Between-round breather. When set, we show CheckpointScreen instead of the
  // next question until the user taps Continue.
  const [checkpoint, setCheckpoint] = useState<{
    roundNumber: number;
    roundName: string;
    earnedLine: string;
    estSecondsLeft: number | null;
  } | null>(null);

  const total = items.length;
  const item = items[index];
  const answeredCount = Object.keys(answers).length;

  // Rounds come from the items' `round` values. If any item lacks a round,
  // fall back to a single round so nothing breaks (no checkpoints then).
  const chunks = useMemo(() => {
    const rounds = items.map((it) => it.round);
    if (rounds.some((r) => r == null)) return [{ round: 1, start: 0, end: total }];
    return chunkByRound(rounds as number[]);
  }, [items, total]);
  // Indices at which a new round starts (i.e. chunk starts after the first).
  const boundarySet = useMemo(() => new Set(chunks.slice(1).map((c) => c.start)), [chunks]);
  const prog = roundProgress(index, chunks);
  const roundName = ROUND_NAMES[chunks[prog.current - 1]?.round] ?? `Round ${prog.current}`;

  // Rough per-item timing to estimate time remaining at a checkpoint.
  const itemTimesRef = useRef<number[]>([]);
  const itemStartRef = useRef<number>(Date.now());

  // Save & resume across the whole evaluation flow.
  const draft = useAutosaveDraft<EvalDraft>({
    kind: "eval",
    value: { role, started, index, answers },
    enabled: !result,
    isEmpty: (v) => Object.keys(v.answers).length === 0,
  });

  const { sessionId, track } = useAssessmentSession({
    kind: "eval",
    subjectKey: "active",
    totalItems: total,
    enabled: started,
  });

  const submit = useCallback(
    async (finalAnswers: Record<string, ItemAnswer>) => {
      setSubmitting(true);
      setError(null);
      try {
        const res = await fetch("/api/eval/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: finalAnswers, role, sessionId }),
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
    [role, draft, sessionId]
  );

  // Advance past the current item, submitting on the last one. The answer for
  // `item.id` has already been written into `answers` via onChange by the time
  // this runs (auto-advance types call onChange then onCommit synchronously;
  // budget/rank call onChange during editing and onCommit on Continue).
  const commitCurrent = useCallback(() => {
    if (!item) return;
    setTimeout(() => {
      const snapshot = answersRef.current;
      const answered = Object.keys(snapshot).length;
      // Record how long this item took (rough — feeds the time estimate).
      const now = Date.now();
      itemTimesRef.current.push(now - itemStartRef.current);
      itemStartRef.current = now;
      track("answer", { itemIndex: index, itemId: item.id, answeredCount: answered });
      const nextIndex = index + 1;
      if (nextIndex >= total) {
        submit(snapshot);
        return;
      }
      // Crossing into a new round (and not the final item) → show a breather.
      if (boundarySet.has(nextIndex)) {
        const done = roundProgress(index, chunks); // the round just completed
        const remaining = total - nextIndex;
        const est = estimateSecondsLeft(itemTimesRef.current, remaining);
        track("checkpoint", { itemIndex: nextIndex });
        setCheckpoint({
          roundNumber: done.current,
          roundName: ROUND_NAMES[chunks[done.current - 1]?.round] ?? `Round ${done.current}`,
          earnedLine: `Through ${answered} questions — nice pace.`,
          estSecondsLeft: est,
        });
      }
      setIndex(nextIndex);
    }, 140);
  }, [item, index, total, submit, track, boundarySet, chunks]);

  // Number-key shortcuts pick an option — only for single-choice types. Budget
  // and rank use inputs where digit presses would fight the controls.
  const choiceType = item ? ["likert", "forced_choice", "scenario"].includes(item.item_type) : false;
  useEffect(() => {
    if (!started || result || checkpoint) return;
    const onKey = (e: KeyboardEvent) => {
      if (choiceType && item && e.key >= "1" && e.key <= String(Math.min(9, item.options.length))) {
        const idx = Number(e.key) - 1;
        setAnswers((prev) => ({ ...prev, [item.id]: idx }));
        commitCurrent();
      } else if (e.key === "ArrowLeft" && index > 0) {
        setIndex((i) => i - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, result, checkpoint, item, index, choiceType, commitCurrent]);

  if (result) return <PerspectiveSummary result={result} />;

  // --- between-round breather ---
  if (checkpoint) {
    return (
      <CheckpointScreen
        roundName={checkpoint.roundName}
        roundNumber={checkpoint.roundNumber}
        totalRounds={chunks.length}
        earnedLine={checkpoint.earnedLine}
        estSecondsLeft={checkpoint.estSecondsLeft}
        onContinue={() => {
          itemStartRef.current = Date.now();
          setCheckpoint(null);
        }}
      />
    );
  }

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
                  track("resume", { itemIndex: v.index ?? 0 });
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
            Round {prog.current} of {chunks.length} · <span className="text-brand-yellow">{roundName}</span>
          </span>
          <span className="flex items-center gap-3">
            <SaveIndicator status={draft.status} />
            <span>{answeredCount}/{total}</span>
          </span>
        </div>
        {/* within-round progress */}
        <div className="mt-2 h-1.5 rounded bg-white/10 overflow-hidden">
          <div
            className="h-full bg-brand-yellow transition-all duration-300"
            style={{ width: `${prog.withinTotal ? ((prog.withinIndex + 1) / prog.withinTotal) * 100 : 0}%` }}
          />
        </div>
        {/* thin full-run bar beneath */}
        <div className="mt-1 h-0.5 rounded bg-white/5 overflow-hidden">
          <div className="h-full bg-white/30 transition-all duration-300" style={{ width: `${(answeredCount / total) * 100}%` }} />
        </div>
      </div>

      <div key={item.id} className="flex-1 flex flex-col justify-center py-8 animate-[fadeIn_240ms_ease]">
        <p className="font-display uppercase tracking-widest text-brand-yellow text-xs">Question {index + 1}</p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-semibold leading-snug">{item.prompt}</h2>
        <AssessmentItem
          item={item}
          value={answers[item.id]}
          onChange={(v) => setAnswers((prev) => ({ ...prev, [item.id]: v }))}
          onCommit={commitCurrent}
          disabled={submitting}
        />
      </div>

      <div className="flex justify-between items-center pb-4 text-xs uppercase tracking-widest text-white/50">
        <button onClick={() => { track("back", { itemIndex: index }); setIndex((i) => Math.max(0, i - 1)); }} disabled={index === 0} className="disabled:opacity-30">
          ← Back
        </button>
        {submitting && <span className="text-brand-yellow">Scoring…</span>}
        {error && <span className="text-red-400 normal-case tracking-normal">{error} — <button className="underline" onClick={() => submit(answers)}>retry</button></span>}
        {choiceType ? <span>Press 1–{Math.min(5, item.options.length)}</span> : <span />}
      </div>
    </div>
  );
}
