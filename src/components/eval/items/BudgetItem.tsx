"use client";

import { useMemo } from "react";
import type { ItemComponentProps } from "./types";
import { remaining, splitEvenly, clampAllocation } from "./budget-logic";

/**
 * Budget — distribute 100 points across the options with a slider each.
 * Emits a Record<string, number> alloc via onChange; Continue (enabled only
 * when exactly 0 points remain) calls onCommit. Stacks vertically at 375px.
 */
export default function BudgetItem({ item, value, onChange, onCommit, disabled }: ItemComponentProps) {
  const n = item.options.length;
  const alloc = useMemo<Record<string, number>>(
    () => (value && typeof value === "object" && !Array.isArray(value) ? value : {}),
    [value]
  );
  const left = remaining(alloc);

  const setAt = (i: number, raw: number) => {
    onChange(clampAllocation(alloc, i, raw, n));
  };

  return (
    <div className="mt-6">
      <div className="grid gap-4">
        {item.options.map((o, i) => {
          const v = typeof alloc[String(i)] === "number" ? alloc[String(i)] : 0;
          return (
            <div key={i} className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 min-w-0">
              <div className="flex items-baseline justify-between gap-3 min-w-0">
                <span className="text-sm sm:text-base min-w-0 break-words">{o.label}</span>
                <span className="shrink-0 font-display tabular-nums text-brand-yellow text-lg">{v}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={v}
                disabled={disabled}
                aria-label={`Points for ${o.label}`}
                onChange={(e) => setAt(i, Number(e.target.value))}
                className="mt-2 w-full accent-brand-yellow"
              />
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <span
          className={`font-display uppercase tracking-widest text-sm ${
            left === 0 ? "text-brand-yellow" : "text-white/70"
          }`}
        >
          {left} of 100 left
        </span>
        <button
          type="button"
          onClick={() => onChange(splitEvenly(n))}
          disabled={disabled}
          className="text-xs uppercase tracking-widest text-white/60 underline hover:text-white/90"
        >
          Split evenly
        </button>
      </div>

      <button
        type="button"
        onClick={onCommit}
        disabled={disabled || left !== 0}
        className="mt-5 w-full rounded-full bg-brand-yellow text-brand-black font-display uppercase tracking-widest px-8 py-3 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </div>
  );
}
