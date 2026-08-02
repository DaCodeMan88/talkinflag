// Pure streak logic for the IQ quizzes. Kept dependency-free and unit-tested so
// the runner can update a live streak counter without any UI coupling.

/** The streak after answering one more question: grow on correct, reset on miss. */
export function nextStreak(current: number, correct: boolean): number {
  return correct ? current + 1 : 0;
}

/** The longest run of consecutive correct answers in an answered-so-far history. */
export function bestStreak(history: boolean[]): number {
  let best = 0;
  let run = 0;
  for (const correct of history) {
    run = correct ? run + 1 : 0;
    if (run > best) best = run;
  }
  return best;
}
