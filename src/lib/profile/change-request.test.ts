import { describe, it, expect } from "vitest";
import { GUARDED_FIELDS, sanitizeChangeRequest, isStatsField } from "./change-request";

describe("sanitizeChangeRequest", () => {
  it("lists the guarded fields", () => {
    expect(GUARDED_FIELDS).toEqual(["first_name", "last_name", "school_or_team", "level", "roster_year"]);
  });
  it("accepts a valid name change", () => {
    expect(sanitizeChangeRequest("first_name", "  Ambra ")).toEqual({ field: "first_name", value: "Ambra" });
  });
  it("validates level against the allowlist", () => {
    expect(sanitizeChangeRequest("level", "national")).toEqual({ field: "level", value: "national" });
    expect(sanitizeChangeRequest("level", "banana")).toBeNull();
  });
  it("rejects an unknown field", () => {
    expect(sanitizeChangeRequest("is_verified", "true")).toBeNull();
  });
  it("accepts a valid 4-digit roster year in range", () => {
    expect(sanitizeChangeRequest("roster_year", " 2025 ")).toEqual({ field: "roster_year", value: "2025" });
  });
  it("rejects a non-4-digit or out-of-range roster year", () => {
    expect(sanitizeChangeRequest("roster_year", "25")).toBeNull();
    expect(sanitizeChangeRequest("roster_year", "20255")).toBeNull();
    expect(sanitizeChangeRequest("roster_year", "1999")).toBeNull();
    expect(sanitizeChangeRequest("roster_year", "2036")).toBeNull();
    expect(sanitizeChangeRequest("roster_year", "abcd")).toBeNull();
  });
  it("flags roster_year as a stats-backed field", () => {
    expect(isStatsField("roster_year")).toBe(true);
    expect(isStatsField("first_name")).toBe(false);
  });
  it("rejects empty values", () => {
    expect(sanitizeChangeRequest("last_name", "   ")).toBeNull();
  });
  it("caps long values", () => {
    const out = sanitizeChangeRequest("school_or_team", "x".repeat(300));
    expect(out?.value.length).toBe(120);
  });
});
