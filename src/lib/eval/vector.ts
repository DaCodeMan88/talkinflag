// Shared vector helpers for evaluation scoring.

export function euclidean(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    sum += d * d;
  }
  return Math.sqrt(sum);
}

/** Mean-center a vector — strips overall magnitude, keeps relative emphasis. */
export function center(a: number[]): number[] {
  const mean = a.reduce((x, y) => x + y, 0) / (a.length || 1);
  return a.map((v) => v - mean);
}

/** Cosine similarity in [-1,1]. Returns 0 if either vector is degenerate. */
export function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += (a[i] ?? 0) * (b[i] ?? 0);
    na += (a[i] ?? 0) ** 2;
    nb += (b[i] ?? 0) ** 2;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** Spread of a vector — how much emphasis it actually expresses. */
export function stdev(a: number[]): number {
  const mean = a.reduce((x, y) => x + y, 0) / (a.length || 1);
  return Math.sqrt(a.reduce((s, v) => s + (v - mean) ** 2, 0) / (a.length || 1));
}
