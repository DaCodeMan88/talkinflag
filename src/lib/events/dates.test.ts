import { describe, expect, it } from "vitest";
import { formatDateRange } from "./dates";

describe("formatDateRange", () => {
  it("formats a range inside one month without ICU's skeleton fallback", () => {
    const out = formatDateRange("2026-09-24", "2026-09-26");
    expect(out).toBe("September 24 – 26, 2026");
    expect(out).not.toContain("(day:");
  });

  it("formats a one-day event with the weekday", () => {
    expect(formatDateRange("2027-02-06", "2027-02-06")).toBe("Saturday, February 6, 2027");
    expect(formatDateRange("2027-02-06", null)).toBe("Saturday, February 6, 2027");
  });

  it("spells out both ends when the range crosses a month", () => {
    expect(formatDateRange("2028-07-14", "2028-08-02")).toBe("July 14, 2028 – August 2, 2028");
  });
});
