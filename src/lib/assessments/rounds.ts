/**
 * Pure helpers for chunking an assessment into named ROUNDS.
 *
 * An "eval" carries a per-item `round` number, so its chunks come from the data
 * (`chunkByRound`). An "IQ" quiz has no per-item round data, so we split it into
 * fixed-size runs (`fixedChunks`). Both produce the same `RoundChunk[]` shape,
 * which the runner/CheckpointScreen consume identically.
 */

export type RoundChunk = { round: number; start: number; end: number };

/**
 * Given each item's round number in item order, return the item indices at
 * which a NEW round begins AFTER the first — i.e. every `i` where
 * `rounds[i] !== rounds[i - 1]`.
 *
 * e.g. [1,1,2,2,3] -> [2,4]
 */
export function roundBoundaries(rounds: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < rounds.length; i++) {
    if (rounds[i] !== rounds[i - 1]) out.push(i);
  }
  return out;
}

/**
 * Collapse a per-item round array into contiguous runs. `end` is exclusive.
 *
 * e.g. [1,1,2] -> [{round:1,start:0,end:2},{round:2,start:2,end:3}]
 */
export function chunkByRound(rounds: number[]): RoundChunk[] {
  if (rounds.length === 0) return [];
  const chunks: RoundChunk[] = [];
  let start = 0;
  for (let i = 1; i <= rounds.length; i++) {
    if (i === rounds.length || rounds[i] !== rounds[start]) {
      chunks.push({ round: rounds[start], start, end: i });
      start = i;
    }
  }
  return chunks;
}

/**
 * Where a flat item `index` sits relative to the rounds: the 1-based current
 * round, the total number of rounds, and the position within that round.
 * An out-of-range index clamps to the last round.
 */
export function roundProgress(
  index: number,
  chunks: RoundChunk[]
): { current: number; total: number; withinIndex: number; withinTotal: number } {
  const total = chunks.length;
  if (total === 0) return { current: 1, total: 1, withinIndex: 0, withinTotal: 0 };
  let ci = chunks.findIndex((c) => index >= c.start && index < c.end);
  if (ci === -1) ci = total - 1; // clamp out-of-range to the last round
  const chunk = chunks[ci];
  const clampedIndex = Math.min(Math.max(index, chunk.start), chunk.end - 1);
  return {
    current: ci + 1,
    total,
    withinIndex: clampedIndex - chunk.start,
    withinTotal: chunk.end - chunk.start,
  };
}

/**
 * Split `total` items into fixed-size rounds of `size` (the last may be short).
 * Used for IQ quizzes, which carry no per-item round data.
 *
 * e.g. total=40,size=10 -> 4 chunks; total=32,size=8 -> 4 chunks.
 */
export function fixedChunks(total: number, size: number): RoundChunk[] {
  const chunks: RoundChunk[] = [];
  if (total <= 0 || size <= 0) return chunks;
  let round = 1;
  for (let start = 0; start < total; start += size) {
    chunks.push({ round, start, end: Math.min(start + size, total) });
    round++;
  }
  return chunks;
}
