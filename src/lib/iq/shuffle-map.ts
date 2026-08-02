// Maps between stored option order (the answer key's space) and the per-attempt
// displayed order derived from a session nonce. The submit route lives or dies
// on getting this direction right, so it is pure and unit-tested.
import { permutationFor, applyPermutation, invertChoice } from "@/lib/assessments/shuffle";

export type ShuffleQuestion = { id: string; choices: string[] };

/** Public question with choices reordered into this attempt's display order. */
export function shuffleChoices<Q extends ShuffleQuestion>(q: Q, nonce: string): Q {
  const perm = permutationFor(nonce, q.id, q.choices.length);
  return { ...q, choices: applyPermutation(q.choices, perm) };
}

/**
 * Convert a map of {questionId: displayedIndex} (what the client submits after
 * seeing shuffled choices) into {questionId: storedIndex} (the answer key's
 * space, what scoreAttempt expects). An out-of-range displayed index is dropped.
 */
export function toStoredAnswers(
  questions: { id: string; choices: string[] }[],
  nonce: string,
  submitted: Record<string, number>
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const q of questions) {
    const displayed = submitted[q.id];
    if (displayed === undefined || displayed === null) continue;
    const perm = permutationFor(nonce, q.id, q.choices.length);
    const stored = invertChoice(perm, displayed);
    if (stored >= 0) out[q.id] = stored;
  }
  return out;
}

/** Where the correct (stored) answer sits in THIS attempt's displayed order. */
export function displayedCorrectIndex(
  nonce: string,
  question: { id: string; choices: string[]; correct_index: number }
): number {
  const perm = permutationFor(nonce, question.id, question.choices.length);
  // perm[display] = stored; find the display slot holding the correct stored index.
  return perm.indexOf(question.correct_index);
}
