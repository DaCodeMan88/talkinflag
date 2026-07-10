import { describe, it, expect } from "vitest";
import { hasDisplayableValue } from "./profile-visibility";

describe("hasDisplayableValue", () => {
  it("is false for null and undefined", () => {
    expect(hasDisplayableValue(null)).toBe(false);
    expect(hasDisplayableValue(undefined)).toBe(false);
  });

  it("is false for empty and whitespace-only strings", () => {
    expect(hasDisplayableValue("")).toBe(false);
    expect(hasDisplayableValue("   ")).toBe(false);
    expect(hasDisplayableValue("\t\n")).toBe(false);
  });

  it("is false for placeholder junk", () => {
    expect(hasDisplayableValue("?")).toBe(false);
    expect(hasDisplayableValue(" ? ")).toBe(false);
    expect(hasDisplayableValue("N/A")).toBe(false);
    expect(hasDisplayableValue("n/a")).toBe(false);
  });

  it("is false for empty arrays", () => {
    expect(hasDisplayableValue([])).toBe(false);
  });

  it("is true for 0 and other numbers", () => {
    expect(hasDisplayableValue(0)).toBe(true);
    expect(hasDisplayableValue(12)).toBe(true);
    expect(hasDisplayableValue(4.42)).toBe(true);
  });

  it("is true for non-empty strings", () => {
    expect(hasDisplayableValue("QB")).toBe(true);
    expect(hasDisplayableValue("4.42")).toBe(true);
    expect(hasDisplayableValue("0")).toBe(true);
  });

  it("is true for non-empty arrays", () => {
    expect(hasDisplayableValue(["MVP 2024"])).toBe(true);
  });

  it("is true for booleans and objects", () => {
    expect(hasDisplayableValue(true)).toBe(true);
    expect(hasDisplayableValue(false)).toBe(true);
    expect(hasDisplayableValue({ year: 2024 })).toBe(true);
  });
});
