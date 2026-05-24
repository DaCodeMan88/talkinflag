"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

interface Props {
  categories: string[];
  current: string | null;
}

export function BlogCategoryFilter({ categories, current }: Props) {
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

  const all = ["All", ...categories];

  return (
    <div className="flex flex-wrap gap-2 mb-10" role="group" aria-label="Filter by category">
      {all.map((cat) => {
        const isActive = cat === "All" ? !current : current === cat;
        return (
          <button
            key={cat}
            onClick={() => setCategory(cat === "All" ? null : cat)}
            className={`font-display text-xs uppercase tracking-widest px-4 py-2 border transition-colors ${
              isActive
                ? "bg-brand-yellow text-brand-black border-brand-yellow"
                : "border-brand-white/20 text-brand-white/60 hover:border-brand-yellow/50 hover:text-brand-yellow"
            }`}
            aria-pressed={isActive}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
