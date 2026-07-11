import Link from "next/link";
import ShowAroundButton from "./ShowAroundButton";

export type ChecklistItem = {
  label: string;
  done: boolean;
  href: string;
  cta: string;
  /** Optional link shown after the item is done (e.g. "View results"). */
  doneHref?: string;
  doneCta?: string;
};

export default function OnboardingChecklist({
  items,
  tourId = "member",
}: {
  items: ChecklistItem[];
  tourId?: string;
}) {
  const doneCount = items.filter((i) => i.done).length;
  const pct = Math.round((doneCount / items.length) * 100);
  const allDone = doneCount === items.length;

  return (
    <div data-tour="checklist" className="bg-[#0d0d0d] border border-brand-white/10 p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display text-xl uppercase text-brand-white">Getting Started</h2>
        <ShowAroundButton tourId={tourId} />
      </div>
      <p className="text-brand-white/30 text-xs mb-4">
        {allDone ? "You're all set — nicely done." : `${doneCount} of ${items.length} done`}
      </p>

      <div className="h-1 bg-brand-white/10 rounded-full overflow-hidden mb-5">
        <div className="h-full bg-brand-yellow transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>

      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item.label} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={`flex items-center justify-center w-5 h-5 rounded-full text-[11px] shrink-0 ${
                  item.done
                    ? "bg-brand-yellow text-brand-black"
                    : "border border-brand-white/20 text-transparent"
                }`}
                aria-hidden="true"
              >
                ✓
              </span>
              <span className={`text-sm truncate ${item.done ? "text-brand-white/40 line-through" : "text-brand-white/80"}`}>
                {item.label}
              </span>
            </div>
            {!item.done ? (
              <Link
                href={item.href}
                className="text-brand-yellow text-xs font-display uppercase tracking-widest hover:text-brand-yellow/80 transition-colors shrink-0"
              >
                {item.cta} →
              </Link>
            ) : item.doneHref && (
              <Link
                href={item.doneHref}
                className="text-brand-white/40 text-xs font-display uppercase tracking-widest hover:text-brand-yellow transition-colors shrink-0"
              >
                {item.doneCta ?? "View"} →
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
