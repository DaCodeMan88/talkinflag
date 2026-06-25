import { describe, it, expect } from "vitest";
import {
  CAREER_KINDS,
  isValidKind,
  kindLabel,
  isRankingRelevant,
  kindsForRoles,
  rankingsStale,
} from "./kinds";

describe("career kinds", () => {
  it("every kind has at least one allowed role and non-empty fields", () => {
    for (const k of CAREER_KINDS) {
      expect(k.roles.length).toBeGreaterThan(0);
      expect(k.fields.length).toBeGreaterThan(0);
    }
  });

  it("validates kinds", () => {
    expect(isValidKind("championship")).toBe(true);
    expect(isValidKind("nope")).toBe(false);
  });

  it("labels known and unknown kinds", () => {
    expect(kindLabel("title_game")).toBe("Reached a Title Game");
    expect(kindLabel("mystery_kind")).toBe("mystery kind");
  });

  it("flags ranking-relevant kinds", () => {
    expect(isRankingRelevant("championship")).toBe(true);
    expect(isRankingRelevant("award")).toBe(true);
    expect(isRankingRelevant("clinic_hosted")).toBe(false);
    expect(isRankingRelevant("role_change")).toBe(false);
  });

  it("a plain player can log achievements but not coach/expert credentials", () => {
    const kinds = kindsForRoles([]).map((k) => k.kind);
    expect(kinds).toContain("championship");
    expect(kinds).toContain("award");
    expect(kinds).not.toContain("clinic_hosted");
    expect(kinds).not.toContain("event_covered");
  });

  it("a coach sees coaching credential kinds", () => {
    const kinds = kindsForRoles(["coach"]).map((k) => k.kind);
    expect(kinds).toContain("role_change");
    expect(kinds).toContain("clinic_hosted");
    expect(kinds).toContain("championship"); // also a player-eligible kind
  });

  it("an expert sees coverage credential kinds", () => {
    const kinds = kindsForRoles(["expert"]).map((k) => k.kind);
    expect(kinds).toContain("event_covered");
    expect(kinds).toContain("award");
  });
});

describe("rankingsStale", () => {
  it("not stale when there are no relevant approvals", () => {
    expect(rankingsStale("2026-06-01T00:00:00Z", null)).toBe(false);
  });

  it("stale when a relevant approval exists and there was never a recompute", () => {
    expect(rankingsStale(null, "2026-06-01T00:00:00Z")).toBe(true);
  });

  it("stale when the latest relevant approval is after the last recompute", () => {
    expect(rankingsStale("2026-06-01T00:00:00Z", "2026-06-02T00:00:00Z")).toBe(true);
  });

  it("fresh when the last recompute is after the latest relevant approval", () => {
    expect(rankingsStale("2026-06-03T00:00:00Z", "2026-06-02T00:00:00Z")).toBe(false);
  });
});
