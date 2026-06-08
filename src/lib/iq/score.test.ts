import { test, expect } from "vitest";
import { scoreAttempt } from "./score";

test("scoreAttempt computes weighted percentage", () => {
  const qs = [
    { id: "1", correct_index: 2, points: 1 },
    { id: "2", correct_index: 0, points: 3 },
  ];
  const answers = { "1": 2, "2": 1 }; // q1 right (1pt), q2 wrong
  expect(scoreAttempt(qs, answers)).toEqual({ raw: 1, max: 4, pct: 25 });
});

test("scoreAttempt: all correct => 100", () => {
  const qs = [
    { ordinal: 1, correct_index: 1, points: 1 },
    { ordinal: 2, correct_index: 3, points: 1 },
  ];
  expect(scoreAttempt(qs, { "1": 1, "2": 3 })).toEqual({ raw: 2, max: 2, pct: 100 });
});

test("scoreAttempt: unanswered counts as wrong", () => {
  const qs = [{ id: "a", correct_index: 0, points: 1 }];
  expect(scoreAttempt(qs, {}).pct).toBe(0);
});

test("scoreAttempt: empty quiz is 0, not NaN", () => {
  expect(scoreAttempt([], {})).toEqual({ raw: 0, max: 0, pct: 0 });
});
