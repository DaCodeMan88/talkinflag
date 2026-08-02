"use client";

import { useEffect, useRef } from "react";

/**
 * The short "breather" screen shown between rounds of an assessment. Calm,
 * centered, on-brand. Auto-advances after 4s UNLESS the user prefers reduced
 * motion, in which case the tap is required.
 */
export default function CheckpointScreen({
  roundName,
  roundNumber,
  totalRounds,
  earnedLine,
  estSecondsLeft,
  onContinue,
}: {
  roundName: string;
  roundNumber: number;
  totalRounds: number;
  earnedLine: string;
  estSecondsLeft: number | null;
  onContinue: () => void;
}) {
  // Keep the latest onContinue without re-arming the timer each render.
  const onContinueRef = useRef(onContinue);
  onContinueRef.current = onContinue;

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return; // require the tap — no auto-advance
    const t = setTimeout(() => onContinueRef.current(), 4000);
    return () => clearTimeout(t);
  }, []);

  const mmss = formatSeconds(estSecondsLeft);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-brand-white text-center min-h-[70vh] flex flex-col items-center justify-center animate-[fadeIn_300ms_ease]">
      <p className="font-display uppercase tracking-widest text-brand-yellow text-xs">
        Round {roundNumber} of {totalRounds} done
      </p>
      <h2 className="mt-3 font-display uppercase tracking-widest text-4xl sm:text-5xl leading-none">
        {roundName}
      </h2>

      {/* progress ribbon — filled pips for completed rounds */}
      <div className="mt-6 flex items-center justify-center gap-2" aria-label={`${roundNumber} of ${totalRounds} rounds complete`}>
        {Array.from({ length: totalRounds }).map((_, i) => (
          <span
            key={i}
            className={`h-2 w-8 rounded-full transition-colors ${i < roundNumber ? "bg-brand-yellow" : "bg-white/15"}`}
          />
        ))}
      </div>

      <p className="mt-6 text-white/80">{earnedLine}</p>
      {mmss && <p className="mt-1 text-sm text-white/45">~{mmss} left</p>}

      <button
        onClick={onContinue}
        className="mt-8 rounded-full bg-brand-yellow text-brand-black font-display uppercase tracking-widest px-10 py-4 hover:bg-brand-yellow/90 transition"
      >
        Continue
      </button>
    </div>
  );
}

function formatSeconds(total: number | null): string | null {
  if (total == null || !Number.isFinite(total) || total <= 0) return null;
  const s = Math.round(total);
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm}:${String(ss).padStart(2, "0")}`;
}
