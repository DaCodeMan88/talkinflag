"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

interface Props {
  categories: string[];
  current: string | null;
  counts?: Record<string, number>;
  total?: number;
}

export function BlogCategoryFilter({ categories, current, counts, total }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setCategory = useCallback(
    (cat: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (cat) {
        params.set("category", cat);
      } else {
        params.delete("category");
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="flex flex-wrap gap-2 mb-10" role="group" aria-label="Filter by category">
      {/* All pill */}
      <button
        onClick={() => setCategory(null)}
        className={`font-display text-xs uppercase tracking-widest px-4 py-2 border transition-colors flex items-center gap-2 ${
          !current
            ? "bg-brand-yellow text-brand-black border-brand-yellow"
            : "border-brand-white/20 text-brand-white/60 hover:border-brand-yellow/50 hover:text-brand-yellow"
        }`}
        aria-pressed={!current}
      >
        All
        {total != null && (
          <span className={`text-[10px] tabular-nums ${!current ? "opacity-60" : "opacity-40"}`}>
            {total}
          </span>
        )}
      </button>

      {/* Category pills */}
      {categories.map((cat) => {
        const isActive = current === cat;
        const count = counts?.[cat];
        return (
          <button
            key={cat}
            onClick={() => setCategory(isActive ? null : cat)}
            className={`font-display text-xs uppercase tracking-widest px-4 py-2 border transition-colors flex items-center gap-2 ${
              isActive
                ? "bg-brand-yellow text-brand-black border-brand-yellow"
                : "border-brand-white/20 text-brand-white/60 hover:border-brand-yellow/50 hover:text-brand-yellow"
            }`}
            aria-pressed={isActive}
          >
            {cat}
            {count != null && (
              <span className={`text-[10px] tabular-nums ${isActive ? "opacity-60" : "opacity-40"}`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
