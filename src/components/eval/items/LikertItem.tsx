"use client";

import type { ItemComponentProps } from "./types";

/** Likert / agreement scale — 5-ish tappable options with a numbered badge. */
export default function LikertItem({ item, value, onChange, onCommit, disabled }: ItemComponentProps) {
  const selected = typeof value === "number" ? value : null;
  const tap = (i: number) => {
    onChange(i);
    onCommit();
  };
  return (
    <div className="mt-6 grid gap-3">
      {item.options.map((o, i) => {
        const isSel = selected === i;
        return (
          <button
            key={i}
            onClick={() => tap(i)}
            disabled={disabled}
            className={`flex items-center gap-3 text-left rounded-xl px-4 py-4 border transition ${
              isSel
                ? "border-brand-yellow bg-brand-yellow/15"
                : "border-white/15 hover:border-brand-yellow/70 hover:bg-white/5"
            }`}
          >
            <span className="shrink-0 w-7 h-7 rounded-full border border-white/30 grid place-items-center text-xs">
              {i + 1}
            </span>
            <span className="text-base">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
