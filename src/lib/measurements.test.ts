import { describe, it, expect } from "vitest";
import { formatHeight, formatWeight, cmToInches, inchesToCm } from "./measurements";

describe("formatHeight", () => {
  it("formats inches as ft/in plus cm", () => {
    expect(formatHeight(66)).toBe("5'6\" / 168 cm");
  });
  it("returns empty string for null/0", () => {
    expect(formatHeight(null)).toBe("");
    expect(formatHeight(0)).toBe("");
  });
});

describe("formatWeight", () => {
  it("formats lbs plus kg", () => {
    expect(formatWeight(128)).toBe("128 lbs / 58 kg");
  });
  it("returns empty string for null/0", () => {
    expect(formatWeight(null)).toBe("");
  });
});

describe("conversions", () => {
  it("inchesToCm rounds", () => { expect(inchesToCm(66)).toBe(168); });
  it("cmToInches rounds", () => { expect(cmToInches(168)).toBe(66); });
});
