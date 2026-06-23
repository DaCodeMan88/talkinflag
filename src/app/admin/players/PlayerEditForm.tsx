"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPlayer, updatePlayer, deletePlayer } from "./actions";
import type { Player } from "@/types/player";

const POSITIONS = ["QB", "WR", "DB", "LB", "C", "Rusher", "Utility"];
const LEVELS = [
  { value: "high_school", label: "High School" },
  { value: "college", label: "College" },
  { value: "national", label: "National" },
];

const inputCls =
  "w-full bg-[#111] border border-white/10 text-white placeholder-white/20 px-3 py-2 text-sm focus:outline-none focus:border-[#FDDD58]/50 transition-colors";
const labelCls =
  "block text-[11px] font-display uppercase tracking-widest text-white/40 mb-1.5";

export default function PlayerEditForm({ player }: { player?: Player }) {
  const isEdit = !!player;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const statsDefault = player?.stats
    ? JSON.stringify(player.stats, null, 2)
    : "{}";

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        if (isEdit) {
          await updatePlayer(player!.id, fd);
          router.push(`/players/${player!.id}`);
        } else {
          await createPlayer(fd);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      try {
        await deletePlayer(player!.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Delete failed");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-900/30 border border-red-500/30 text-red-400 text-sm px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>First Name *</label>
          <input name="first_name" defaultValue={player?.first_name ?? ""} required className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Last Name *</label>
          <input name="last_name" defaultValue={player?.last_name ?? ""} required className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>Position</label>
          <select name="position" defaultValue={player?.position ?? ""} className={inputCls}>
            <option value="">—</option>
            {POSITIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Level</label>
          <select name="level" defaultValue={player?.level ?? ""} className={inputCls}>
            <option value="">—</option>
            {LEVELS.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Gender</label>
          <select name="gender" defaultValue={player?.gender ?? ""} className={inputCls}>
            <option value="">—</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>School / Team</label>
        <input name="school_or_team" defaultValue={player?.school_or_team ?? ""} className={inputCls} />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div>
          <label className={labelCls}>Grad Year</label>
          <input name="grad_year" type="number" defaultValue={player?.grad_year ?? ""} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Height (in)</label>
          <input name="height_in" type="number" defaultValue={player?.height_in ?? ""} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Weight (lbs)</label>
          <input name="weight_lbs" type="number" defaultValue={player?.weight_lbs ?? ""} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>State</label>
          <input name="state" defaultValue={player?.state ?? ""} className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>City</label>
          <input name="city" defaultValue={player?.city ?? ""} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Country</label>
          <input name="country" defaultValue={player?.country ?? ""} className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Bio</label>
        <textarea name="bio" defaultValue={player?.bio ?? ""} rows={3} className={inputCls} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Instagram (handle)</label>
          <input name="instagram" defaultValue={player?.instagram ?? ""} placeholder="@username" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Highlight URL</label>
          <input name="highlight_url" defaultValue={player?.highlight_url ?? ""} className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Photo URL</label>
        <input name="photo_url" defaultValue={player?.photo_url ?? ""} className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Extended Stats (JSON)</label>
        <textarea
          name="stats"
          defaultValue={statsDefault}
          rows={8}
          spellCheck={false}
          className={`${inputCls} font-mono text-xs`}
        />
        <p className="text-white/25 text-xs mt-1.5">
          Free-form measurables &amp; achievements (e.g. forty_yard, vertical_jump, caps, achievements[], tournaments[]). Must be a valid JSON object.
        </p>
      </div>

      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          name="is_verified"
          defaultChecked={player?.is_verified ?? false}
          className="w-4 h-4 accent-[#FDDD58]"
        />
        <span className="text-sm text-white/70 font-display uppercase tracking-widest">
          Verified athlete (✓ badge)
        </span>
      </label>

      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-[#FDDD58] text-black font-display uppercase tracking-widest text-sm py-2.5 px-6 hover:bg-[#FDDD58]/90 transition-colors disabled:opacity-50"
        >
          {pending ? "Saving…" : isEdit ? "Save Changes" : "Create Player"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-white/40 text-xs font-display uppercase tracking-widest hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>

      {isEdit && (
        <div className="border-t border-white/10 pt-6 mt-8">
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="text-red-400/70 text-xs font-display uppercase tracking-widest hover:text-red-400 transition-colors"
            >
              Delete this player
            </button>
          ) : (
            <div className="flex items-center gap-4">
              <span className="text-red-400 text-xs">Permanently delete? This cannot be undone.</span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={pending}
                className="bg-red-600 text-white font-display uppercase tracking-widest text-xs py-2 px-4 hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                Confirm Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-white/40 text-xs font-display uppercase tracking-widest"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
