import { describe, it, expect } from "vitest";
import { GUARDED_FIELDS, sanitizeChangeRequest } from "./change-request";

describe("sanitizeChangeRequest", () => {
  it("lists the guarded fields", () => {
    expect(GUARDED_FIELDS).toEqual(["first_name", "last_name", "school_or_team", "level"]);
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
  it("rejects empty values", () => {
    expect(sanitizeChangeRequest("last_name", "   ")).toBeNull();
  });
  it("caps long values", () => {
    const out = sanitizeChangeRequest("school_or_team", "x".repeat(300));
    expect(out?.value.length).toBe(120);
  });
});
