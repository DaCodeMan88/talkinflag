import { revalidatePath } from "next/cache";

/**
 * Public pages keep a saved copy for a day (`revalidate = 86400`) instead of
 * rebuilding every 5 minutes. They were rebuilding all day because crawlers
 * sweep the whole site, which used most of the Vercel free tier's server time
 * (Nov 2026: talkinflag 2h 39m of the account's 4h in 30 days).
 *
 * The cost of a long window is that a change could take a day to show, so
 * every place that changes public player or coach data calls one of these
 * right after a successful write. The page then rebuilds on its next visit,
 * which makes edits show sooner than the old 5-minute window did.
 */

/** Pages that list or rank players. */
export const PLAYER_LIST_PAGES = ["/", "/players", "/rankings", "/teams", "/recruit"] as const;

function safely(path: string, type?: "page" | "layout") {
  try {
    revalidatePath(path, type);
  } catch (err) {
    // A failed refresh must never fail the save that triggered it; the page
    // still refreshes on its own within a day.
    console.error("[refresh] revalidatePath failed", path, err);
  }
}

/** One player's data changed (photo, recruiting info, verification, career update). */
export function refreshPlayer(playerId: string) {
  safely(`/players/${playerId}`);
  safely(`/players/${playerId}/embed`);
  for (const p of PLAYER_LIST_PAGES) safely(p);
}

/** Every player's data changed at once (the weekly rankings recompute). */
export function refreshAllPlayers() {
  safely("/players/[id]", "page");
  safely("/players/[id]/embed", "page");
  for (const p of PLAYER_LIST_PAGES) safely(p);
}

/** Coach data changed. */
export function refreshCoaches(coachId?: string) {
  safely("/coaches");
  if (coachId) safely(`/coaches/${coachId}`);
  else safely("/coaches/[id]", "page");
}

/** An event was approved or rejected. */
export function refreshEvents() {
  safely("/events");
  safely("/events/[id]", "page");
  safely("/");
}

/** A coach opened or closed a roster spot. */
export function refreshRecruiting() {
  safely("/recruit");
  safely("/coaches");
  safely("/coaches/[id]", "page");
}
