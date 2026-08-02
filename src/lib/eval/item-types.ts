import { DimensionKey } from "./dimensions";

export const ITEM_TYPES = ["likert", "forced_choice", "budget", "rank", "scenario"] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

export type ScoredOption = { label: string; dimension: DimensionKey; points: number };

/**
 * What the client sends back per item, by type:
 *   likert        -> number                    (chosen option index)
 *   forced_choice -> number                    (chosen option index)
 *   scenario      -> number                    (chosen option index)
 *   rank          -> number[]                  (option indices, best first)
 *   budget        -> Record<string, number>    (option index -> points, sums to 100)
 */
export type ItemAnswer = number | number[] | Record<string, number>;

export function isRankAnswer(a: ItemAnswer): a is number[] {
  return Array.isArray(a);
}
export function isBudgetAnswer(a: ItemAnswer): a is Record<string, number> {
  return typeof a === "object" && a !== null && !Array.isArray(a);
}
export function isChoiceAnswer(a: ItemAnswer): a is number {
  return typeof a === "number" && Number.isInteger(a) && a >= 0;
}
