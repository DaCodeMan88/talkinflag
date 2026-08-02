/**
 * Pure helpers for the rank item type. No DOM, fully unit-tested.
 * `order` is a list of option indices, best-first.
 */

/**
 * Swap the element at `from` with its neighbour in direction `dir`
 * (-1 = up/earlier, +1 = down/later). No-op at the ends or out of range.
 */
export function move(order: number[], from: number, dir: -1 | 1): number[] {
  const to = from + dir;
  if (from < 0 || from >= order.length) return order.slice();
  if (to < 0 || to >= order.length) return order.slice();
  const next = order.slice();
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

/**
 * Tap-to-place / tap-to-remove: if `optionIndex` is not in `order`, append it;
 * if it is, remove it. Returns a new array.
 */
export function togglePlace(order: number[], optionIndex: number): number[] {
  const at = order.indexOf(optionIndex);
  if (at === -1) return [...order, optionIndex];
  return order.filter((i) => i !== optionIndex);
}
