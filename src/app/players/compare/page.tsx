import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/lib/seo";
import { CompareShareButton } from "./CompareShareButton";
import { formatHeight, formatWeight } from "@/lib/measurements";

export const revalidate = 0; // always fresh — URL params drive content

type Props = { searchParams: Promise<{ a?: string; b?: string }> };

type ComparePlayer = {
  id: string;
  first_name: string;
  last_name: string;
  position: string | null;
  level: string | null;
  school_or_team: string | null;
  country: string | null;
  photo_url: string | null;
  ranking_national: number | null;
  height_in: number | null;
  weight_lbs: number | null;
  stats: Record<string, string | number> | null;
  is_verified: boolean;
  grad_year: number | null;
};

export async function generateMetadata({ searchParams }: Props) {
  const { a, b } = await searchParams;
  if (!a || !b) return buildMetadata({ title: "Compare Players | Talkin Flag", description: "Compare flag football players side-by-side — stats, ranking, and measurables.", path: "/players/compare" });
  const supabase = await createClient();
  const [{ data: pa }, { data: pb }] = await Promise.all([
    supabase.from("players").select("first_name, last_name").eq("id", a).single(),
    supabase.from("players").select("first_name, last_name").eq("id", b).single(),
  ]);
  const nameA = pa ? `${pa.first_name} ${pa.last_name}` : "Player A";
  const nameB = pb ? `${pb.first_name} ${pb.last_name}` : "Player B";
  return buildMetadata({
    title: `${nameA} vs ${nameB} | Talkin Flag`,
    description: `Side-by-side flag football comparison: ${nameA} vs ${nameB}. Stats, ranking, and measurables.`,
    path: "/players/compare",
  });
}

function formatLevel(level: string | null): string {
  if (!level) return "";
  const map: Record<string, string> = {
    high_school: "High School", college: "College", pro: "Pro",
    national_team: "National Team", youth: "Youth",
  };
  return map[level] ?? level.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

type StatRow = {
  label: string;
  aVal: string | null;
  bVal: string | null;
  aNum: number | null;
  bNum: number | null;
  lowerIsBetter?: boolean; // e.g. 40-yard dash
};

function buildStatRows(a: ComparePlayer, b: ComparePlayer): StatRow[] {
  const statsA = a.stats ?? {};
  const statsB = b.stats ?? {};
  const rows: StatRow[] = [];

  // National rank
  if (a.ranking_national || b.ranking_national) {
    rows.push({
      label: "National Rank",
      aVal: a.ranking_national ? `#${a.ranking_national}` : null,
      bVal: b.ranking_national ? `#${b.ranking_national}` : null,
      aNum: a.ranking_national,
      bNum: b.ranking_national,
      lowerIsBetter: true,
    });
  }

  // Height
  if (a.height_in || b.height_in) {
    rows.push({
      label: "Height",
      aVal: a.height_in ? formatHeight(a.height_in) : null,
      bVal: b.height_in ? formatHeight(b.height_in) : null,
      aNum: a.height_in,
      bNum: b.height_in,
    });
  }

  // Weight
  if (a.weight_lbs || b.weight_lbs) {
    rows.push({
      label: "Weight",
      aVal: a.weight_lbs ? formatWeight(a.weight_lbs) : null,
      bVal: b.weight_lbs ? formatWeight(b.weight_lbs) : null,
      aNum: a.weight_lbs,
      bNum: b.weight_lbs,
    });
  }

  // 40-yard dash
  const fortyA = statsA.forty_yard ? parseFloat(String(statsA.forty_yard)) : null;
  const fortyB = statsB.forty_yard ? parseFloat(String(statsB.forty_yard)) : null;
  if (fortyA || fortyB) {
    rows.push({
      label: "40-Yard Dash",
      aVal: fortyA ? `${fortyA}s` : null,
      bVal: fortyB ? `${fortyB}s` : null,
      aNum: fortyA,
      bNum: fortyB,
      lowerIsBetter: true,
    });
  }

  // Vertical jump
  const vertA = statsA.vertical_jump ? parseFloat(String(statsA.vertical_jump)) : null;
  const vertB = statsB.vertical_jump ? parseFloat(String(statsB.vertical_jump)) : null;
  if (vertA || vertB) {
    rows.push({
      label: "Vertical Jump",
      aVal: vertA ? `${vertA}"` : null,
      bVal: vertB ? `${vertB}"` : null,
      aNum: vertA,
      bNum: vertB,
    });
  }

  // World appearances / caps
  const capsA = statsA.world_appearances ? parseInt(String(statsA.world_appearances)) : null;
  const capsB = statsB.world_appearances ? parseInt(String(statsB.world_appearances)) : null;
  if (capsA || capsB) {
    rows.push({
      label: "World Appearances",
      aVal: capsA ? String(capsA) : null,
      bVal: capsB ? String(capsB) : null,
      aNum: capsA,
      bNum: capsB,
    });
  }

  // Grad year
  if (a.grad_year || b.grad_year) {
    rows.push({
      label: "Class Year",
      aVal: a.grad_year ? String(a.grad_year) : null,
      bVal: b.grad_year ? String(b.grad_year) : null,
      aNum: null,
      bNum: null,
    });
  }

  return rows;
}

function winner(row: StatRow): "a" | "b" | null {
  if (row.aNum === null || row.bNum === null) return null;
  if (row.aNum === row.bNum) return null;
  if (row.lowerIsBetter) return row.aNum < row.bNum ? "a" : "b";
  return row.aNum > row.bNum ? "a" : "b";
}

async function ComparePlayers({ idA, idB }: { idA: string; idB: string }) {
  const supabase = await createClient();
  const [{ data: rawA }, { data: rawB }] = await Promise.all([
    supabase
      .from("players")
      .select("id, first_name, last_name, position, level, school_or_team, country, photo_url, ranking_national, height_in, weight_lbs, stats, is_verified, grad_year")
      .eq("id", idA)
      .single(),
    supabase
      .from("players")
      .select("id, first_name, last_name, position, level, school_or_team, country, photo_url, ranking_national, height_in, weight_lbs, stats, is_verified, grad_year")
      .eq("id", idB)
      .single(),
  ]);

  if (!rawA || !rawB) notFound();

  const a = rawA as ComparePlayer;
  const b = rawB as ComparePlayer;
  const rows = buildStatRows(a, b);

  const aWins = rows.filter((r) => winner(r) === "a").length;
  const bWins = rows.filter((r) => winner(r) === "b").length;

  function PlayerCard({ p, wins, side }: { p: ComparePlayer; wins: number; side: "a" | "b" }) {
    return (
      <div className={`flex flex-col items-center text-center p-6 ${side === "a" ? "border-r border-white/10" : ""}`}>
        {/* Photo */}
        <div className="relative w-24 h-24 mb-4">
          {p.photo_url ? (
            <Image
              src={p.photo_url}
              alt={`${p.first_name} ${p.last_name}`}
              fill
              className="object-cover object-top rounded-full border-2 border-[#FDDD58]/40"
              sizes="96px"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-[#FDDD58]/10 border-2 border-[#FDDD58]/30 flex items-center justify-center">
              <span className="font-display text-2xl text-[#FDDD58]">
                {p.first_name[0]}{p.last_name[0]}
              </span>
            </div>
          )}
          {p.is_verified && (
            <div className="absolute -bottom-1 -right-1 bg-[#FDDD58] text-black text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
              ✓
            </div>
          )}
        </div>

        <Link
          href={`/players/${p.id}`}
          className="font-display text-xl md:text-2xl uppercase text-white hover:text-[#FDDD58] transition-colors leading-tight"
        >
          {p.first_name} {p.last_name}
        </Link>
        <p className="text-white/40 text-xs mt-1">
          {[p.position, formatLevel(p.level), p.school_or_team, p.country]
            .filter(Boolean)
            .join(" · ")}
        </p>

        {/* Win count */}
        {rows.length > 0 && (
          <div className="mt-4 inline-flex items-center gap-2 bg-[#FDDD58]/10 border border-[#FDDD58]/20 px-3 py-1.5">
            <span className="font-display text-[#FDDD58] text-sm">{wins}</span>
            <span className="text-white/30 text-xs uppercase tracking-widest">
              stat{wins !== 1 ? "s" : ""} won
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Player headers */}
      <div className="grid grid-cols-2 bg-[#0d0d0d] border border-white/10">
        <PlayerCard p={a} wins={aWins} side="a" />
        <PlayerCard p={b} wins={bWins} side="b" />
      </div>

      {/* Stat rows */}
      {rows.length > 0 ? (
        <div className="border border-white/10 divide-y divide-white/5">
          {rows.map((row) => {
            const w = winner(row);
            return (
              <div key={row.label} className="grid grid-cols-3 items-center">
                {/* A value */}
                <div
                  className={`px-5 py-4 text-center font-display text-lg ${
                    w === "a"
                      ? "bg-[#FDDD58]/10 text-[#FDDD58]"
                      : "text-white/60"
                  }`}
                >
                  {row.aVal ?? <span className="text-white/15 text-sm">—</span>}
                  {w === "a" && <span className="ml-2 text-[#FDDD58] text-xs">▲</span>}
                </div>

                {/* Label */}
                <div className="px-3 py-4 text-center">
                  <span className="text-white/30 text-xs font-display uppercase tracking-widest">
                    {row.label}
                  </span>
                </div>

                {/* B value */}
                <div
                  className={`px-5 py-4 text-center font-display text-lg ${
                    w === "b"
                      ? "bg-[#FDDD58]/10 text-[#FDDD58]"
                      : "text-white/60"
                  }`}
                >
                  {w === "b" && <span className="mr-2 text-[#FDDD58] text-xs">▲</span>}
                  {row.bVal ?? <span className="text-white/15 text-sm">—</span>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 border border-white/10">
          <p className="text-white/30 text-sm">No comparable stats available for these players yet.</p>
        </div>
      )}

      {/* Share + actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
        <div className="flex gap-4">
          <Link
            href={`/players/${a.id}`}
            className="text-white/40 hover:text-white text-xs font-display uppercase tracking-widest transition-colors"
          >
            {a.first_name}'s Profile →
          </Link>
          <Link
            href={`/players/${b.id}`}
            className="text-white/40 hover:text-white text-xs font-display uppercase tracking-widest transition-colors"
          >
            {b.first_name}'s Profile →
          </Link>
        </div>
        <CompareShareButton />
      </div>
    </div>
  );
}

export default async function ComparePlayersPage({ searchParams }: Props) {
  const { a, b } = await searchParams;

  return (
    <div className="bg-brand-black min-h-screen">
      {/* Header */}
      <div className="bg-[#FDDD58] px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/players"
            className="text-black/40 font-display text-xs uppercase tracking-widest hover:text-black/70 transition-colors"
          >
            ← Players
          </Link>
          <h1 className="font-display text-4xl md:text-6xl uppercase text-black leading-none mt-4">
            Compare
          </h1>
          <p className="text-black/60 mt-2 text-sm">
            Side-by-side stat comparison. Yellow = edge.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {a && b ? (
          <Suspense fallback={
            <div className="space-y-4 animate-pulse">
              <div className="h-48 bg-white/5 rounded-sm" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 bg-white/5 rounded-sm" />
              ))}
            </div>
          }>
            <ComparePlayers idA={a} idB={b} />
          </Suspense>
        ) : (
          <div className="text-center py-20">
            <p className="text-white/30 font-display uppercase tracking-widest text-sm mb-4">
              No players selected
            </p>
            <p className="text-white/20 text-sm mb-8">
              Use the Compare button on any player profile to get started.
            </p>
            <Link
              href="/players"
              className="bg-[#FDDD58] text-black font-display uppercase tracking-widest px-6 py-3 text-sm hover:bg-[#FDDD58]/80 transition-colors"
            >
              Browse Players →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
