"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { deleteMember, sendNudge } from "./actions";

export interface MemberRow {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  playerName: string | null;
  playerId: string | null;
  claimPending: boolean;
  isVerifiedPlayer: boolean;
  profilePct: number | null;
  lastNudgeAt: string | null;
  coachName: string | null;
  coachVerified: boolean;
  evalCount: number;
  lastEvalAt: string | null;
  iqBest: number | null;
}

const FILTERS = ["Players", "Coaches", "Verified", "New this week", "No profile"] as const;
type Filter = (typeof FILTERS)[number];
type Sort = "newest" | "lastActive" | "mostEvals";

function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

function joinDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function matches(m: MemberRow, filters: Set<Filter>, weekAgo: number): boolean {
  for (const f of filters) {
    if (f === "Players" && !m.playerId) return false;
    if (f === "Coaches" && !m.coachName) return false;
    if (f === "Verified" && !(m.isVerifiedPlayer || m.coachVerified)) return false;
    if (f === "New this week" && new Date(m.createdAt).getTime() < weekAgo) return false;
    if (f === "No profile" && (m.playerId || m.coachName)) return false;
  }
  return true;
}

function ProfileBar({ pct }: { pct: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="w-14 h-1 bg-white/10 rounded-full overflow-hidden inline-block">
        <span className="block h-full bg-[#FDDD58]" style={{ width: `${pct}%` }} />
      </span>
      <span className="text-white/50 text-xs">{pct}%</span>
    </span>
  );
}

function ProfileCell({ m }: { m: MemberRow }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2 min-w-0">
      {m.playerId ? (
        <Link href={`/admin/players/${m.playerId}/edit`} className="text-[#FDDD58] hover:underline truncate">
          {m.playerName}
        </Link>
      ) : m.coachName ? (
        <span className="text-white/70 truncate">{m.coachName} (coach)</span>
      ) : (
        <span className="border border-white/15 text-white/30 text-[10px] uppercase tracking-widest px-1.5 py-0.5">No player profile</span>
      )}
      {m.claimPending && (
        <span className="border border-white/20 text-white/40 text-[10px] uppercase tracking-widest px-1.5 py-0.5">
          Pending
        </span>
      )}
      {(m.isVerifiedPlayer || m.coachVerified) && (
        <span className="border border-[#FDDD58]/40 text-[#FDDD58] text-[10px] uppercase tracking-widest px-1.5 py-0.5">
          ✓ Verified
        </span>
      )}
    </span>
  );
}

function NudgeMember({ member }: { member: MemberRow }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={pending || sent}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            try {
              await sendNudge(member.id);
              setSent(true);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Failed to send nudge.");
            }
          })
        }
        className="text-white/30 hover:text-[#FDDD58] text-xs transition-colors disabled:opacity-50"
      >
        {sent ? "Sent ✓" : pending ? "Sending…" : "Nudge"}
      </button>
      {!sent && member.lastNudgeAt && (
        <span className="text-white/20 text-[10px]">nudged {timeAgo(member.lastNudgeAt)}</span>
      )}
      {error && <span className="text-red-400 text-xs">{error}</span>}
    </span>
  );
}

function DeleteMember({ member, currentUserId }: { member: MemberRow; currentUserId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (member.id === currentUserId) return null;

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => { setError(null); setConfirming(true); }}
        className="text-white/30 hover:text-red-400 text-xs transition-colors"
      >
        Delete
      </button>
    );
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <span className="inline-flex items-center gap-2">
        <span className="text-white/60 text-xs">Delete this login permanently?</span>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              try {
                await deleteMember(member.id);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to delete member.");
              }
            })
          }
          className="text-red-400 hover:text-red-300 text-xs disabled:opacity-50 transition-colors"
        >
          Confirm
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => { setConfirming(false); setError(null); }}
          className="text-white/30 hover:text-white/60 text-xs disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
      </span>
      {error && <span className="text-red-400 text-xs">{error}</span>}
    </span>
  );
}

export default function MembersTable({ members, currentUserId }: { members: MemberRow[]; currentUserId: string }) {
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Set<Filter>>(new Set());
  const [sort, setSort] = useState<Sort>("newest");

  const weekAgo = Date.now() - 7 * 864e5;
  const newThisWeek = members.filter((m) => new Date(m.createdAt).getTime() >= weekAgo).length;

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = members.filter((m) => {
      if (!matches(m, filters, weekAgo)) return false;
      if (!needle) return true;
      return [m.email, m.playerName, m.coachName].some((v) => v?.toLowerCase().includes(needle));
    });
    out.sort((a, b) => {
      if (sort === "lastActive") return (b.lastSignInAt ?? "").localeCompare(a.lastSignInAt ?? "");
      if (sort === "mostEvals") return b.evalCount - a.evalCount;
      return b.createdAt.localeCompare(a.createdAt);
    });
    return out;
  }, [members, q, filters, sort, weekAgo]);

  function toggleFilter(f: Filter) {
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  }

  return (
    <div className="space-y-5">
      <p className="text-white/40 text-sm">
        <span className="text-white font-display text-lg">{members.length}</span> members ·{" "}
        <span className="text-[#FDDD58]">{newThisWeek} new this week</span>
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search email or name…"
          aria-label="Search members"
          className="flex-1 bg-[#111111] border border-white/10 text-white placeholder-white/20 px-4 py-2.5 text-sm focus:outline-none focus:border-[#FDDD58]/50 transition-colors"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          aria-label="Sort members"
          className="bg-[#111111] border border-white/10 text-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#FDDD58]/50 transition-colors"
        >
          <option value="newest">Newest</option>
          <option value="lastActive">Last active</option>
          <option value="mostEvals">Most evals</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => toggleFilter(f)}
            aria-pressed={filters.has(f)}
            className={`text-xs font-display uppercase tracking-widest px-3 py-1.5 border transition-colors ${
              filters.has(f)
                ? "bg-[#FDDD58] text-black border-[#FDDD58]"
                : "border-white/10 text-white/40 hover:text-white/70"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block overflow-x-auto border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/30 text-[10px] uppercase tracking-widest border-b border-white/10">
              <th className="px-4 py-3 font-normal">Member</th>
              <th className="px-4 py-3 font-normal">Profile</th>
              <th className="px-4 py-3 font-normal">Last sign-in</th>
              <th className="px-4 py-3 font-normal">Evals</th>
              <th className="px-4 py-3 font-normal">IQ best</th>
              <th className="px-4 py-3 font-normal">Profile %</th>
              <th className="px-4 py-3 font-normal">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((m) => (
              <tr key={m.id} className="bg-[#0d0d0d]">
                <td className="px-4 py-3">
                  <p className="text-white/80 truncate max-w-[240px]">{m.email}</p>
                  <p className="text-white/25 text-xs mt-0.5">Joined {joinDate(m.createdAt)}</p>
                </td>
                <td className="px-4 py-3"><ProfileCell m={m} /></td>
                <td className="px-4 py-3 text-white/50">{timeAgo(m.lastSignInAt)}</td>
                <td className="px-4 py-3 text-white/50">
                  {m.evalCount}
                  {m.lastEvalAt && <span className="text-white/25 text-xs"> · {timeAgo(m.lastEvalAt)}</span>}
                </td>
                <td className="px-4 py-3 text-white/50">{m.iqBest != null ? `${m.iqBest}%` : "—"}</td>
                <td className="px-4 py-3">{m.profilePct != null ? <ProfileBar pct={m.profilePct} /> : <span className="text-white/25">—</span>}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-3">
                    <NudgeMember member={m} />
                    <DeleteMember member={m} currentUserId={currentUserId} />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="text-white/30 text-sm p-6 text-center">No members match.</p>
        )}
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {rows.map((m) => (
          <div key={m.id} className="bg-[#0d0d0d] border border-white/10 p-4 space-y-2 min-w-0">
            <p className="text-white/80 text-sm truncate">{m.email}</p>
            <p className="text-white/25 text-xs">
              Joined {joinDate(m.createdAt)} · Last sign-in {timeAgo(m.lastSignInAt)}
            </p>
            <ProfileCell m={m} />
            <p className="text-white/50 text-xs">
              Evals {m.evalCount}
              {m.iqBest != null && ` · IQ ${m.iqBest}%`}
            </p>
            {m.profilePct != null && <ProfileBar pct={m.profilePct} />}
            <div className="pt-1 flex items-center gap-4">
              <NudgeMember member={m} />
              <DeleteMember member={m} currentUserId={currentUserId} />
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-white/30 text-sm p-6 text-center">No members match.</p>}
      </div>
    </div>
  );
}
