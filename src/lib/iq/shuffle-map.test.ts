import { describe, it, expect } from "vitest";
import { shuffleChoices, toStoredAnswers, displayedCorrectIndex } from "./shuffle-map";
import { scoreAttempt } from "./score";

// A small fixture with known correct answers in STORED space. The whole point
// of these tests is to prove — end to end — that a client who sees the shuffled
// choices and clicks the correct string every time gets mapped back to the key
// and scores 100%, and that a wrong click does not.
type Fixture = { id: string; choices: string[]; correct_index: number; points: number };
const QUESTIONS: Fixture[] = [
  { id: "q-alpha", choices: ["A0", "A1", "A2", "A3"], correct_index: 1, points: 1 },
  { id: "q-bravo", choices: ["B0", "B1", "B2", "B3"], correct_index: 3, points: 1 },
  { id: "q-charlie", choices: ["C0", "C1", "C2"], correct_index: 0, points: 1 },
  { id: "q-delta", choices: ["D0", "D1", "D2", "D3"], correct_index: 2, points: 1 },
];

const NONCES = ["nonce-one-abc123", "another-nonce-xyz789"];

describe("shuffleChoices", () => {
  it("reorders choices but preserves the set (a permutation)", () => {
    for (const nonce of NONCES) {
      for (const q of QUESTIONS) {
        const shuffled = shuffleChoices({ id: q.id, choices: q.choices }, nonce);
        expect([...shuffled.choices].sort()).toEqual([...q.choices].sort());
      }
    }
  });

  it("the displayedCorrectIndex slot holds exactly the original correct string", () => {
    for (const nonce of NONCES) {
      for (const q of QUESTIONS) {
        const shuffled = shuffleChoices({ id: q.id, choices: q.choices }, nonce);
        const dci = displayedCorrectIndex(nonce, q);
        expect(shuffled.choices[dci]).toBe(q.choices[q.correct_index]);
      }
    }
  });
});

describe("toStoredAnswers round-trip (the safety net)", () => {
  it("a client who picks the displayed-correct slot for every Q scores 100% under ≥2 nonces", () => {
    for (const nonce of NONCES) {
      // Simulate what the client submits: displayed index of the correct choice.
      const submitted: Record<string, number> = {};
      for (const q of QUESTIONS) {
        submitted[q.id] = displayedCorrectIndex(nonce, q);
      }
      const stored = toStoredAnswers(QUESTIONS, nonce, submitted);
      // Every mapped answer equals the stored correct_index.
      for (const q of QUESTIONS) {
        expect(stored[q.id]).toBe(q.correct_index);
      }
      const { pct, raw, max } = scoreAttempt(QUESTIONS, stored);
      expect(pct).toBe(100);
      expect(raw).toBe(max);
    }
  });

  it("picking a WRONG displayed slot maps back to a non-correct stored index (score < 100%)", () => {
    const nonce = NONCES[0];
    const submitted: Record<string, number> = {};
    for (const q of QUESTIONS) {
      const dci = displayedCorrectIndex(nonce, q);
      // Pick any slot that is NOT the correct displayed slot.
      const wrong = (dci + 1) % q.choices.length;
      submitted[q.id] = wrong;
    }
    const stored = toStoredAnswers(QUESTIONS, nonce, submitted);
    for (const q of QUESTIONS) {
      expect(stored[q.id]).not.toBe(q.correct_index);
    }
    const { pct } = scoreAttempt(QUESTIONS, stored);
    expect(pct).toBeLessThan(100);
    expect(pct).toBe(0);
  });

  it("drops out-of-range displayed indices", () => {
    const nonce = NONCES[0];
    const submitted: Record<string, number> = {
      "q-alpha": 99, // out of range → dropped
      "q-bravo": -1, // out of range → dropped
      "q-charlie": displayedCorrectIndex(nonce, QUESTIONS[2]), // valid
    };
    const stored = toStoredAnswers(QUESTIONS, nonce, submitted);
    expect(stored["q-alpha"]).toBeUndefined();
    expect(stored["q-bravo"]).toBeUndefined();
    expect(stored["q-charlie"]).toBe(QUESTIONS[2].correct_index);
  });

  it("skips questions the client did not answer", () => {
    const nonce = NONCES[1];
    const submitted: Record<string, number> = {
      "q-delta": displayedCorrectIndex(nonce, QUESTIONS[3]),
    };
    const stored = toStoredAnswers(QUESTIONS, nonce, submitted);
    expect(Object.keys(stored)).toEqual(["q-delta"]);
    expect(stored["q-delta"]).toBe(QUESTIONS[3].correct_index);
  });
});
