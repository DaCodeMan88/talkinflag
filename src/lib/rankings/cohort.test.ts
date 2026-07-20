import { describe, it, expect } from "vitest";
import { cohortForLevel, COHORT_LABELS, cohortRankLabel } from "./cohort";

describe("cohortForLevel", () => {
  it("maps high_school and youth to hs", () => {
    expect(cohortForLevel("high_school")).toBe("hs");
    expect(cohortForLevel("youth")).toBe("hs");
  });
  it("maps college, national, international to cw", () => {
    expect(cohortForLevel("college")).toBe("cw");
    expect(cohortForLevel("national")).toBe("cw");
    expect(cohortForLevel("international")).toBe("cw");
  });
  it("maps unknown/null/undefined to cw (never leaks adults into 18U)", () => {
    expect(cohortForLevel(null)).toBe("cw");
    expect(cohortForLevel(undefined)).toBe("cw");
    expect(cohortForLevel("pro")).toBe("cw");
  });
});

describe("cohortRankLabel", () => {
  it("prefixes rank with cohort short code", () => {
    expect(cohortRankLabel("high_school", 8)).toBe("HS #8");
    expect(cohortRankLabel("national", 8)).toBe("CW #8");
  });
  it("returns null when no rank", () => {
    expect(cohortRankLabel("college", null)).toBeNull();
    expect(cohortRankLabel("college", undefined)).toBeNull();
  });
});

describe("COHORT_LABELS", () => {
  it("has display labels for both cohorts", () => {
    expect(COHORT_LABELS.hs).toBe("High School (18U)");
    expect(COHORT_LABELS.cw).toBe("College / World (18+)");
  });
});
