import { describe, it, expect } from "vitest";
import { parseCountTarget, formatCount } from "./useCountUp";

describe("parseCountTarget", () => {
  it("extracts a plain integer", () => {
    expect(parseCountTarget("75+")).toEqual({ value: 75, prefix: "", suffix: "+" });
  });

  it("extracts a value with a leading symbol", () => {
    expect(parseCountTarget("#1")).toEqual({ value: 1, prefix: "#", suffix: "" });
  });

  it("returns null for non-numeric strings so callers can skip animating them", () => {
    expect(parseCountTarget("TBD")).toBeNull();
  });
});

describe("formatCount", () => {
  it("re-applies prefix and suffix around the current animated value", () => {
    expect(formatCount(42, { value: 75, prefix: "", suffix: "+" })).toBe("42+");
    expect(formatCount(1, { value: 1, prefix: "#", suffix: "" })).toBe("#1");
  });
});
