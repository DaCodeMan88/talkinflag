"use client";
import { pageCount, pageRangeLabel } from "@/lib/pagination";

interface PaginatorProps {
  total: number;
  page: number;
  perPage: number;
  onPageChange: (page: number) => void;
  /** e.g. "players" — used in the aria-label + range summary */
  itemNoun?: string;
}

export function Paginator({ total, page, perPage, onPageChange, itemNoun = "players" }: PaginatorProps) {
  const pages = pageCount(total, perPage);
  if (pages <= 1) return null;
  return (
    <nav aria-label={`Pagination for ${itemNoun}`} className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="font-display text-xs uppercase tracking-widest px-3 py-1.5 border border-brand-white/20 text-brand-white/60 hover:border-brand-white/40 hover:text-brand-white transition-colors disabled:opacity-30 disabled:pointer-events-none"
      >
        ← Prev
      </button>
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          aria-current={p === page ? "page" : undefined}
          title={pageRangeLabel(p, perPage, total)}
          className={`font-display text-xs uppercase tracking-widest px-3 py-1.5 transition-colors tabular-nums ${
            p === page
              ? "bg-brand-yellow text-brand-black"
              : "border border-brand-white/20 text-brand-white/60 hover:border-brand-white/40 hover:text-brand-white"
          }`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pages}
        className="font-display text-xs uppercase tracking-widest px-3 py-1.5 border border-brand-white/20 text-brand-white/60 hover:border-brand-white/40 hover:text-brand-white transition-colors disabled:opacity-30 disabled:pointer-events-none"
      >
        Next →
      </button>
      <span className="basis-full text-center text-brand-white/30 text-[11px] mt-1">
        Showing {pageRangeLabel(page, perPage, total)} of {total}
      </span>
    </nav>
  );
}
