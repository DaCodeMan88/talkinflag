import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { getAdminUser } from "@/lib/admin";
import PendingReviewActions from "./PendingReviewActions";
import { DENIAL_PRESETS } from "@/lib/review/denial-presets";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const LEVEL_LABEL: Record<string, string> = {
  high_school: "HS",
  college: "College",
  national: "National",
};

export default async function AdminPlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string; page?: string }>;
}) {
  if (!(await getAdminUser())) redirect("/");
  const { q, tab, page: pageParam } = await searchParams;
  const pending = tab === "pending";
  const denied = tab === "denied";
  const searching = !pending && !denied && !!q?.trim();
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const supabase = createServerClient();

  // Default view: newest additions first. Search results: alphabetical.
  // Denied: most-recently denied first.
  let query = supabase
    .from("players")
    .select("id, first_name, last_name, position, level, school_or_team, country, is_verified, is_claimed, is_approved, claimed_by, created_at, review_status, denial_reason, denied_at")
    .order(denied ? "denied_at" : searching ? "last_name" : "created_at", {
      ascending: pending || searching,
    })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const term = `%${q?.trim()}%`;
  const searchFilter = `first_name.ilike.${term},last_name.ilike.${term},school_or_team.ilike.${term}`;
  if (pending) {
    query = query.eq("review_status", "pending");
  } else if (denied) {
    query = query.eq("review_status", "denied");
  } else if (searching) {
    query = query.or(searchFilter);
  }

  const { data: players } = await query;
  const [{ count: total }, { count: pendingCount }, { count: deniedCount }, { count: searchCount }] = await Promise.all([
    supabase.from("players").select("id", { count: "exact", head: true }),
    supabase.from("players").select("id", { count: "exact", head: true }).eq("review_status", "pending"),
    supabase.from("players").select("id", { count: "exact", head: true }).eq("review_status", "denied"),
    searching
      ? supabase.from("players").select("id", { count: "exact", head: true }).or(searchFilter)
      : Promise.resolve({ count: null as number | null }),
  ]);

  const listCount = pending ? pendingCount ?? 0 : denied ? deniedCount ?? 0 : searching ? searchCount ?? 0 : total ?? 0;
  const totalPages = Math.max(1, Math.ceil(listCount / PAGE_SIZE));
  const pageHref = (p: number) =>
    `/admin/players?${new URLSearchParams({
      ...(q?.trim() ? { q: q.trim() } : {}),
      ...(tab ? { tab } : {}),
      ...(p > 1 ? { page: String(p) } : {}),
    }).toString()}`.replace(/\?$/, "");

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div className="border-l-4 border-[#FDDD58] pl-6">
          <h1 className="font-display text-4xl uppercase text-white leading-none mt-1">Players</h1>
          <p className="text-white/40 mt-2 text-sm">{total ?? 0} players in the database</p>
        </div>
        <Link
          href="/admin/players/new"
          className="bg-[#FDDD58] text-black font-display uppercase tracking-widest text-xs py-2.5 px-5 hover:bg-[#FDDD58]/90 transition-colors shrink-0"
        >
          + Add Player
        </Link>
      </div>

      <div className="flex items-center gap-1 mb-6 border-b border-white/10">
        <Link
          href="/admin/players"
          className={`px-4 py-2 text-xs font-display uppercase tracking-widest border-b-2 transition-colors ${
            !pending ? "border-[#FDDD58] text-[#FDDD58]" : "border-transparent text-white/40 hover:text-white/70"
          }`}
        >
          All
        </Link>
        <Link
          href="/admin/players?tab=pending"
          className={`px-4 py-2 text-xs font-display uppercase tracking-widest border-b-2 transition-colors flex items-center gap-2 ${
            pending ? "border-[#FDDD58] text-[#FDDD58]" : "border-transparent text-white/40 hover:text-white/70"
          }`}
        >
          Pending Review
          {(pendingCount ?? 0) > 0 && (
            <span className="bg-[#FDDD58] text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingCount}</span>
          )}
        </Link>
        <Link
          href="/admin/players?tab=denied"
          className={`px-4 py-2 text-xs font-display uppercase tracking-widest border-b-2 transition-colors flex items-center gap-2 ${
            denied ? "border-[#FDDD58] text-[#FDDD58]" : "border-transparent text-white/40 hover:text-white/70"
          }`}
        >
          Denied
          {(deniedCount ?? 0) > 0 && (
            <span className="bg-white/15 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{deniedCount}</span>
          )}
        </Link>
      </div>

      {!pending && !denied && (
        <form method="get" className="mb-6">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search by name or team…"
            className="w-full bg-[#111] border border-white/10 text-white placeholder-white/25 px-4 py-3 text-sm focus:outline-none focus:border-[#FDDD58]/50 transition-colors"
          />
        </form>
      )}

      {searching && (
        <p className="text-white/30 text-xs mb-4">
          {searchCount ?? 0} result{(searchCount ?? 0) === 1 ? "" : "s"} for &ldquo;{q!.trim()}&rdquo;{" "}
          <Link href="/admin/players" className="text-[#FDDD58] hover:underline">clear</Link>
        </p>
      )}

      {pending && (players ?? []).length === 0 && (
        <p className="text-white/50 text-sm py-8 text-center">No pending registrations. ✓</p>
      )}

      {denied && (players ?? []).length === 0 && (
        <p className="text-white/50 text-sm py-8 text-center">No denied profiles.</p>
      )}

      <div className="space-y-2">
        {(players ?? []).map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between bg-[#0d0d0d] border border-white/10 hover:border-[#FDDD58]/40 transition-colors px-4 py-3 group"
          >
            <Link href={`/admin/players/${p.id}/edit`} className="min-w-0 flex-1">
              <p className="text-white text-sm font-semibold group-hover:text-[#FDDD58] transition-colors truncate">
                {p.first_name} {p.last_name}
              </p>
              <p className="text-white/35 text-xs truncate">
                {[p.position, p.level ? LEVEL_LABEL[p.level] ?? p.level : null, p.school_or_team, p.country]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {denied && (
                <p className="text-white/30 text-xs mt-1 truncate">
                  <span className="text-red-400/80">
                    {p.denial_reason
                      ? DENIAL_PRESETS[p.denial_reason]?.label ?? p.denial_reason
                      : "Denied"}
                  </span>
                  {p.denied_at && (
                    <span className="text-white/25">
                      {" · "}
                      {new Date(p.denied_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  )}
                </p>
              )}
            </Link>
            <div className="flex items-center gap-3 shrink-0 ml-3">
              {p.is_verified && (
                <span className="text-[#FDDD58] text-[10px] font-display uppercase tracking-widest">✓ Verified</span>
              )}
              {p.is_claimed && !pending && (
                <span className="text-white/30 text-[10px] font-display uppercase tracking-widest">Claimed</span>
              )}
              {pending ? (
                <PendingReviewActions playerId={p.id} />
              ) : denied ? (
                <PendingReviewActions playerId={p.id} mode="denied" />
              ) : (
                <Link href={`/admin/players/${p.id}/edit`} className="text-white/20 group-hover:text-[#FDDD58] transition-colors">→</Link>
              )}
            </div>
          </div>
        ))}
        {!pending && !denied && (players ?? []).length === 0 && (
          <p className="text-white/30 text-sm py-8 text-center">No players found.</p>
        )}
      </div>

      {!pending && !denied && totalPages > 1 && (
        <div className="flex items-center justify-center gap-6 mt-6">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="text-[#FDDD58] text-xs font-display uppercase tracking-widest hover:underline">
              ← Prev
            </Link>
          ) : (
            <span className="w-14" />
          )}
          <span className="text-white/40 text-xs font-display uppercase tracking-widest">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={pageHref(page + 1)} className="text-[#FDDD58] text-xs font-display uppercase tracking-widest hover:underline">
              Next →
            </Link>
          ) : (
            <span className="w-14" />
          )}
        </div>
      )}
    </div>
  );
}
