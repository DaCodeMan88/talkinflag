"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
// Types are erased at compile time, so this import costs the browser nothing.
import type { InstagramPost } from "@/lib/media/instagram";
// Value imports come from modules with NO Supabase/service-role dependency.
// `@/lib/media/instagram` must never be value-imported here — it pulls in
// createAdminClient, which reads SUPABASE_SERVICE_ROLE_KEY.
import { parseInstagramShortcode, reelUrl } from "@/lib/media/parse-shortcode";
import { parseCount, describeUnparsableInstagramUrl } from "./parse";
import { addPost, retirePost, restorePost, movePost, updatePost } from "./actions";
import type { ActionResult } from "./parse";

// The 44px floor applies at phone widths only; at sm+ the row goes back to the
// compact rail the rest of the admin uses.
const BTN =
  "inline-flex items-center justify-center min-h-[44px] sm:min-h-0 border border-white/15 text-white/60 font-display uppercase tracking-widest px-3 py-1.5 text-[10px] hover:border-white/30 hover:text-white transition-colors disabled:opacity-40";
const INPUT =
  "bg-black border border-white/15 text-white text-sm px-3 py-2 placeholder:text-white/25 min-w-0 w-full";

/** The one message for a number we can't read. Shown, never silently dropped. */
const UNREADABLE_COUNT = "I can't read that as a number — try 20400 or 20.4K.";

/**
 * A validation message tied to its input by id. An orphan <p> is invisible to a
 * screen reader, which — next to a disabled Add button — leaves a non-sighted
 * admin with a dead control and no stated reason.
 */
function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="text-amber-400 text-xs mt-1.5">
      {children}
    </p>
  );
}

/** A count field is fine when it's empty; anything else has to parse. */
function countError(v: string): string | null {
  if (!v.trim()) return null;
  return parseCount(v) === null ? UNREADABLE_COUNT : null;
}

export function InstagramGridEditor({
  live,
  retired,
}: {
  live: InstagramPost[];
  retired: InstagramPost[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [plays, setPlays] = useState("");
  const [likes, setLikes] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  /*
    Row nine's Retire button sits about a screen below this panel at 375px, so a
    failure that only renders at the top reads as "the button did nothing".
    Focusing it both scrolls it into view and announces it.
  */
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  function run(fn: () => Promise<ActionResult>) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  // Parsed as she types, so a wrong paste is caught before it's committed.
  const shortcode = url.trim() ? parseInstagramShortcode(url) : null;
  const urlError =
    !url.trim() || shortcode
      ? null
      : describeUnparsableInstagramUrl(url) ??
        "That doesn't look like an Instagram reel or post link.";
  const playsError = countError(plays);
  const likesError = countError(likes);
  const canAdd = !!shortcode && !playsError && !likesError;

  return (
    <div className="space-y-10">
      {error && (
        <p
          ref={errorRef}
          role="alert"
          tabIndex={-1}
          className="border border-red-500/40 text-red-300 text-sm px-4 py-3 outline-none"
        >
          {error}
        </p>
      )}

      {/* Add */}
      <section className="bg-[#0d0d0d] border border-white/10 p-6">
        <p className="font-display text-xs uppercase tracking-[0.25em] text-white/30 mb-4">
          Add a reel
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_120px_120px]">
          <div className="min-w-0">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste the Instagram link"
              aria-label="Instagram link"
              aria-invalid={!!urlError}
              aria-describedby={urlError ? "add-url-error" : undefined}
              className={INPUT}
            />
            {urlError && <FieldError id="add-url-error">{urlError}</FieldError>}
          </div>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Note (optional)"
            aria-label="Note"
            className={INPUT}
          />
          <div className="min-w-0">
            <input
              value={plays}
              onChange={(e) => setPlays(e.target.value)}
              placeholder="Plays"
              inputMode="numeric"
              aria-label="Plays"
              aria-invalid={!!playsError}
              aria-describedby={playsError ? "add-plays-error" : undefined}
              className={INPUT}
            />
            {playsError && <FieldError id="add-plays-error">{playsError}</FieldError>}
          </div>
          <div className="min-w-0">
            <input
              value={likes}
              onChange={(e) => setLikes(e.target.value)}
              placeholder="Likes"
              inputMode="numeric"
              aria-label="Likes"
              aria-invalid={!!likesError}
              aria-describedby={likesError ? "add-likes-error" : undefined}
              className={INPUT}
            />
            {likesError && <FieldError id="add-likes-error">{likesError}</FieldError>}
          </div>
        </div>

        {/*
          The parser can't tell a handle from a shortcode offline — both are
          [A-Za-z0-9_-]. Seeing the actual reel is the only way to catch a
          wrong paste before it becomes a broken embed on the public page.
        */}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button
            type="button"
            disabled={pending || !canAdd}
            onClick={() =>
              run(async () => {
                const res = await addPost({ url, label, plays, likes });
                if (res.ok) {
                  setUrl("");
                  setLabel("");
                  setPlays("");
                  setLikes("");
                }
                return res;
              })
            }
            className="bg-[#FDDD58] text-black font-display uppercase tracking-widest px-5 py-2 text-xs disabled:opacity-40"
          >
            Add
          </button>
          {shortcode && (
            /*
              The URL is the check. `instagram.com/reel/talkinflagshow/` is
              recognisably wrong at a glance, and generic link text would hide
              exactly that — so the address is the link text, truncated by CSS
              rather than by slicing the string.
            */
            <a
              href={reelUrl(shortcode)}
              target="_blank"
              rel="noopener noreferrer"
              title={reelUrl(shortcode)}
              className="text-[#FDDD58] text-sm hover:underline min-w-0 max-w-full truncate"
            >
              {reelUrl(shortcode)} ↗
            </a>
          )}
        </div>
      </section>

      {/* Live grid */}
      <section>
        <p className="font-display text-xs uppercase tracking-[0.25em] text-white/30 mb-4">
          On the page
        </p>
        <ul className="space-y-2">
          {live.map((p, i) => (
            <li key={p.id} className="bg-[#0d0d0d] border border-white/10 px-4 py-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="font-display text-[#FDDD58] text-sm w-6 shrink-0">
                  {i + 1}
                </span>
                <a
                  href={reelUrl(p.shortcode)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white text-sm hover:text-[#FDDD58] transition-colors min-w-0 break-words"
                >
                  {p.label || p.shortcode}
                </a>
                {(p.plays != null || p.likes != null) && (
                  <span className="text-white/30 text-xs">
                    {[
                      p.plays != null ? `${p.plays.toLocaleString()} plays` : null,
                      p.likes != null ? `${p.likes.toLocaleString()} likes` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                )}
                {/*
                  A flex spacer is itself a wrappable item: at 375px it can land
                  at the end of the first line and leave the buttons below it
                  left-aligned. It only has a job once the row fits on one line.
                */}
                <span className="hidden sm:block flex-1 min-w-0" />
                <button
                  type="button"
                  aria-label="Move up"
                  disabled={pending || i === 0}
                  className={BTN}
                  onClick={() => run(() => movePost(p.id!, "up"))}
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  disabled={pending || i === live.length - 1}
                  className={BTN}
                  onClick={() => run(() => movePost(p.id!, "down"))}
                >
                  ↓
                </button>
                <button
                  type="button"
                  disabled={pending}
                  className={BTN}
                  onClick={() => setEditing(editing === p.id ? null : p.id!)}
                >
                  {editing === p.id ? "Close" : "Edit"}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  className={BTN}
                  onClick={() => run(() => retirePost(p.id!))}
                >
                  Retire
                </button>
              </div>
              {editing === p.id && (
                <RowEditor
                  post={p}
                  pending={pending}
                  onSave={(fields) =>
                    run(async () => {
                      const res = await updatePost(p.id!, fields);
                      if (res.ok) setEditing(null);
                      return res;
                    })
                  }
                />
              )}
            </li>
          ))}
          {live.length === 0 && (
            <li className="text-white/30 text-sm py-8 text-center border border-white/5">
              Nothing on the page yet. Paste a reel link above.
            </li>
          )}
        </ul>
      </section>

      {/* Retired */}
      {retired.length > 0 && (
        <section>
          <p className="font-display text-xs uppercase tracking-[0.25em] text-white/30 mb-4">
            Retired — kept, not deleted
          </p>
          <ul className="space-y-2">
            {retired.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center gap-3 bg-[#0d0d0d] border border-white/5 px-4 py-3"
              >
                <a
                  href={reelUrl(p.shortcode)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/40 text-sm hover:text-white transition-colors min-w-0 break-words"
                >
                  {p.label || p.shortcode}
                </a>
                <span className="hidden sm:block flex-1 min-w-0" />
                <button
                  type="button"
                  disabled={pending}
                  className={BTN}
                  onClick={() => run(() => restorePost(p.id!))}
                >
                  Put back
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/**
 * Inline edit for one row's note and hand-read numbers.
 *
 * Plays AND likes are both sent on every save, seeded from what the row
 * already holds: `updatePost` writes both columns unconditionally, so omitting
 * one would blank it.
 */
function RowEditor({
  post,
  pending,
  onSave,
}: {
  post: InstagramPost;
  pending: boolean;
  onSave: (fields: { label: string; plays: string; likes: string }) => void;
}) {
  const [label, setLabel] = useState(post.label ?? "");
  const [plays, setPlays] = useState(post.plays != null ? String(post.plays) : "");
  const [likes, setLikes] = useState(post.likes != null ? String(post.likes) : "");

  const playsError = countError(plays);
  const likesError = countError(likes);
  const playsErrorId = `edit-${post.id}-plays-error`;
  const likesErrorId = `edit-${post.id}-likes-error`;

  return (
    <div className="mt-3 pt-3 border-t border-white/10">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_120px_120px]">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Note"
          aria-label="Note"
          className={INPUT}
        />
        <div className="min-w-0">
          <input
            value={plays}
            onChange={(e) => setPlays(e.target.value)}
            placeholder="Plays"
            inputMode="numeric"
            aria-label="Plays"
            aria-invalid={!!playsError}
            aria-describedby={playsError ? playsErrorId : undefined}
            className={INPUT}
          />
          {playsError && <FieldError id={playsErrorId}>{playsError}</FieldError>}
        </div>
        <div className="min-w-0">
          <input
            value={likes}
            onChange={(e) => setLikes(e.target.value)}
            placeholder="Likes"
            inputMode="numeric"
            aria-label="Likes"
            aria-invalid={!!likesError}
            aria-describedby={likesError ? likesErrorId : undefined}
            className={INPUT}
          />
          {likesError && <FieldError id={likesErrorId}>{likesError}</FieldError>}
        </div>
      </div>
      <button
        type="button"
        disabled={pending || !!playsError || !!likesError}
        onClick={() => onSave({ label, plays, likes })}
        className="mt-3 bg-[#FDDD58] text-black font-display uppercase tracking-widest px-5 py-2 text-xs disabled:opacity-40"
      >
        Save
      </button>
    </div>
  );
}
