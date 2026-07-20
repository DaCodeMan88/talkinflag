import { describe, it, expect } from "vitest";
import { paginate, pageCount, pageRangeLabel } from "./pagination";

describe("paginate", () => {
  const items = Array.from({ length: 81 }, (_, i) => i + 1);
  it("returns first batch of 25", () => {
    expect(paginate(items, 1, 25)).toEqual(items.slice(0, 25));
  });
  it("returns partial last page", () => {
    expect(paginate(items, 4, 25)).toEqual([76, 77, 78, 79, 80, 81]);
  });
  it("clamps out-of-range page to last page", () => {
    expect(paginate(items, 99, 25)).toEqual([76, 77, 78, 79, 80, 81]);
    expect(paginate(items, 0, 25)).toEqual(items.slice(0, 25));
  });
  it("handles empty list", () => {
    expect(paginate([], 1, 25)).toEqual([]);
  });
});

describe("pageCount", () => {
  it("computes ceil", () => {
    expect(pageCount(81, 25)).toBe(4);
    expect(pageCount(25, 25)).toBe(1);
    expect(pageCount(0, 25)).toBe(1);
  });
});

describe("pageRangeLabel", () => {
  it("labels 26-50 style ranges", () => {
    expect(pageRangeLabel(2, 25, 81)).toBe("26–50");
    expect(pageRangeLabel(4, 25, 81)).toBe("76–81");
    expect(pageRangeLabel(1, 25, 10)).toBe("1–10");
  });
});
