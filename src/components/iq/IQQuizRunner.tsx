"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAutosaveDraft, type DraftKind } from "@/hooks/useAutosaveDraft";
import { useAssessmentSession } from "@/hooks/useAssessmentSession";
import { ResumeBanner, SaveIndicator } from "@/components/ui/DraftControls";
import CheckpointScreen from "@/components/eval/CheckpointScreen";
import { fixedChunks, roundProgress } from "@/lib/assessments/rounds";
import { nextStreak } from "@/lib/iq/streak";
import { hasEnoughSamples } from "@/lib/assessments/percentile";

export type IQItem = { id: string; ordinal: number; prompt: string; choices: string[] };
type Result = { id: string; ordinal: number; correct_index: number; chosen: number | null; correct: boolean; explanation: string | null };
type DomainStat = { domain: string; correct: number; total: number; pct: number };
// Saved answers are keyed by the chosen choice's LABEL, not its displayed index.
// Each page load re-shuffles a question's choices under a fresh nonce, so a
// stored index would point at the wrong option on resume; the label is stable,
// so we translate it back to the current displayed index when resuming.
type QuizDraft = { index: number; answerLabels: Record<string, string> };
type QuizMode = "instant" | "test";
type Feedback = { correct: boolean; correctIndexDisplayed: number; explanation: string | null };

export default function IQQuizRunner({
  category,
  title,
  questions,
  sessionId: existingSessionId,
  initialMode = "instant",
}: {
  category: string;
  title: string;
  questions: IQItem[];
  /** Session created server-side (carries the shuffle nonce). Optional so older
   * callers still work — then the hook self-creates a session. */
  sessionId?: string | null;
  /** Default answering mode; the user can flip it on the intro screen. */
  initialMode?: QuizMode;
}) {
  const [mode, setMode] = useState<QuizMode>(initialMode);
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scored, setScored] = useState<{ pct: number; raw: number; max: number; results: Result[]; percentile: number | null; sampleSize: number; domains: DomainStat[] } | null>(null);
  const [shared, setShared] = useState(false);
  const [checkpoint, setCheckpoint] = useState<{ roundNumber: number } | null>(null);

  // Instant-feedback state.
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [checking, setChecking] = useState(false);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [bump, setBump] = useState(false);

  const isCoach = category === "coach";
  const iqLabel = isCoach ? "Coach IQ" : "Flag Football IQ";
  const isInstant = mode === "instant";

  const total = questions.length;
  const q = questions[index];
  const answeredCount = Object.keys(answers).length;
  const byId = useMemo(() => Object.fromEntries(questions.map((x) => [x.id, x])), [questions]);

  // Persist answers by chosen LABEL (nonce-independent), so resume survives the
  // per-page-load choice re-shuffle. Translated back to indices on resume.
  const answerLabels = useMemo(() => {
    const out: Record<string, string> = {};
    for (const [qid, idx] of Object.entries(answers)) {
      const label = byId[qid]?.choices[idx];
      if (label != null) out[qid] = label;
    }
    return out;
  }, [answers, byId]);

  // Break the flat question list into fixed-size rounds (coach = 8, else 10).
  const chunks = useMemo(() => fixedChunks(total, isCoach ? 8 : 10), [total, isCoach]);
  const boundarySet = useMemo(() => new Set(chunks.slice(1).map((c) => c.start)), [chunks]);
  const prog = roundProgress(index, chunks);

  // Save & resume — only the coach/general quizzes have a draft kind.
  const draftKind: DraftKind | null =
    category === "coach" ? "quiz:coach" : category === "general" ? "quiz:general" : null;
  const draft = useAutosaveDraft<QuizDraft>({
    kind: (draftKind ?? "quiz:general"),
    value: { index, answerLabels },
    enabled: !!draftKind && !scored,
    isEmpty: (v) => Object.keys(v.answerLabels ?? {}).length === 0,
  });

  const { sessionId, track } = useAssessmentSession({
    kind: "iq",
    subjectKey: category,
    totalItems: total,
    enabled: true,
    existingSessionId,
  });

  const submit = useCallback(async (finalAnswers: Record<string, number>) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/iq/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, answers: finalAnswers, sessionId }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Submission failed");
      const data = await res.json();
      setScored({
        pct: data.score_pct,
        raw: data.raw,
        max: data.max,
        results: data.results,
        percentile: data.percentile ?? null,
        sampleSize: data.sampleSize ?? 0,
        domains: Array.isArray(data.domains) ? data.domains : [],
      });
      draft.clear();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }, [category, draft, sessionId]);

  // Advance to the next question (shared by both modes), honoring round checkpoints.
  const advance = useCallback((committed: Record<string, number>) => {
    const nextIndex = index + 1;
    if (nextIndex >= total) {
      submit(committed);
      return;
    }
    if (boundarySet.has(nextIndex)) {
      const done = roundProgress(index, chunks); // the round just completed
      track("checkpoint", { itemIndex: nextIndex });
      setCheckpoint({ roundNumber: done.current });
    }
    setIndex(nextIndex);
  }, [index, total, submit, boundarySet, chunks, track]);

  // TEST mode: record telemetry via /api/assessments/event, then auto-advance.
  const chooseTest = useCallback((choiceIdx: number) => {
    if (!q) return;
    const next = { ...answers, [q.id]: choiceIdx };
    setAnswers(next);
    track("answer", { itemIndex: index, itemId: q.id, answeredCount: Object.keys(next).length });
    setTimeout(() => advance(next), 150);
  }, [q, answers, index, track, advance]);

  // INSTANT mode: check the single answer server-side (which ALSO records the
  // answer event — so we do NOT also call track("answer") here, or we'd create a
  // duplicate answer row and trip the one-check-per-question guard). Reveal the
  // result and wait for an explicit Continue.
  const chooseInstant = useCallback(async (choiceIdx: number) => {
    if (!q || feedback || checking) return;
    setChecking(true);
    setError(null);
    const next = { ...answers, [q.id]: choiceIdx };
    setAnswers(next);
    try {
      const res = await fetch("/api/iq/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, category, questionId: q.id, choice: choiceIdx, itemIndex: index }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Could not check answer");
      const data: Feedback = await res.json();
      setFeedback(data);
      setStreak((cur) => {
        const ns = nextStreak(cur, data.correct);
        setBest((b) => {
          if (ns > b && ns > 0) { setBump(true); setTimeout(() => setBump(false), 1200); return ns; }
          return b;
        });
        return ns;
      });
    } catch (e) {
      // Roll the selection back so the user can retry cleanly.
      setAnswers((a) => { const c = { ...a }; delete c[q.id]; return c; });
      setError(e instanceof Error ? e.message : "Could not check answer");
    } finally {
      setChecking(false);
    }
  }, [q, feedback, checking, answers, sessionId, category, index]);

  const continueInstant = useCallback(() => {
    if (!feedback) return;
    setFeedback(null);
    advance(answers);
  }, [feedback, answers, advance]);

  useEffect(() => {
    if (scored || checkpoint || !started) return;
    const onKey = (e: KeyboardEvent) => {
      if (isInstant && feedback) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); continueInstant(); }
        return;
      }
      if (isInstant && checking) return;
      if (q && e.key >= "1" && e.key <= String(Math.min(9, q.choices.length))) {
        const pick = Number(e.key) - 1;
        if (isInstant) chooseInstant(pick); else chooseTest(pick);
      } else if (!isInstant && e.key === "ArrowLeft" && index > 0) setIndex((i) => i - 1);
      else if (!isInstant && e.key === "ArrowRight" && index < total - 1) setIndex((i) => i + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [q, index, total, scored, checkpoint, started, isInstant, feedback, checking, chooseInstant, chooseTest, continueInstant]);

  // --- intro / mode picker (also the resume entry point) ---
  if (!started && !scored) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-brand-white min-h-[70vh] flex flex-col justify-center">
        <p className="font-display uppercase tracking-widest text-brand-yellow text-sm">{title}</p>
        <h1 className="font-display uppercase tracking-widest text-4xl sm:text-5xl mt-2">Ready?</h1>
        <p className="mt-3 text-white/70">{total} questions. Pick how you want to take it.</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode("instant")}
            aria-pressed={isInstant}
            className={`text-left rounded-xl border p-4 transition ${isInstant ? "border-brand-yellow bg-brand-yellow/10" : "border-white/15 hover:border-brand-yellow/60"}`}
          >
            <span className="font-display uppercase tracking-widest text-sm">🔥 Instant feedback</span>
            <span className="mt-1 block text-xs text-white/70">Learn as you go — see the answer and why, right after each question. Builds a streak.</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("test")}
            aria-pressed={!isInstant}
            className={`text-left rounded-xl border p-4 transition ${!isInstant ? "border-brand-yellow bg-brand-yellow/10" : "border-white/15 hover:border-brand-yellow/60"}`}
          >
            <span className="font-display uppercase tracking-widest text-sm">Test mode</span>
            <span className="mt-1 block text-xs text-white/70">No hints. Full results and explanations at the end.</span>
          </button>
        </div>

        {draft.resumable && (
          <div className="mt-6">
            <ResumeBanner
              updatedAt={draft.resumable.updatedAt}
              source={draft.resumable.source}
              label="your quiz progress"
              onResume={() => {
                const v = draft.resume();
                if (v) {
                  // Translate saved labels back to THIS attempt's displayed indices.
                  const restored: Record<string, number> = {};
                  for (const [qid, label] of Object.entries(v.answerLabels ?? {})) {
                    const di = byId[qid]?.choices.indexOf(label) ?? -1;
                    if (di >= 0) restored[qid] = di;
                  }
                  setAnswers(restored);
                  setIndex(Math.min(v.index ?? 0, total - 1));
                  track("resume", { itemIndex: v.index ?? 0 });
                }
                setStarted(true);
              }}
              onDismiss={draft.dismissResume}
            />
          </div>
        )}

        <div className="mt-8">
          <button
            type="button"
            onClick={() => setStarted(true)}
            className="rounded-full bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-sm px-8 py-3 hover:bg-brand-yellow/90 transition"
          >
            Start quiz
          </button>
        </div>
      </div>
    );
  }

  // --- between-round breather ---
  if (checkpoint) {
    return (
      <CheckpointScreen
        roundName={`Round ${checkpoint.roundNumber} complete`}
        roundNumber={checkpoint.roundNumber}
        totalRounds={chunks.length}
        earnedLine={`Round ${checkpoint.roundNumber} of ${chunks.length} done — keep going.`}
        estSecondsLeft={null}
        onContinue={() => setCheckpoint(null)}
      />
    );
  }

  // --- results screen ---
  if (scored) {
    const grade = scored.pct >= 85 ? "Elite" : scored.pct >= 70 ? "Sharp" : scored.pct >= 50 ? "Solid" : "Rookie";
    const share = async () => {
      const text = `I scored ${scored.pct.toFixed(0)}/100 on the Talkin Flag ${iqLabel} quiz.`;
      const url = (typeof window !== "undefined" ? window.location.origin : "https://talkinflag.com") + "/iq";
      try {
        if (typeof navigator !== "undefined" && navigator.share) {
          await navigator.share({ title: `Talkin Flag — ${iqLabel}`, text, url });
        } else if (typeof navigator !== "undefined" && navigator.clipboard) {
          await navigator.clipboard.writeText(`${text} ${url}`);
          setShared(true);
          setTimeout(() => setShared(false), 2000);
        }
      } catch { /* user cancelled */ }
    };
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-brand-white">
        <p className="font-display uppercase tracking-widest text-brand-yellow text-sm">{title}</p>
        <h1 className="font-display uppercase tracking-widest text-6xl mt-2 inline-block animate-[popIn_400ms_ease]">
          {scored.pct.toFixed(0)}<span className="text-2xl text-white/50"> / 100</span>
        </h1>
        <p className="mt-1 text-white/80">{iqLabel}: <span className="text-brand-yellow">{grade}</span> · {scored.raw}/{scored.max} correct</p>
        {isInstant && best > 0 && (
          <p className="mt-1 text-sm text-white/70">Best streak this run: <span className="text-brand-yellow">🔥 {best}</span></p>
        )}

        {/* Percentile among all takers — honest: suppressed until enough data. */}
        {(() => {
          const takers = isCoach ? "coaches" : "players";
          if (scored.percentile !== null && hasEnoughSamples(scored.sampleSize)) {
            return (
              <p className="mt-3 text-sm text-white/80">
                You&apos;re in the <span className="text-brand-yellow font-semibold">{Math.round(scored.percentile)}th percentile</span>{" "}
                of {scored.sampleSize.toLocaleString()} {takers} who&apos;ve taken this.
              </p>
            );
          }
          return (
            <p className="mt-3 text-sm text-white/60">
              You&apos;re one of the first {scored.sampleSize.toLocaleString()} to take this — a percentile shows up once more {takers} have played.
            </p>
          );
        })()}

        {/* Per-domain breakdown — only when the bank carries domains. */}
        {scored.domains.length > 0 && (() => {
          const weakest = new Set(
            [...scored.domains].sort((a, b) => a.pct - b.pct).slice(0, 2).map((d) => d.domain)
          );
          const prettify = (s: string) =>
            s.split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
          return (
            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5">
              <p className="font-display uppercase tracking-widest text-brand-yellow text-xs">By area</p>
              <div className="mt-3 space-y-3">
                {scored.domains.map((d) => {
                  const weak = weakest.has(d.domain);
                  return (
                    <div key={d.domain}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/80">{prettify(d.domain)}</span>
                        <span className={weak ? "text-white/60" : "text-brand-yellow"}>{d.correct}/{d.total} · {Math.round(d.pct)}%</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded bg-white/10 overflow-hidden">
                        <div className={`h-full ${weak ? "bg-white/40" : "bg-brand-yellow"}`} style={{ width: `${d.pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              {weakest.size > 0 && (
                <p className="mt-4 text-xs text-white/60">
                  Weakest area{weakest.size > 1 ? "s" : ""}: <span className="text-white/80">{[...weakest].map(prettify).join(" & ")}</span>. Brush up on{" "}
                  <Link href="/how-rankings-work" className="text-brand-yellow underline">how rankings work</Link>, then retake.
                </p>
              )}
            </div>
          );
        })()}

        {isCoach && (
          <div className="mt-6 rounded-xl border border-brand-yellow/30 bg-brand-yellow/10 p-5 animate-[fadeIn_300ms_ease]">
            <p className="font-display uppercase tracking-widest text-brand-yellow text-xs">What this unlocks</p>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Voting influence. For verified coaches, your Coach IQ is the primary driver of how much your
              evaluation vote weighs in the TF Rankings — credible coaches move the rankings more.{" "}
              <Link href="/how-rankings-work" className="text-brand-yellow underline">See how it works</Link>.
            </p>
            <p className="mt-2 text-xs text-white/50">
              Not a verified coach yet?{" "}
              <Link href="/coaches/apply" className="text-brand-yellow/90 underline">Apply as a coach</Link>{" "}
              to put your score to work.
            </p>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {scored.results.map((r) => {
            const item = byId[r.id];
            if (!item) return null;
            const correctnessLine = (
              <p className="mt-1 text-xs">
                <span className={r.correct ? "text-green-400" : "text-red-400"}>
                  {r.correct ? "Correct" : `Your answer: ${r.chosen != null ? item.choices[r.chosen] : "—"}`}
                </span>
                {!r.correct && <span className="text-green-400"> · Answer: {item.choices[r.correct_index]}</span>}
              </p>
            );
            return (
              <div key={r.id} className={`rounded-xl border p-4 ${r.correct ? "border-green-500/40 bg-green-500/5" : "border-red-500/40 bg-red-500/5"}`}>
                <p className="text-sm font-semibold">{r.ordinal}. {item.prompt}</p>
                {correctnessLine}
                {r.explanation && (
                  // In instant mode the learner already saw each explanation, so
                  // collapse them here; in test mode this is their first read.
                  isInstant ? (
                    <details className="mt-1 group">
                      <summary className="text-xs text-white/50 cursor-pointer select-none hover:text-white/80">Explanation</summary>
                      <p className="mt-1 text-xs text-white/65">{r.explanation}</p>
                    </details>
                  ) : (
                    <p className="mt-1 text-xs text-white/65">{r.explanation}</p>
                  )
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href={`/iq/${category}`} className="rounded-full bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-sm px-6 py-3 hover:bg-brand-yellow/90 transition">Retake — beat {scored.pct.toFixed(0)}</Link>
          <button type="button" onClick={share} className="rounded-full border border-white/20 font-display uppercase tracking-widest text-sm px-6 py-3 hover:border-brand-yellow/70 transition">
            {shared ? "Copied ✓" : "Share"}
          </button>
          <Link href="/iq" className="rounded-full border border-white/20 font-display uppercase tracking-widest text-sm px-6 py-3 hover:border-brand-yellow/70 transition">All quizzes</Link>
        </div>
      </div>
    );
  }

  // --- question ---
  const chosen = answers[q.id];
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 text-brand-white min-h-[80vh] flex flex-col">
      <div className="sticky top-0 pt-2 pb-3 bg-brand-black/80 backdrop-blur z-10">
        <div className="flex justify-between text-[11px] uppercase tracking-widest text-white/60">
          <span>
            <span className="text-brand-yellow">{title}</span>
            {chunks.length > 1 && <span className="text-white/50"> · Round {prog.current}/{chunks.length}</span>}
          </span>
          <span className="flex items-center gap-3">
            {isInstant && (
              <span className="relative flex items-center gap-1 text-brand-yellow" aria-label={`Current streak ${streak}`}>
                <span aria-hidden>🔥</span>
                <span className="tabular-nums">{streak}</span>
                {bump && (
                  <span className="absolute -top-3 -right-1 text-[10px] text-brand-yellow motion-safe:animate-[popIn_500ms_ease] motion-reduce:opacity-100" aria-hidden>
                    +1
                  </span>
                )}
              </span>
            )}
            <SaveIndicator status={draft.status} />
            <span>{answeredCount}/{total}</span>
          </span>
        </div>
        <div
          className="mt-2 h-1.5 rounded bg-white/10 overflow-hidden"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={answeredCount}
          aria-label="Quiz progress"
        >
          <div className="h-full bg-brand-yellow transition-all duration-300" style={{ width: `${(answeredCount / total) * 100}%` }} />
        </div>
      </div>

      <div key={q.id} className="flex-1 flex flex-col justify-center py-8 animate-[fadeIn_240ms_ease]">
        <p className="font-display uppercase tracking-widest text-brand-yellow text-xs">Question {index + 1} of {total}</p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-semibold leading-snug">{q.prompt}</h2>
        <div className="mt-6 grid gap-3">
          {q.choices.map((c, i) => {
            const selected = chosen === i;
            let cls: string;
            if (isInstant && feedback) {
              if (i === feedback.correctIndexDisplayed) cls = "border-green-500 bg-green-500/15";
              else if (selected) cls = "border-red-500 bg-red-500/15";
              else cls = "border-white/10 opacity-60";
            } else {
              cls = selected ? "border-brand-yellow bg-brand-yellow/15" : "border-white/15 hover:border-brand-yellow/70 hover:bg-white/5";
            }
            const locked = isInstant ? (!!feedback || checking) : submitting;
            return (
              <button
                key={i}
                onClick={() => (isInstant ? chooseInstant(i) : chooseTest(i))}
                disabled={locked}
                className={`flex items-center gap-3 text-left rounded-xl px-4 py-4 border transition ${cls} ${locked ? "cursor-default" : ""}`}
              >
                <span className="shrink-0 w-7 h-7 rounded-full border border-white/30 grid place-items-center text-xs">{i + 1}</span>
                <span className="text-base">{c}</span>
              </button>
            );
          })}
        </div>

        {isInstant && checking && <p className="mt-4 text-sm text-brand-yellow">Checking…</p>}

        {isInstant && feedback && (
          <div className={`mt-5 rounded-xl border p-4 animate-[fadeIn_240ms_ease] ${feedback.correct ? "border-green-500/40 bg-green-500/5" : "border-red-500/40 bg-red-500/5"}`}>
            <p className={`text-sm font-semibold ${feedback.correct ? "text-green-400" : "text-red-400"}`}>
              {feedback.correct ? `Correct${streak > 1 ? ` · 🔥 ${streak} in a row` : ""}` : "Not quite"}
            </p>
            {feedback.explanation && <p className="mt-1 text-sm text-white/75 leading-relaxed">{feedback.explanation}</p>}
            <button
              type="button"
              onClick={continueInstant}
              className="mt-4 rounded-full bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-sm px-6 py-2.5 hover:bg-brand-yellow/90 transition"
            >
              {index + 1 >= total ? "See results" : "Continue"}
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pb-4 text-xs uppercase tracking-widest text-white/50">
        {isInstant ? (
          <span />
        ) : (
          <button onClick={() => { track("back", { itemIndex: index }); setIndex((i) => Math.max(0, i - 1)); }} disabled={index === 0} className="disabled:opacity-30">← Back</button>
        )}
        {submitting && <span className="text-brand-yellow">Scoring…</span>}
        {error && <span className="text-red-400 normal-case tracking-normal">{error}{!isInstant && <> — <button className="underline" onClick={() => submit(answers)}>retry</button></>}</span>}
        <span className="hidden sm:inline">
          {isInstant ? (feedback ? "Enter to continue" : `Press 1–${Math.min(9, q.choices.length)}`) : `Press 1–${Math.min(9, q.choices.length)} · ← → to move`}
        </span>
      </div>
    </div>
  );
}
