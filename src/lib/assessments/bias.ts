/**
 * Answer-key bias audit primitives.
 *
 * Pure, dependency-free functions that expose two common multiple-choice
 * answer-key exploits:
 *   - position bias: the correct answer clusters at one index.
 *   - longest-choice bias: the correct answer is the longest string.
 *
 * None of these touch the DB or env — they operate on in-memory question data.
 */

export interface BiasQuestion {
  choices: string[];
  correct_index: number;
  /** Optional 1-based ordinal used for reporting; falls back to array index. */
  ordinal?: number;
}

export interface PositionBiasResult {
  /** counts[i] = number of questions whose correct_index === i. */
  counts: number[];
  /** max(counts) / total, or 0 if empty. */
  maxShare: number;
}

/**
 * Tally how often the correct answer lands at each choice index.
 * The counts array is sized to the maximum choices length across the set.
 */
export function positionBias(questions: BiasQuestion[]): PositionBiasResult {
  const total = questions.length;
  if (total === 0) return { counts: [], maxShare: 0 };

  const width = Math.max(...questions.map((q) => q.choices.length));
  const counts = new Array<number>(width).fill(0);

  for (const q of questions) {
    if (q.correct_index >= 0 && q.correct_index < width) {
      counts[q.correct_index] += 1;
    }
  }

  const maxShare = Math.max(...counts) / total;
  return { counts, maxShare };
}

export interface LongestChoiceBiasResult {
  /** Count where the correct choice is the strictly-longest string. */
  hits: number;
  /** hits / total, or 0 if empty. */
  share: number;
  /**
   * Ordinals (or 0-based index) of questions where the correct choice is
   * strictly longest AND its length >= 1.5x the mean length of the distractors.
   */
  flagged: number[];
}

/**
 * Count how often the correct choice is the strictly-longest string in its set,
 * and flag the egregious cases (correct choice >= 1.5x the mean distractor length).
 */
export function longestChoiceBias(questions: BiasQuestion[]): LongestChoiceBiasResult {
  const total = questions.length;
  if (total === 0) return { hits: 0, share: 0, flagged: [] };

  let hits = 0;
  const flagged: number[] = [];

  questions.forEach((q, i) => {
    const correct = q.choices[q.correct_index];
    if (correct === undefined) return;

    const correctLen = correct.length;
    const others = q.choices.filter((_, idx) => idx !== q.correct_index);
    const maxOther = others.length > 0 ? Math.max(...others.map((c) => c.length)) : -Infinity;

    // A hit means the correct answer is the longest choice by a *meaningful*
    // margin: strictly longer than every distractor, and more than a single
    // character longer than the next-longest. A one-character edge is not a
    // real "the longest answer is correct" tell, so it does not count. (On the
    // shipping banks every genuine longest-is-correct question wins by >= 4
    // chars, so this margin does not change the audited share.)
    const meaningfullyLongest = correctLen - maxOther >= 2;
    if (!meaningfullyLongest) return;

    hits += 1;

    const meanOther =
      others.length > 0
        ? others.reduce((sum, c) => sum + c.length, 0) / others.length
        : 0;

    if (correctLen >= 1.5 * meanOther) {
      flagged.push(q.ordinal ?? i);
    }
  });

  return { hits, share: hits / total, flagged };
}

/**
 * Chi-square statistic against a uniform expectation.
 * Σ (o − e)² / e, where e = sum(counts) / counts.length.
 * Returns 0 if the total is 0 or counts is empty.
 */
export function chiSquareUniform(counts: number[]): number {
  const n = counts.length;
  if (n === 0) return 0;

  const total = counts.reduce((sum, c) => sum + c, 0);
  if (total === 0) return 0;

  const expected = total / n;
  return counts.reduce((chi, o) => chi + Math.pow(o - expected, 2) / expected, 0);
}
