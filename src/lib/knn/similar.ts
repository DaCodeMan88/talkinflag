/**
 * Map a pgvector L2 distance to a 0–100 similarity score (monotonic:
 * distance 0 → 100, larger distance → lower).
 */
export function similarityScore(distance: number): number {
  if (!Number.isFinite(distance) || distance < 0) return 0;
  return Math.round((100 / (1 + distance)) * 100) / 100;
}
