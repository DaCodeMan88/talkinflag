import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin";

export const dynamic = "force-dynamic";

const LEVEL_LABEL: Record<string, string> = {
  high_school: "HS",
  college: "College",
  national: "National",
};

export default async function AdminPlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  if (!(await getAdminUser())) redirect("/");
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("players")
    .select("id, first_name, last_name, position, level, school_or_team, country, is_verified, is_claimed")
    .order("last_name", { ascending: true })
    .limit(100);

  if (q?.trim()) {
    const term = `%${q.trim()}%`;
    query = query.or(
      `first_name.ilike.${term},last_name.ilike.${term},school_or_team.ilike.${term}`
    );
  }

  const { data: players } = await query;
  const { count: total } = await supabase
    .from("players")
    .select("id", { count: "exact", head: true });

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div className="border-l-4 border-[#FDDD58] pl-6">
          <Link href="/admin" className="text-white/40 text-xs hover:text-white transition-colors">← Admin</Link>
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

      <form method="get" className="mb-6">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by name or team…"
          className="w-full bg-[#111] border border-white/10 text-white placeholder-white/25 px-4 py-3 text-sm focus:outline-none focus:border-[#FDDD58]/50 transition-colors"
        />
      </form>

      {q?.trim() && (
        <p className="text-white/30 text-xs mb-4">
          Showing matches for &ldquo;{q.trim()}&rdquo;{" "}
          <Link href="/admin/players" className="text-[#FDDD58] hover:underline">clear</Link>
        </p>
      )}

      <div className="space-y-2">
        {(players ?? []).map((p) => (
          <Link
            key={p.id}
            href={`/admin/players/${p.id}/edit`}
            className="flex items-center justify-between bg-[#0d0d0d] border border-white/10 hover:border-[#FDDD58]/40 transition-colors px-4 py-3 group"
          >
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold group-hover:text-[#FDDD58] transition-colors truncate">
                {p.first_name} {p.last_name}
              </p>
              <p className="text-white/35 text-xs truncate">
                {[p.position, p.level ? LEVEL_LABEL[p.level] ?? p.level : null, p.school_or_team, p.country]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              {p.is_verified && (
                <span className="text-[#FDDD58] text-[10px] font-display uppercase tracking-widest">✓ Verified</span>
              )}
              {p.is_claimed && (
                <span className="text-white/30 text-[10px] font-display uppercase tracking-widest">Claimed</span>
              )}
              <span className="text-white/20 group-hover:text-[#FDDD58] transition-colors">→</span>
            </div>
          </Link>
        ))}
        {(players ?? []).length === 0 && (
          <p className="text-white/30 text-sm py-8 text-center">No players found.</p>
        )}
      </div>

      {(players ?? []).length === 100 && (
        <p className="text-white/25 text-xs mt-4 text-center">
          Showing first 100. Use search to narrow down.
        </p>
      )}
    </div>
  );
}
