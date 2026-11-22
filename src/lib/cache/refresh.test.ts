import { describe, it, expect, vi, beforeEach } from "vitest";

const calls: [string, string | undefined][] = [];
let fail = false;
vi.mock("next/cache", () => ({
  revalidatePath: (p: string, t?: string) => { if (fail) throw new Error("boom"); calls.push([p, t]); },
}));

import { refreshPlayer, refreshAllPlayers, refreshCoaches, refreshEvents, refreshRecruiting, PLAYER_LIST_PAGES } from "./refresh";

beforeEach(() => { calls.length = 0; fail = false; });

describe("page refresh after data changes", () => {
  it("one player's edit refreshes their page, their embed and every list they appear on", () => {
    refreshPlayer("abc");
    const paths = calls.map((c) => c[0]);
    expect(paths).toContain("/players/abc");
    expect(paths).toContain("/players/abc/embed");
    for (const p of PLAYER_LIST_PAGES) expect(paths).toContain(p);
  });

  it("the weekly rankings job refreshes every player page, not just the lists", () => {
    refreshAllPlayers();
    expect(calls).toContainEqual(["/players/[id]", "page"]);
    expect(calls).toContainEqual(["/players/[id]/embed", "page"]);
    for (const p of PLAYER_LIST_PAGES) expect(calls.map((c) => c[0])).toContain(p);
  });

  it("a coach change refreshes the coach list and that coach's page", () => {
    refreshCoaches("c1");
    expect(calls.map((c) => c[0])).toEqual(expect.arrayContaining(["/coaches", "/coaches/c1"]));
  });

  it("a coach change with no id refreshes every coach page", () => {
    refreshCoaches();
    expect(calls).toContainEqual(["/coaches/[id]", "page"]);
  });

  it("an event decision refreshes the events list, every event page and the homepage", () => {
    refreshEvents();
    expect(calls).toEqual(expect.arrayContaining([["/events", undefined], ["/events/[id]", "page"], ["/", undefined]]));
  });

  it("a roster spot change refreshes the recruit board and coach pages", () => {
    refreshRecruiting();
    expect(calls.map((c) => c[0])).toEqual(expect.arrayContaining(["/recruit", "/coaches", "/coaches/[id]"]));
  });

  it("a refresh failure never breaks the save that triggered it", () => {
    fail = true;
    expect(() => refreshPlayer("abc")).not.toThrow();
  });
});
