"use client";

import Link from "next/link";
import RadarChart from "./RadarChart";
import {
  DIMENSION_KEYS,
  DIMENSION_LABELS,
  SCIENCE_KEYS,
  SCIENCE_LABELS,
  DimensionKey,
} from "@/lib/eval/dimensions";

export type EvalResult = {
  fingerprint: Record<string, number>;
  scienceRollup: Record<string, number>;
  archetype: { name: string; blurb: string };
  reference: Record<string, number>;
  role: string;
};

function topN(fp: Record<string, number>, n: number, asc = false) {
  return [...DIMENSION_KEYS]
    .sort((a, b) => (asc ? fp[a] - fp[b] : fp[b] - fp[a]))
    .slice(0, n);
}

function gapLine(fp: Record<string, number>, reference: Record<string, number>): string {
  let over: DimensionKey | null = null, overDelta = -Infinity;
  let under: DimensionKey | null = null, underDelta = Infinity;
  for (const k of DIMENSION_KEYS) {
    const ref = reference[`dim.${k}`];
    if (ref === undefined) continue;
    const d = fp[k] - ref;
    if (d > overDelta) { overDelta = d; over = k; }
    if (d < underDelta) { underDelta = d; under = k; }
  }
  if (!over || !under) return "";
  return `Compared with what elite-performance research says separates champions, you lean hardest on ${DIMENSION_LABELS[over]} and weight ${DIMENSION_LABELS[under]} the least relative to its proven importance.`;
}

export default function PerspectiveSummary({ result }: { result: EvalResult }) {
  const fp = result.fingerprint;
  const axes = DIMENSION_KEYS.map((k) => DIMENSION_LABELS[k].split(" ")[0]);
  const memberVals = DIMENSION_KEYS.map((k) => fp[k] ?? 0);
  const idealVals = DIMENSION_KEYS.map((k) => result.reference[`dim.${k}`] ?? 0);
  const top3 = topN(fp, 3);
  const bottom2 = topN(fp, 2, true);
  const roleNote =
    result.role === "player"
      ? "Taken for your own insight — players don't carry poll weight."
      : `This shapes the ${result.role[0].toUpperCase() + result.role.slice(1)} Poll.`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-brand-white">
      <p className="font-display uppercase tracking-widest text-brand-yellow text-sm">Your Perspective</p>
      <h1 className="font-display uppercase tracking-widest text-4xl sm:text-5xl mt-2">{result.archetype.name}</h1>
      <p className="mt-3 text-white/80 text-lg">{result.archetype.blurb}</p>
      <p className="mt-2 text-xs uppercase tracking-widest text-brand-yellow/80">{roleNote}</p>

      <div className="mt-8 rounded-2xl bg-brand-gray border border-white/10 p-5">
        <RadarChart
          axes={axes}
          max={10}
          series={[
            { values: idealVals, stroke: "#555555", fill: "rgba(120,120,120,0.12)", label: "Elite ideal" },
            { values: memberVals, stroke: "#FDDD58", fill: "rgba(253,221,88,0.25)", label: "You" },
          ]}
        />
        <div className="flex justify-center gap-6 text-xs uppercase tracking-widest mt-1">
          <span className="text-brand-yellow">● You</span>
          <span className="text-white/50">● Elite ideal</span>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mt-6">
        <div className="rounded-xl bg-brand-gray border border-white/10 p-4">
          <p className="font-display uppercase tracking-widest text-brand-yellow text-xs">You value most</p>
          <ul className="mt-2 space-y-1">
            {top3.map((k) => (
              <li key={k} className="flex justify-between text-sm">
                <span>{DIMENSION_LABELS[k]}</span>
                <span className="text-brand-yellow">{fp[k]?.toFixed(1)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-brand-gray border border-white/10 p-4">
          <p className="font-display uppercase tracking-widest text-white/60 text-xs">You weight least</p>
          <ul className="mt-2 space-y-1">
            {bottom2.map((k) => (
              <li key={k} className="flex justify-between text-sm">
                <span>{DIMENSION_LABELS[k]}</span>
                <span className="text-white/50">{fp[k]?.toFixed(1)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-brand-gray border border-white/10 p-4">
        <p className="font-display uppercase tracking-widest text-brand-yellow text-xs">The biopsychosocial read</p>
        <div className="mt-3 space-y-2">
          {SCIENCE_KEYS.map((s) => {
            const v = result.scienceRollup[s] ?? 0;
            return (
              <div key={s} className="flex items-center gap-3">
                <span className="w-44 shrink-0 text-[11px] text-white/70">{SCIENCE_LABELS[s]}</span>
                <div className="flex-1 h-2 rounded bg-white/10 overflow-hidden">
                  <div className="h-full bg-brand-yellow" style={{ width: `${(v / 10) * 100}%` }} />
                </div>
                <span className="w-8 text-right text-xs text-brand-yellow">{v.toFixed(1)}</span>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-sm text-white/75">{gapLine(fp, result.reference)}</p>
        <p className="mt-2 text-[11px] text-white/40">
          Benchmarked against the Biopsychosocial Architecture of Elite Athletic Performance (Talkin Flag research) — at the
          highest level, coping and game intelligence separate champions more than physical tools.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/evaluate?retake=1" className="rounded-full bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-sm px-6 py-3">
          Retake
        </Link>
        <Link href="/dashboard" className="rounded-full border border-white/20 text-brand-white font-display uppercase tracking-widest text-sm px-6 py-3">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
