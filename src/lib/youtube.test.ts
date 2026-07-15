import { describe, it, expect } from "vitest";
import { parseIsoDuration, isShort, selectEpisodes, type RawVideo } from "./youtube";

describe("parseIsoDuration", () => {
  it("parses minutes and seconds", () => {
    expect(parseIsoDuration("PT1M2S")).toBe(62);
  });
  it("parses hours", () => {
    expect(parseIsoDuration("PT1H0M0S")).toBe(3600);
  });
  it("parses seconds-only", () => {
    expect(parseIsoDuration("PT45S")).toBe(45);
  });
  it("returns 0 for junk", () => {
    expect(parseIsoDuration("nope")).toBe(0);
  });
});

describe("isShort", () => {
  it("flags sub-3-minute videos as shorts", () => {
    expect(isShort({ durationSec: 58 })).toBe(true);
    expect(isShort({ durationSec: 179 })).toBe(true);
  });
  it("passes real episodes", () => {
    expect(isShort({ durationSec: 1800 })).toBe(false);
  });
  it("flags #shorts by title even when duration is unknown", () => {
    expect(isShort({ durationSec: 0, title: "Big play! #Shorts" })).toBe(true);
  });
});

describe("selectEpisodes", () => {
  const long: RawVideo = { id: "a", title: "Ep 39 | Phil Cutler", description: "", thumbnail: "", publishedAt: "2026-01-01T00:00:00Z", durationSec: 1800 };
  const short: RawVideo = { id: "b", title: "Hype #shorts", description: "", thumbnail: "", publishedAt: "2026-01-02T00:00:00Z", durationSec: 30 };

  it("drops shorts and keeps episodes", () => {
    const out = selectEpisodes([short, long], 10);
    expect(out.map((e) => e.id)).toEqual(["a"]);
  });
  it("respects the max", () => {
    expect(selectEpisodes([long, { ...long, id: "c" }], 1)).toHaveLength(1);
  });
  it("maps guest name and episode number", () => {
    const [e] = selectEpisodes([long], 10);
    expect(e.guestName).toBe("Phil Cutler");
    expect(e.episodeNumber).toBe(39);
  });
});
