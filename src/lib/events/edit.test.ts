import { describe, expect, it } from "vitest";
import { parseEventForm } from "./edit";

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const base = { title: "European Flag Football Championship 2026", start_date: "2026-09-05", end_date: "2026-09-13" };

describe("parseEventForm", () => {
  it("accepts a complete edit and normalises blanks to null", () => {
    const r = parseEventForm(form({ ...base, city: "  ", country: "Italy", country_code: "it", level: "international" }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.city).toBeNull();
    expect(r.value.country).toBe("Italy");
    expect(r.value.country_code).toBe("IT");
  });

  it("requires a title and a start date", () => {
    expect(parseEventForm(form({ ...base, title: " " })).ok).toBe(false);
    expect(parseEventForm(form({ ...base, start_date: "" })).ok).toBe(false);
  });

  it("rejects an end date before the start", () => {
    const r = parseEventForm(form({ ...base, end_date: "2026-09-01" }));
    expect(r).toEqual({ ok: false, error: "End date is before the start date." });
  });

  it("rejects a country code that cannot render a flag", () => {
    expect(parseEventForm(form({ ...base, country_code: "ITA" })).ok).toBe(false);
  });

  it("rejects a website that is not an http(s) link", () => {
    expect(parseEventForm(form({ ...base, website_url: "javascript:alert(1)" })).ok).toBe(false);
    expect(parseEventForm(form({ ...base, website_url: "https://www.americanfootball.sport/" })).ok).toBe(true);
  });

  it("rejects an unknown level", () => {
    expect(parseEventForm(form({ ...base, level: "galactic" })).ok).toBe(false);
  });
});
