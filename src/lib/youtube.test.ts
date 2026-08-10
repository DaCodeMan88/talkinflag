import { describe, it, expect } from "vitest";
import { parseIsoDuration, isShort, selectEpisodes, stripHashtags, parseGuestName, type RawVideo } from "./youtube";

// The reel that leaked onto /podcast on 2026-08-09 — verbatim YouTube title.
const REEL_TITLE =
  "TALKIN FLAG WITH LAURA HERNANDEZ SANCHEZ - SPANISH NATIONAL TEAM PLAYER #FLAGFOOTBALL #FLAGPODCAST";

describe("stripHashtags", () => {
  it("removes trailing hashtag runs", () => {
    expect(stripHashtags(REEL_TITLE)).toBe(
      "TALKIN FLAG WITH LAURA HERNANDEZ SANCHEZ - SPANISH NATIONAL TEAM PLAYER"
    );
  });
  it("removes inline hashtags and collapses whitespace", () => {
    expect(stripHashtags("Ep 40 #flag | Jane Doe")).toBe("Ep 40 | Jane Doe");
  });
  it("leaves clean titles untouched", () => {
    expect(stripHashtags("Ep 39 | Phil Cutler")).toBe("Ep 39 | Phil Cutler");
  });
  it("trims dangling separators left behind", () => {
    expect(stripHashtags("Big win — #shorts")).toBe("Big win");
  });
});

describe("parseGuestName", () => {
  it("still reads the pipe form", () => {
    expect(parseGuestName("Ep 39 | Phil Cutler")).toBe("Phil Cutler");
  });
  it("reads the 'Talkin Flag with X - role' form and drops the role", () => {
    expect(parseGuestName(REEL_TITLE)).toBe("Laura Hernandez Sanchez");
  });
  it("title-cases only shouty names, preserving deliberate casing", () => {
    expect(parseGuestName("Talkin Flag with Diana Flores - QB")).toBe("Diana Flores");
    expect(parseGuestName("Ep 12 | Renée O'Brien-Smith")).toBe("Renée O'Brien-Smith");
  });
  it("does not split hyphenated names lacking surrounding spaces", () => {
    expect(parseGuestName("Talkin Flag with Anne-Marie Dupont")).toBe("Anne-Marie Dupont");
  });
  it("returns undefined when there is no guest pattern", () => {
    expect(parseGuestName("Season 3 trailer")).toBeUndefined();
  });
});

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

  it("cleans hashtags off the rendered title but still filters by the raw one", () => {
    const reel: RawVideo = {
      id: "r", title: "Hype reel #Shorts", description: "", thumbnail: "",
      publishedAt: "2026-01-03T00:00:00Z", durationSec: 0,
    };
    const tagged: RawVideo = {
      id: "t", title: REEL_TITLE, description: "", thumbnail: "",
      publishedAt: "2026-01-04T00:00:00Z", durationSec: 2400,
    };
    const out = selectEpisodes([reel, tagged], 10);
    expect(out.map((e) => e.id)).toEqual(["t"]); // #Shorts still caught pre-strip
    expect(out[0].title).not.toMatch(/#/);
    expect(out[0].guestName).toBe("Laura Hernandez Sanchez");
  });
});
