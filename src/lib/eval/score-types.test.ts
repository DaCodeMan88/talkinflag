import { describe, it, expect } from "vitest";
import { scoreForcedChoice, scoreBudget, scoreRank, scoreItem } from "./score-types";

// ---------------- forced_choice ----------------
const item = {
  item_type: "forced_choice" as const,
  options: [
    { label: "The one who always makes the right read", dimension: "football_iq", points: 4 },
    { label: "The one who runs away from everybody",     dimension: "athleticism", points: 4 },
    { label: "The one who never drops it",               dimension: "ball_skills", points: 4 },
  ],
};

describe("scoreForcedChoice", () => {
  it("awards the chosen dimension and nothing to the rivals", () => {
    expect(scoreForcedChoice(item, 1)).toEqual({ athleticism: 4 });
  });
  it("ignores an out-of-range choice", () => {
    expect(scoreForcedChoice(item, 7)).toEqual({});
    expect(scoreForcedChoice(item, -1)).toEqual({});
  });
  it("ignores a non-choice answer shape", () => {
    expect(scoreForcedChoice(item, [0, 1] as never)).toEqual({});
  });
});

// ---------------- budget ----------------
const budgetItem = {
  item_type: "budget" as const,
  options: [
    { label: "Football IQ",   dimension: "football_iq", points: 4 },
    { label: "Athleticism",   dimension: "athleticism", points: 4 },
    { label: "Ball skills",   dimension: "ball_skills", points: 4 },
    { label: "Intangibles",   dimension: "intangibles", points: 4 },
  ],
};

describe("scoreBudget", () => {
  it("scales each allocation to the item's max points", () => {
    // 50/25/25/0 of 100 -> half of 4, quarter of 4, quarter of 4, 0
    expect(scoreBudget(budgetItem, { "0": 50, "1": 25, "2": 25, "3": 0 }))
      .toEqual({ football_iq: 2, athleticism: 1, ball_skills: 1, intangibles: 0 });
  });
  it("normalizes when the allocation does not sum to 100", () => {
    expect(scoreBudget(budgetItem, { "0": 10, "1": 10 })).toEqual({ football_iq: 2, athleticism: 2 });
  });
  it("returns nothing for an all-zero or empty allocation", () => {
    expect(scoreBudget(budgetItem, { "0": 0, "1": 0 })).toEqual({});
    expect(scoreBudget(budgetItem, {})).toEqual({});
  });
  it("ignores negative and non-numeric allocations", () => {
    expect(scoreBudget(budgetItem, { "0": -50, "1": 100 })).toEqual({ athleticism: 4 });
  });
});

// ---------------- rank ----------------
const rankItem = {
  item_type: "rank" as const,
  options: [
    { label: "Wins the rep every time",       dimension: "consistency", points: 4 },
    { label: "Wins the rep that decides it",  dimension: "clutch",      points: 4 },
    { label: "Wins reps at three positions",  dimension: "versatility", points: 4 },
  ],
};

describe("scoreRank", () => {
  it("awards descending points by placement", () => {
    // 3 options, max 4 -> 1st=4, 2nd=2, 3rd=0
    expect(scoreRank(rankItem, [1, 0, 2])).toEqual({ clutch: 4, consistency: 2, versatility: 0 });
  });
  it("ignores duplicate or out-of-range indices", () => {
    expect(scoreRank(rankItem, [1, 1, 9])).toEqual({ clutch: 4 });
  });
  it("scores a partial ordering", () => {
    expect(scoreRank(rankItem, [2])).toEqual({ versatility: 4 });
  });
  it("returns nothing for a non-array answer", () => {
    expect(scoreRank(rankItem, 0 as never)).toEqual({});
  });
});

// ---------------- dispatcher ----------------
describe("scoreItem dispatcher", () => {
  const likert = { item_type: "likert" as const, options: [0,1,2,3,4].map((p) => ({ label: `${p}`, dimension: "clutch", points: p })) };

  it("routes likert to index-based points", () => {
    expect(scoreItem(likert, 4)).toEqual({ clutch: 4 });
  });
  it("routes forced_choice", () => {
    expect(scoreItem(
      { item_type: "forced_choice", options: [
        { label: "a", dimension: "defense", points: 4 },
        { label: "b", dimension: "clutch", points: 4 }] }, 0)).toEqual({ defense: 4 });
  });
  it("routes scenario with unequal points", () => {
    expect(scoreItem(
      { item_type: "scenario", options: [
        { label: "Bail to the sideline", dimension: "football_iq", points: 1 },
        { label: "Take the checkdown",   dimension: "football_iq", points: 4 }] }, 1)).toEqual({ football_iq: 4 });
  });
  it("returns {} for an unknown type rather than throwing", () => {
    expect(scoreItem({ item_type: "nope" as never, options: [] }, 0)).toEqual({});
  });
  it("returns {} for a missing answer", () => {
    expect(scoreItem(likert, undefined as never)).toEqual({});
  });
});
