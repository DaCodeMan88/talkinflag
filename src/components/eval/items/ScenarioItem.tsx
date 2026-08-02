"use client";

import type { ItemComponentProps } from "./types";

/**
 * Scenario — a short situational setup (item.context) rendered in a distinct
 * panel above the prompt, then forced-choice-style option cards. Auto-advances.
 */
export default function ScenarioItem({ item, value, onChange, onCommit, disabled }: ItemComponentProps) {
  const selected = typeof value === "number" ? value : null;
  const tap = (i: number) => {
    onChange(i);
    onCommit();
  };
  return (
    <div>
      {item.context && (
        <div className="mt-4 border-l-2 border-brand-yellow/60 pl-4 text-white/70 italic">
          {item.context}
        </div>
      )}
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
    </div>
  );
}
