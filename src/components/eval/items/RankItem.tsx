"use client";

import { useMemo } from "react";
import type { ItemComponentProps } from "./types";
import { move, togglePlace } from "./rank-logic";

/**
 * Rank — order the options best-first. Tap a row to place / un-place it; use the
 * ▲/▼ buttons or ArrowUp/ArrowDown (when a placed row is focused) to reorder.
 * No HTML5 drag-and-drop (unreliable on touch). Emits number[] via onChange;
 * Continue (enabled once at least one option is ranked) calls onCommit.
 */
export default function RankItem({ item, value, onChange, onCommit, disabled }: ItemComponentProps) {
  const order = useMemo<number[]>(() => (Array.isArray(value) ? value : []), [value]);

  const placeAt = (optionIndex: number) => order.indexOf(optionIndex); // -1 if unplaced

  const toggle = (optionIndex: number) => {
    onChange(togglePlace(order, optionIndex));
  };

  const shift = (optionIndex: number, dir: -1 | 1) => {
    const pos = order.indexOf(optionIndex);
    if (pos === -1) return;
    onChange(move(order, pos, dir));
  };

  return (
    <div className="mt-6">
      <p className="text-xs uppercase tracking-widest text-white/50">
        Tap to rank · use ▲ ▼ to reorder
      </p>
      <div className="mt-3 grid gap-2">
        {item.options.map((o, i) => {
          const pos = placeAt(i);
          const placed = pos !== -1;
          return (
            <div
              key={i}
              tabIndex={placed ? 0 : -1}
              onKeyDown={(e) => {
                if (!placed) return;
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  shift(i, -1);
                } else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  shift(i, 1);
                }
              }}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 border transition min-w-0 outline-none focus:ring-2 focus:ring-brand-yellow/60 ${
                placed
                  ? "border-brand-yellow bg-brand-yellow/10"
                  : "border-white/15 hover:border-brand-yellow/70 hover:bg-white/5"
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(i)}
                disabled={disabled}
                className="flex flex-1 items-center gap-3 text-left min-w-0"
              >
                <span
                  className={`shrink-0 w-7 h-7 rounded-full grid place-items-center text-xs ${
                    placed
                      ? "bg-brand-yellow text-brand-black font-display"
                      : "border border-white/30 text-white/50"
                  }`}
                >
                  {placed ? pos + 1 : "+"}
                </span>
                <span className="text-sm sm:text-base min-w-0 break-words">{o.label}</span>
              </button>
              {placed && (
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => shift(i, -1)}
                    disabled={disabled || pos === 0}
                    aria-label={`Move ${o.label} up`}
                    className="w-8 h-8 rounded-lg border border-white/20 grid place-items-center disabled:opacity-25 hover:border-white/50"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => shift(i, 1)}
                    disabled={disabled || pos === order.length - 1}
                    aria-label={`Move ${o.label} down`}
                    className="w-8 h-8 rounded-lg border border-white/20 grid place-items-center disabled:opacity-25 hover:border-white/50"
                  >
                    ▼
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onCommit}
        disabled={disabled || order.length === 0}
        className="mt-5 w-full rounded-full bg-brand-yellow text-brand-black font-display uppercase tracking-widest px-8 py-3 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </div>
  );
}
