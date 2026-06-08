export type IqQuestion = { id?: string; ordinal?: number; correct_index: number; points: number };

/**
 * Score a Flag IQ attempt from the answer key. `answers` maps a question key
 * (id or ordinal) to the chosen choice index. Returns raw points, max points,
 * and the percentage (0–100, two decimals) — the published IQ.
 */
export function scoreAttempt(
  questions: IqQuestion[],
  answers: Record<string, number>
): { raw: number; max: number; pct: number } {
  let raw = 0;
  let max = 0;
  for (const q of questions) {
    max += q.points;
    const key = String(q.id ?? q.ordinal);
    if (answers[key] === q.correct_index) raw += q.points;
  }
  const pct = max > 0 ? Math.round((raw / max) * 100 * 100) / 100 : 0;
  return { raw, max, pct };
}
