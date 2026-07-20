// Client-side pagination for ranking/player lists (batches of 25 per owner request).

export const PAGE_SIZE = 25;

export function pageCount(total: number, perPage: number = PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / perPage));
}

export function paginate<T>(items: T[], page: number, perPage: number = PAGE_SIZE): T[] {
  const last = pageCount(items.length, perPage);
  const p = Math.min(Math.max(1, page), last);
  return items.slice((p - 1) * perPage, p * perPage);
}

export function pageRangeLabel(page: number, perPage: number, total: number): string {
  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);
  return `${start}–${end}`;
}
