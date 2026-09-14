"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/eval/admin-client";
import { parseInstagramShortcode, MAX_LIVE_POSTS } from "@/lib/media/instagram";
import { parseCount, describeUnparsableInstagramUrl, type ActionResult } from "./parse";

function revalidateMedia() {
  revalidatePath("/media");
  revalidatePath("/admin/media");
}

/** Null when the caller is an admin, otherwise the error to return. */
async function requireAdmin(): Promise<string | null> {
  const user = await getAdminUser();
  return user ? null : "Not authorized.";
}

/** Count of currently-live rows, used to enforce the nine cap. */
async function liveCount(db: ReturnType<typeof createAdminClient>): Promise<number> {
  const { count } = await db
    .from("media_instagram_posts")
    .select("id", { count: "exact", head: true })
    .eq("is_live", true);
  return count ?? 0;
}

/**
 * The capture date for a pair of hand-read metrics: today when at least one
 * number was actually entered, null when neither was. Stamping a date over two
 * blanks would claim a reading that never happened, and the admin page's
 * staleness indicator reads this column.
 */
function capturedOn(plays: number | null, likes: number | null): string | null {
  if (plays === null && likes === null) return null;
  return new Date().toISOString().slice(0, 10);
}

/**
 * Add a reel to the grid. Refuses when nine are already live — retiring one
 * first is deliberate: it forces the "which is weakest?" decision.
 */
export async function addPost(input: {
  url: string;
  label?: string;
  plays?: string;
  likes?: string;
}): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return { ok: false, error: denied };

  const shortcode = parseInstagramShortcode(input.url);
  if (!shortcode) {
    return {
      ok: false,
      error:
        describeUnparsableInstagramUrl(input.url) ??
        "That doesn't look like an Instagram reel or post link.",
    };
  }

  const db = createAdminClient();

  // An existing retired row for this shortcode is revived rather than duplicated
  // (`shortcode` is UNIQUE, so an insert would fail anyway).
  const { data: existing, error: readErr } = await db
    .from("media_instagram_posts")
    .select("id, is_live")
    .eq("shortcode", shortcode)
    .maybeSingle();

  if (readErr) return { ok: false, error: readErr.message };

  if (existing?.is_live) {
    return { ok: false, error: "That reel is already on the page." };
  }

  if ((await liveCount(db)) >= MAX_LIVE_POSTS) {
    return {
      ok: false,
      error: `The grid holds ${MAX_LIVE_POSTS} reels. Retire one first, then add this.`,
    };
  }

  const plays = parseCount(input.plays);
  const likes = parseCount(input.likes);

  // Adding overwrites every field, including a revived row's old numbers, so
  // the capture date is rewritten with them rather than left behind.
  const fields = {
    shortcode,
    label: (input.label ?? "").trim(),
    is_live: true,
    position: MAX_LIVE_POSTS - 1, // lands last; reorder from the list
    plays,
    likes,
    metrics_captured_on: capturedOn(plays, likes),
    updated_at: new Date().toISOString(),
  };

  const { error } = existing
    ? await db.from("media_instagram_posts").update(fields).eq("id", existing.id)
    : await db.from("media_instagram_posts").insert(fields);

  if (error) return { ok: false, error: error.message };
  revalidateMedia();
  return { ok: true };
}

/** Take a reel off the page. The row is kept so it can be brought back. */
export async function retirePost(id: string): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return { ok: false, error: denied };

  const db = createAdminClient();
  const { error } = await db
    .from("media_instagram_posts")
    .update({ is_live: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidateMedia();
  return { ok: true };
}

/** Put a retired reel back, if there's room. */
export async function restorePost(id: string): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return { ok: false, error: denied };

  const db = createAdminClient();
  if ((await liveCount(db)) >= MAX_LIVE_POSTS) {
    return {
      ok: false,
      error: `The grid holds ${MAX_LIVE_POSTS} reels. Retire one first.`,
    };
  }
  const { error } = await db
    .from("media_instagram_posts")
    .update({ is_live: true, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidateMedia();
  return { ok: true };
}

/** Edit the note and the hand-entered performance numbers. */
export async function updatePost(
  id: string,
  input: { label?: string; plays?: string; likes?: string }
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return { ok: false, error: denied };

  const plays = parseCount(input.plays);
  const likes = parseCount(input.likes);
  const captured = capturedOn(plays, likes);

  const db = createAdminClient();
  const { error } = await db
    .from("media_instagram_posts")
    .update({
      label: (input.label ?? "").trim(),
      plays,
      likes,
      // Clearing both numbers leaves the previous capture date alone rather
      // than erasing it — an edit to the note is not a new reading.
      ...(captured ? { metrics_captured_on: captured } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidateMedia();
  return { ok: true };
}

/** Move a reel one slot earlier or later by swapping positions with its neighbour. */
export async function movePost(
  id: string,
  direction: "up" | "down"
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return { ok: false, error: denied };

  const db = createAdminClient();
  const { data: rows, error: readErr } = await db
    .from("media_instagram_posts")
    .select("id, position")
    .eq("is_live", true)
    .order("position", { ascending: true });

  if (readErr) return { ok: false, error: readErr.message };

  const list = (rows ?? []) as { id: string; position: number }[];
  const i = list.findIndex((r) => r.id === id);
  if (i === -1) return { ok: false, error: "That reel isn't on the page." };

  const j = direction === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= list.length) return { ok: true }; // already at the end — no-op

  // Rewrite every position from the swapped array. Cheap (nine rows) and it
  // repairs any duplicate or gapped positions left by earlier edits.
  [list[i], list[j]] = [list[j], list[i]];
  for (let k = 0; k < list.length; k++) {
    const { error } = await db
      .from("media_instagram_posts")
      .update({ position: k, updated_at: new Date().toISOString() })
      .eq("id", list[k].id);
    if (error) return { ok: false, error: error.message };
  }

  revalidateMedia();
  return { ok: true };
}
