"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

export type IQItem = { id: string; ordinal: number; prompt: string; choices: string[] };
type Result = { id: string; ordinal: number; correct_index: number; chosen: number | null; correct: boolean; explanation: string | null };

export default function IQQuizRunner({
  category,
  title,
  questions,
}: {
  category: string;
  title: string;
  questions: IQItem[];
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scored, setScored] = useState<{ pct: number; raw: number; max: number; results: Result[] } | null>(null);

  const total = questions.length;
  const q = questions[index];
  const answeredCount = Object.keys(answers).length;
  const byId = useMemo(() => Object.fromEntries(questions.map((x) => [x.id, x])), [questions]);

  const submit = useCallback(async (finalAnswers: Record<string, number>) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/iq/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, answers: finalAnswers }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Submission failed");
      const data = await res.json();
      setScored({ pct: data.score_pct, raw: data.raw, max: data.max, results: data.results });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }, [category]);

  const choose = useCallback((choiceIdx: number) => {
    if (!q) return;
    const next = { ...answers, [q.id]: choiceIdx };
    setAnswers(next);
    setTimeout(() => {
      if (index + 1 >= total) submit(next);
      else setIndex((i) => i + 1);
    }, 150);
  }, [q, answers, index, total, submit]);

  useEffect(() => {
    if (scored) return;
    const onKey = (e: KeyboardEvent) => {
      if (q && e.key >= "1" && e.key <= String(Math.min(9, q.choices.length))) choose(Number(e.key) - 1);
      else if (e.key === "ArrowLeft" && index > 0) setIndex((i) => i - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [q, index, scored, choose]);

  // --- results screen ---
  if (scored) {
    const grade = scored.pct >= 85 ? "Elite" : scored.pct >= 70 ? "Sharp" : scored.pct >= 50 ? "Solid" : "Rookie";
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-brand-white">
        <p className="font-display uppercase tracking-widest text-brand-yellow text-sm">{title}</p>
        <h1 className="font-display uppercase tracking-widest text-5xl mt-2">{scored.pct.toFixed(0)}<span className="text-2xl text-white/50"> / 100</span></h1>
        <p className="mt-1 text-white/80">Flag Football IQ: <span className="text-brand-yellow">{grade}</span> · {scored.raw}/{scored.max} correct</p>

        <div className="mt-6 space-y-3">
          {scored.results.map((r) => {
            const item = byId[r.id];
            if (!item) return null;
            return (
              <div key={r.id} className={`rounded-xl border p-4 ${r.correct ? "border-green-500/40 bg-green-500/5" : "border-red-500/40 bg-red-500/5"}`}>
                <p className="text-sm font-semibold">{r.ordinal}. {item.prompt}</p>
                <p className="mt-1 text-xs">
                  <span className={r.correct ? "text-green-400" : "text-red-400"}>
                    {r.correct ? "Correct" : `Your answer: ${r.chosen != null ? item.choices[r.chosen] : "—"}`}
                  </span>
                  {!r.correct && <span className="text-green-400"> · Answer: {item.choices[r.correct_index]}</span>}
                </p>
                {r.explanation && <p className="mt-1 text-xs text-white/65">{r.explanation}</p>}
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`/iq/${category}`} className="rounded-full bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-sm px-6 py-3">Retake</Link>
          <Link href="/iq" className="rounded-full border border-white/20 font-display uppercase tracking-widest text-sm px-6 py-3">All quizzes</Link>
        </div>
      </div>
    );
  }

  // --- question ---
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 text-brand-white min-h-[80vh] flex flex-col">
      <div className="sticky top-0 pt-2 pb-3 bg-brand-black/80 backdrop-blur">
        <div className="flex justify-between text-[11px] uppercase tracking-widest text-white/60">
          <span className="text-brand-yellow">{title}</span>
          <span>{answeredCount}/{total}</span>
        </div>
        <div className="mt-2 h-1.5 rounded bg-white/10 overflow-hidden">
          <div className="h-full bg-brand-yellow transition-all duration-300" style={{ width: `${(answeredCount / total) * 100}%` }} />
        </div>
      </div>

      <div key={q.id} className="flex-1 flex flex-col justify-center py-8 animate-[fadeIn_240ms_ease]">
        <p className="font-display uppercase tracking-widest text-brand-yellow text-xs">Question {index + 1} of {total}</p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-semibold leading-snug">{q.prompt}</h2>
        <div className="mt-6 grid gap-3">
          {q.choices.map((c, i) => {
            const selected = answers[q.id] === i;
            return (
              <button key={i} onClick={() => choose(i)} disabled={submitting}
                className={`flex items-center gap-3 text-left rounded-xl px-4 py-4 border transition ${selected ? "border-brand-yellow bg-brand-yellow/15" : "border-white/15 hover:border-brand-yellow/70 hover:bg-white/5"}`}>
                <span className="shrink-0 w-7 h-7 rounded-full border border-white/30 grid place-items-center text-xs">{i + 1}</span>
                <span className="text-base">{c}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between items-center pb-4 text-xs uppercase tracking-widest text-white/50">
        <button onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} className="disabled:opacity-30">← Back</button>
        {submitting && <span className="text-brand-yellow">Scoring…</span>}
        {error && <span className="text-red-400 normal-case tracking-normal">{error} — <button className="underline" onClick={() => submit(answers)}>retry</button></span>}
        <span>Press 1–{Math.min(4, q.choices.length)}</span>
      </div>
    </div>
  );
}
