// Per-item-type scoring for the typed evaluation bank. Each function returns a
// partial dimension→points map (only the dimensions this one item touched);
// the caller accumulates them into the full fingerprint. Every function is
// pure and defensive: a malformed answer scores nothing rather than throwing.
import { ItemAnswer, isChoiceAnswer, isRankAnswer, isBudgetAnswer, ItemType } from "./item-types";

type Opt = { label?: string; dimension: string; points: number };
type TypedItem = { item_type: ItemType | string; options: Opt[]; context?: string | null };

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/** A single chosen option awards its points to its dimension (equal-points
 *  tradeoff for forced_choice; used for likert/scenario via the dispatcher). */
export function scoreForcedChoice(item: TypedItem, answer: ItemAnswer): Record<string, number> {
  if (!isChoiceAnswer(answer)) return {};
  const opt = item.options[answer];
  if (!opt || !opt.dimension) return {};
  return { [opt.dimension]: opt.points };
}

/** 100 points spread across the options → each dimension gets its share of the
 *  item's max points. Ipsative: it cannot be maxed. Normalized by the actual
 *  total allocated (so a client that doesn't sum to 100 still scores sensibly);
 *  negative/non-numeric allocations are ignored. */
export function scoreBudget(item: TypedItem, answer: ItemAnswer): Record<string, number> {
  if (!isBudgetAnswer(answer)) return {};
  const maxPoints = item.options.length ? Math.max(...item.options.map((o) => o.points)) : 0;

  // Keep every explicit non-negative allocation (including 0, which scores 0);
  // negatives and non-numbers are dropped. Only positives build the total.
  let total = 0;
  const alloc: Record<number, number> = {};
  for (const [k, v] of Object.entries(answer)) {
    const idx = Number(k);
    if (!Number.isInteger(idx) || idx < 0 || idx >= item.options.length) continue;
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0) continue;
    alloc[idx] = v;
    total += v;
  }
  if (total <= 0) return {};

  const out: Record<string, number> = {};
  for (const [idxStr, v] of Object.entries(alloc)) {
    const opt = item.options[Number(idxStr)];
    if (!opt?.dimension) continue;
    out[opt.dimension] = round3((v / total) * maxPoints);
  }
  return out;
}

/** Ordered best-first list of option indices → descending points by placement.
 *  Placement i of n gets max·(n-1-i)/(n-1). Dupes and out-of-range are dropped. */
export function scoreRank(item: TypedItem, answer: ItemAnswer): Record<string, number> {
  if (!isRankAnswer(answer)) return {};
  const n = item.options.length;
  const maxPoints = n ? Math.max(...item.options.map((o) => o.points)) : 0;

  const seen = new Set<number>();
  const order: number[] = [];
  for (const idx of answer) {
    if (!Number.isInteger(idx) || idx < 0 || idx >= n || seen.has(idx)) continue;
    seen.add(idx);
    order.push(idx);
  }
  if (order.length === 0) return {};

  const out: Record<string, number> = {};
  order.forEach((optIdx, place) => {
    const opt = item.options[optIdx];
    if (!opt?.dimension) return;
    const pts = n > 1 ? round3((maxPoints * (n - 1 - place)) / (n - 1)) : maxPoints;
    out[opt.dimension] = pts;
  });
  return out;
}

/** Dispatch an item to its scorer. likert & scenario share the index-based
 *  path (scenario just carries unequal option points). Unknown types and
 *  missing answers score nothing. */
export function scoreItem(item: TypedItem, answer: ItemAnswer): Record<string, number> {
  if (answer === undefined || answer === null) return {};
  switch (item.item_type) {
    case "likert":
    case "scenario":
    case "forced_choice":
      return scoreForcedChoice(item, answer);
    case "budget":
      return scoreBudget(item, answer);
    case "rank":
      return scoreRank(item, answer);
    default:
      return {};
  }
}
