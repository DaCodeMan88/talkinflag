"use client";

import type { ItemComponentProps } from "./types";

/**
 * Forced choice — pick one of a few options. Big tappable cards, NO numeric
 * scale, no "how much" language. Auto-advances on tap.
 */
export default function ForcedChoiceItem({ item, value, onChange, onCommit, disabled }: ItemComponentProps) {
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
            className={`text-left rounded-xl px-5 py-5 border transition ${
              isSel
                ? "border-brand-yellow bg-brand-yellow/15"
                : "border-white/15 hover:border-brand-yellow/70 hover:bg-white/5"
            }`}
          >
            <span className="text-base sm:text-lg leading-snug">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
