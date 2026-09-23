"use client";
import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AccordionItem {
  question: string;
  answer: React.ReactNode;
}

/**
 * Single-open accordion. Height animates via the grid-template-rows 0fr→1fr
 * trick (no fixed max-height, so long answers never clip). Closed panels are
 * `inert` so links inside them drop out of the tab order.
 */
export function Accordion({ items }: { items: AccordionItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const baseId = useId();
  return (
    <div className="divide-y divide-brand-white/10 border-t border-b border-brand-white/10">
      {items.map((item, i) => {
        const open = openIndex === i;
        const buttonId = `${baseId}-q${i}`;
        const panelId = `${baseId}-a${i}`;
        return (
          <div key={item.question}>
            <h3>
              <button
                id={buttonId}
                type="button"
                onClick={() => setOpenIndex(open ? null : i)}
                aria-expanded={open}
                aria-controls={panelId}
                className="w-full flex items-center justify-between gap-4 py-5 text-left group"
              >
                <span className="font-display uppercase tracking-wide text-brand-white group-hover:text-brand-yellow transition-colors">
                  {item.question}
                </span>
                <ChevronDown
                  size={20}
                  aria-hidden="true"
                  className={cn("text-brand-yellow transition-transform duration-300 shrink-0", open && "rotate-180")}
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              inert={!open}
              className={cn(
                "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
                open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <div className="pb-5 text-brand-white/60 leading-relaxed">{item.answer}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
