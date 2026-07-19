// Ranking cohorts: HS (18U) players are never ranked against college/world players.
// Owner decision 2026-07-18: high_school+youth = "hs"; everything else = "cw".

export type Cohort = "hs" | "cw";

export const COHORT_LABELS: Record<Cohort, string> = {
  hs: "High School (18U)",
  cw: "College / World",
};

export const COHORT_SHORT: Record<Cohort, string> = {
  hs: "HS",
  cw: "CW",
};

export function cohortForLevel(level: string | null | undefined): Cohort {
  return level === "high_school" || level === "youth" ? "hs" : "cw";
}

export function cohortRankLabel(
  level: string | null | undefined,
  rank: number | null | undefined,
): string | null {
  if (rank == null) return null;
  return `${COHORT_SHORT[cohortForLevel(level)]} #${rank}`;
}
