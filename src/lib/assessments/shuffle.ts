// Deterministic, stateless option shuffling.
//
// The server derives the permutation from a session nonce it never reveals, so
// a client cannot claim a permutation that maps its answer onto the key. Same
// nonce + same item => same order on every render and at submit time.

/** FNV-1a — small, fast, dependency-free, good enough to seed a PRNG. */
function hash32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 — deterministic PRNG in [0,1). */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Permutation of 0..length-1. `perm[displayIndex] = storedIndex`, i.e. the
 * option shown in slot i is the stored option at perm[i].
 */
export function permutationFor(nonce: string, itemId: string, length: number): number[] {
  const next = rng(hash32(`${nonce}:${itemId}`));
  const p = [...Array(length).keys()];
  for (let i = length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  return p;
}

/** Reorder options into display order. */
export function applyPermutation<T>(options: T[], perm: number[]): T[] {
  return perm.map((storedIdx) => options[storedIdx]);
}

/** Map a displayed choice index back to the stored index. -1 if out of range. */
export function invertChoice(perm: number[], displayedIndex: number): number {
  if (!Number.isInteger(displayedIndex) || displayedIndex < 0 || displayedIndex >= perm.length) return -1;
  return perm[displayedIndex];
}
