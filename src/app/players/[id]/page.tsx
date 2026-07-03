import { safeJsonLd } from "@/lib/jsonld";
import { createServerClient } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import type { Player } from "@/types/player";
import { buildMetadata } from "@/lib/seo";
import { PlayerCard } from "@/components/players/PlayerCard";
import CoachViewTracker from "./CoachViewTracker";
import ShareCardModal from "./ShareCardModal";
import FollowButton from "@/components/ui/FollowButton";
import { CompareButton } from "./CompareButton";
import SimilarPlayers from "@/components/player/SimilarPlayers";
import CareerUpdates from "@/components/career/CareerUpdates";
import FlagIQBadge from "@/components/player/FlagIQBadge";
import { formatHeight, formatWeight } from "@/lib/measurements";
import ReportProfileButton from "@/components/players/ReportProfileButton";

export const revalidate = 300;

// ─── Types ───────────────────────────────────────────────────────────────────

interface Tournament {
  year: number;
  event: string;
  location?: string;
  result: string;
}

interface ExtendedStats {
  caps?: number;
  achievements?: string[];
  occupation?: string;
  education?: string;
  tournaments?: Tournament[];
  forty_yard?: string;
  vertical_jump?: string;
  world_appearances?: number;
  years_active?: number;
  [key: string]: unknown;
}

const ATHLETICISM_KEYS = ["forty_yard", "vertical_jump", "world_appearances", "years_active"] as const;
const ATHLETICISM_LABELS: Record<string, string> = {
  forty_yard:        "40-Yd Dash",
  vertical_jump:     "Vertical",
  world_appearances: "World Apps.",
  years_active:      "Yrs Active",
};
const META_KEYS = ["caps", "achievements", "occupation", "education", "tournaments",
  ...ATHLETICISM_KEYS];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isSafeUrl(url: string | null | undefined): boolean {
  return !!(url && (url.startsWith("https://") || url.startsWith("http://")));
}

function formatLevel(level: string | null): string {
  if (!level) return "";
  const map: Record<string, string> = {
    high_school: "High School",
    college: "College",
    national: "National Team",
    international: "International",
    youth: "Youth",
  };
  return map[level] ?? level.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function countryFlag(code: string | null | undefined): string {
  if (!code || code.length !== 2) return "";
  const offset = 127397;
  return Array.from(code.toUpperCase())
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + offset))
    .join("");
}

/** SEO description shared by generateMetadata and the Person JSON-LD. */
function playerSeoDescription(p: {
  first_name: string;
  last_name: string;
  position?: string | null;
  school_or_team?: string | null;
  level?: string | null;
  is_verified?: boolean | null;
}): string {
  const name = `${p.first_name} ${p.last_name}`;
  const levelLabel: Record<string, string> = {
    high_school: "high school",
    college: "college",
    national: "national team",
    international: "international",
    youth: "youth",
  };
  const levelStr = p.level ? levelLabel[p.level] ?? p.level : "";
  const verifiedStr = p.is_verified ? " Verified athlete." : "";
  const parts = [
    p.position ? `${name} — ${p.position}` : name,
    p.school_or_team || null,
    levelStr ? `${levelStr} flag football player` : "flag football player",
  ].filter(Boolean);
  return `${parts.join(" · ")}. Profile on Talkin Flag.${verifiedStr}`;
}

// ─── Static params ────────────────────────────────────────────────────────────

export async function generateStaticParams(): Promise<{ id: string }[]> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase.from("players").select("id").eq("is_verified", true);
    return (data ?? []).map((row) => ({ id: row.id as string }));
  } catch {
    return [];
  }
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = createServerClient();
  const { data: player } = await supabase
    .from("players")
    .select(
      "first_name, last_name, position, level, school_or_team, country, state, gender, is_verified, instagram, stats"
    )
    .eq("id", id)
    .single();

  if (!player) return { title: "Player Not Found | Talkin Flag" };

  const name = `${player.first_name} ${player.last_name}`;
  const locationParts = [player.school_or_team, player.state].filter(Boolean).join(" · ");
  const title = player.position
    ? `${name} — ${player.position}${locationParts ? ` | ${locationParts}` : ""} | Talkin Flag`
    : `${name}${locationParts ? ` | ${locationParts}` : ""} | Talkin Flag`;

  const description = playerSeoDescription(player);

  const base = buildMetadata({
    title,
    description,
    path: `/players/${id}`,
  });
  if (base.openGraph) delete (base.openGraph as Record<string, unknown>).images;
  if (base.twitter) delete (base.twitter as Record<string, unknown>).images;
  return base;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data: player } = (await supabase
    .from("players")
    .select("*")
    .eq("id", id)
    .single()) as { data: Player | null };

  if (!player) notFound();

  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();

  // Unapproved self-submitted profiles are visible only to their owner — everyone
  // else sees a not-found, same as if the profile didn't exist.
  if (!player.is_approved && player.claimed_by !== user?.id) notFound();

  let isVerifiedCoach = false;
  if (user) {
    const { data: coachRow } = await authSupabase
      .from("coaches")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_verified", true)
      .maybeSingle();
    isVerifiedCoach = !!coachRow;
  }

  const { data: similar } = player.position
    ? await (supabase
        .from("players")
        .select(
          "id, first_name, last_name, position, level, school_or_team, country, ranking_national, is_verified, highlight_url, instagram"
        )
        .eq("is_verified", true)
        .eq("is_approved", true)
        .eq("position", player.position)
        .neq("id", id)
        .order("ranking_national", { ascending: true, nullsFirst: false })
        .limit(4) as unknown as Promise<{ data: Player[] | null }>)
    : { data: null };

  // Fetch approved stat verifications for per-stat verified badges
  const [{ data: verifications }, { count: interestCount }] = await Promise.all([
    supabase
      .from("stat_verifications")
      .select("stat_key")
      .eq("player_id", id)
      .eq("status", "approved"),
    supabase
      .from("recruiting_interests")
      .select("id", { count: "exact", head: true })
      .eq("player_id", id),
  ]);

  const verifiedStats = new Set((verifications ?? []).map((v) => v.stat_key));
  const isInDemand = (interestCount ?? 0) >= 3;

  const similarPlayers = similar ?? [];
  const fullName = `${player.first_name} ${player.last_name}`;
  const flag = countryFlag(player.country_code);
  const ext = (player.stats ?? {}) as ExtendedStats;

  const athleticismStats = ATHLETICISM_KEYS.filter((k) => ext[k] != null).map((k) => ({
    key: k,
    label: ATHLETICISM_LABELS[k],
    value: String(ext[k]),
  }));

  const rawStats = Object.entries(ext).filter(([k]) => !META_KEYS.includes(k as typeof META_KEYS[number]));

  const isNational = player.level === "national" || player.level === "international";

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://talkinflag.com" },
      { "@type": "ListItem", position: 2, name: "Players", item: "https://talkinflag.com/players" },
      { "@type": "ListItem", position: 3, name: fullName, item: `https://talkinflag.com/players/${player.id}` },
    ],
  };

  const igHandle = player.instagram ?? (ext.instagram as string | undefined);
  const sameAs: string[] = [];
  if (igHandle) sameAs.push(`https://instagram.com/${String(igHandle).replace(/^@/, "")}`);

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: fullName,
    url: `https://talkinflag.com/players/${player.id}`,
    description: playerSeoDescription(player),
    sport: "Flag Football",
    ...(player.position && { jobTitle: `Flag Football ${player.position}` }),
    ...(player.country && { nationality: player.country }),
    ...(sameAs.length > 0 && { sameAs }),
    ...(player.school_or_team && {
      affiliation: { "@type": "Organization", name: player.school_or_team },
    }),
    ...(isNational && player.school_or_team
      ? { memberOf: { "@type": "SportsTeam", name: player.school_or_team, sport: "Flag Football" } }
      : {}),
    knowsAbout: ["Flag Football", "Flag Football Strategy"],
  };

  return (
    <div className="min-h-screen bg-brand-black">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(personJsonLd) }} />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative bg-[#0a0a0a] border-b border-brand-white/10 pt-28 pb-12 overflow-hidden">
        {/* Background accent */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-yellow" />
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-brand-yellow/5 blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/players"
            className="inline-flex items-center gap-2 text-brand-white/40 hover:text-brand-yellow text-xs font-display uppercase tracking-widest mb-8 transition-colors"
          >
            ← Players
          </Link>

          {!player.is_approved && (
            <div className="bg-brand-yellow/10 border border-brand-yellow/30 p-4 mb-6 text-brand-yellow text-sm font-display uppercase tracking-widest">
              Pending Review — only visible to you until an admin approves it
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-end gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {player.photo_url ? (
                <img
                  src={player.photo_url}
                  alt={fullName}
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-2 border-brand-yellow/30"
                />
              ) : (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-brand-yellow/10 border-2 border-brand-yellow/30 flex items-center justify-center">
                  <span className="font-display text-3xl md:text-4xl text-brand-yellow">
                    {player.first_name[0]}{player.last_name[0]}
                  </span>
                </div>
              )}
              {!player.is_claimed && (
                <div className="absolute -bottom-1 -right-1 bg-brand-black border border-brand-white/20 rounded-full px-2 py-0.5">
                  <span className="text-[9px] font-display uppercase tracking-widest text-brand-white/40">Unclaimed</span>
                </div>
              )}
            </div>

            <div className="flex-1">
              {/* Country + team */}
              <div className="flex items-center gap-2 mb-3">
                {flag && <span className="text-2xl leading-none">{flag}</span>}
                {player.school_or_team && (
                  <span className="text-brand-white/50 text-sm font-display uppercase tracking-widest">
                    {player.school_or_team}
                  </span>
                )}
              </div>

              <h1 className="font-display text-5xl md:text-7xl uppercase text-brand-white leading-none mb-4">
                {fullName}
              </h1>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {player.position && (
                  <span className="bg-brand-yellow text-brand-black font-display uppercase text-sm px-3 py-1 tracking-wider">
                    {player.position}
                  </span>
                )}
                {player.level && (
                  <span className="border border-brand-white/20 text-brand-white/60 text-xs px-3 py-1 uppercase tracking-wide font-display">
                    {formatLevel(player.level)}
                  </span>
                )}
                {player.country && (
                  <span className="border border-brand-white/20 text-brand-white/60 text-xs px-3 py-1 uppercase tracking-wide font-display">
                    {player.country}
                  </span>
                )}
                {player.grad_year && (
                  <span className="border border-brand-white/20 text-brand-white/60 text-xs px-3 py-1 uppercase tracking-wide font-display">
                    Class of {player.grad_year}
                  </span>
                )}
                {player.is_claimed ? (
                  <span className="border border-brand-yellow/50 text-brand-yellow text-xs px-3 py-1 uppercase tracking-wide font-display">
                    ✓ Claimed
                  </span>
                ) : (
                  <span className="border border-brand-white/15 text-brand-white/30 text-xs px-3 py-1 uppercase tracking-wide font-display">
                    Unclaimed
                  </span>
                )}
                {isInDemand && (
                  <span className="bg-brand-yellow text-brand-black text-xs px-3 py-1 uppercase tracking-wide font-display font-bold">
                    🔥 In Demand
                  </span>
                )}
              </div>

              {/* Claim CTA */}
              {!player.is_claimed && (
                <div className="mt-5 flex items-center gap-4">
                  <Link
                    href={`/auth/claim/${player.id}`}
                    className="inline-flex items-center gap-2 bg-brand-yellow text-brand-black font-display text-xs uppercase tracking-widest px-5 py-2.5 hover:bg-brand-yellow/90 transition-colors"
                  >
                    Is this you? Claim Profile →
                  </Link>
                  <span className="text-brand-white/25 text-xs">Free · Honor system</span>
                </div>
              )}

              <div className="mt-3">
                <ReportProfileButton playerId={player.id} />
              </div>
            </div>

            {/* Follow + Share + Compare */}
            <div className="flex flex-col gap-2 md:self-end">
              <CompareButton currentId={player.id} />
              <FollowButton
                followedId={player.id}
                followedType="player"
                isLoggedIn={!!user}
              />
              <a
                href={`https://x.com/intent/tweet?text=${encodeURIComponent(
                  `Check out ${fullName}${player.position ? ` (${player.position})` : ""} on @TalkinFlagShow 🏈`
                )}&url=${encodeURIComponent(`https://talkinflag.com/players/${player.id}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on X"
                className="border border-brand-white/15 text-brand-white/40 hover:text-brand-white hover:border-brand-white/30 p-2.5 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 1200 1227" fill="currentColor" aria-hidden="true">
                  <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.163 519.284ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Key stats bar */}
          <div className="flex flex-wrap gap-6 mt-8 pt-8 border-t border-brand-white/10">
            {player.ranking_national && (
              <StatChip label="World Rank" value={`#${player.ranking_national}`} highlight />
            )}
            {ext.caps && (
              <StatChip label="Caps" value={String(ext.caps)} />
            )}
            {ext.occupation && (
              <StatChip label="Off the Field" value={ext.occupation} />
            )}
            {ext.education && (
              <StatChip label="Education" value={ext.education} />
            )}
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* ── Left sidebar ──────────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Profile details */}
            <SideCard title="Profile">
              {player.school_or_team && <DetailRow label="Team" value={player.school_or_team} />}
              {player.city && <DetailRow label="City" value={player.city} />}
              {player.country && <DetailRow label="Country" value={player.country} />}
              {player.height_in && (
                <DetailRow
                  label="Height"
                  value={formatHeight(player.height_in)}
                  verified={verifiedStats.has("height_in")}
                  selfReported={player.is_claimed && !verifiedStats.has("height_in")}
                />
              )}
              {player.weight_lbs && (
                <DetailRow
                  label="Weight"
                  value={formatWeight(player.weight_lbs)}
                  verified={verifiedStats.has("weight_lbs")}
                  selfReported={player.is_claimed && !verifiedStats.has("weight_lbs")}
                />
              )}
              {!!ext.wingspan_in && (
                <DetailRow
                  label="Wingspan"
                  value={`${ext.wingspan_in as number}"`}
                  verified={verifiedStats.has("wingspan_in")}
                  selfReported={player.is_claimed && !verifiedStats.has("wingspan_in")}
                />
              )}
              {player.grad_year && <DetailRow label="Class" value={`Class of ${player.grad_year}`} />}
              {ext.years_active && <DetailRow label="Years Active" value={`${ext.years_active} yrs`} />}
            </SideCard>

            {/* Rankings */}
            {(player.ranking_national || player.ranking_position) && (
              <SideCard title="Rankings">
                {player.ranking_national && (
                  <DetailRow label="World Rank" value={`#${player.ranking_national}`} highlight />
                )}
                {player.ranking_position && (
                  <DetailRow
                    label={player.position ? `${player.position} Rank` : "Position Rank"}
                    value={`#${player.ranking_position}`}
                  />
                )}
              </SideCard>
            )}

            {/* Tournament history */}
            {ext.tournaments && ext.tournaments.length > 0 && (
              <SideCard title="Tournament History">
                <div className="space-y-3">
                  {ext.tournaments.map((t, i) => (
                    <div key={i} className="text-xs">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-brand-yellow font-display uppercase tracking-wide text-[10px]">{t.year}</span>
                        <span className="text-brand-white/40 font-display text-[10px] uppercase tracking-wide">{t.result}</span>
                      </div>
                      <div className="text-brand-white/70">{t.event}</div>
                      {t.location && <div className="text-brand-white/30">{t.location}</div>}
                    </div>
                  ))}
                </div>
              </SideCard>
            )}

            {/* Social links */}
            {(player.highlight_url || player.instagram) && (
              <SideCard title="Links">
                {isSafeUrl(player.highlight_url) && (
                  <a
                    href={player.highlight_url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-brand-yellow hover:underline text-sm"
                  >
                    ▶ Highlight Reel
                  </a>
                )}
                {player.instagram && (
                  <a
                    href={
                      player.instagram.startsWith("http")
                        ? player.instagram
                        : `https://instagram.com/${player.instagram.replace(/^@/, "")}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-brand-white/60 hover:text-brand-white text-sm transition-colors"
                  >
                    @ {player.instagram.replace(/^@/, "")}
                  </a>
                )}
              </SideCard>
            )}
          </div>

          {/* ── Right main column ─────────────────────────────────────────── */}
          <div className="md:col-span-2 space-y-6">

            {/* Bio */}
            {player.bio && (
              <div className="bg-[#0d0d0d] border border-brand-white/10 p-6">
                <h2 className="font-display uppercase text-brand-yellow text-xs tracking-widest mb-4">Biography</h2>
                <p className="text-brand-white/80 leading-relaxed">{player.bio}</p>
              </div>
            )}

            {/* Athleticism */}
            {athleticismStats.length > 0 && (
              <div className="bg-[#0d0d0d] border border-brand-white/10 p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-display uppercase text-brand-yellow text-xs tracking-widest">
                    Athleticism
                  </h2>
                  {player.is_claimed && !player.is_verified && (
                    <span className="text-brand-white/25 text-[10px] font-display uppercase tracking-widest">
                      Self-reported
                    </span>
                  )}
                  {player.is_verified && (
                    <span className="text-brand-yellow text-[10px] font-display uppercase tracking-widest">
                      ✓ Verified
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-brand-white/10">
                  {athleticismStats.map(({ key, label, value }) => (
                    <div key={key} className="bg-[#0d0d0d] p-4 text-center relative">
                      <div className="font-display text-2xl md:text-3xl text-brand-white tabular-nums">
                        {value}
                      </div>
                      <div className="text-brand-white/40 text-[10px] uppercase tracking-widest mt-1.5">
                        {label}
                      </div>
                      {verifiedStats.has(key) && (
                        <div className="absolute top-2 right-2 text-brand-yellow text-[9px] font-display uppercase tracking-widest">✓</div>
                      )}
                      {player.is_claimed && !verifiedStats.has(key) && (
                        <div className="absolute top-2 right-2 text-brand-white/15 text-[9px]">·</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Achievements */}
            {ext.achievements && ext.achievements.length > 0 && (
              <div className="bg-[#0d0d0d] border border-brand-white/10 p-6">
                <h2 className="font-display uppercase text-brand-yellow text-xs tracking-widest mb-4">
                  Career Highlights
                </h2>
                <ul className="space-y-2">
                  {ext.achievements.map((a, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-brand-white/75">
                      <span className="text-brand-yellow mt-0.5 flex-shrink-0">—</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* National team context */}
            {isNational && player.country && (
              <div className="bg-brand-yellow/5 border border-brand-yellow/20 p-6">
                <h2 className="font-display uppercase text-brand-yellow text-xs tracking-widest mb-4">
                  National Team
                </h2>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{flag}</span>
                  <div>
                    <div className="text-brand-white font-medium">{player.school_or_team}</div>
                    {player.ranking_national && (
                      <div className="text-brand-white/50 text-xs mt-0.5">
                        Ranked #{player.ranking_national} in the world (IFAF Women&apos;s)
                      </div>
                    )}
                  </div>
                </div>
                {ext.caps && (
                  <p className="text-brand-white/60 text-sm">
                    {player.first_name} has earned <span className="text-brand-white font-medium">{ext.caps} international caps</span> representing Italy on the world stage.
                  </p>
                )}
              </div>
            )}

            {/* Raw game stats (if any) */}
            {rawStats.length > 0 && (
              <div className="bg-[#0d0d0d] border border-brand-white/10 p-6">
                <h2 className="font-display uppercase text-brand-yellow text-xs tracking-widest mb-4">Stats</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {rawStats.map(([key, val]) => (
                    <div key={key} className="text-center p-4 bg-[#1a1a1a] border border-brand-white/5">
                      <div className="font-display text-2xl text-brand-white">{String(val)}</div>
                      <div className="text-brand-white/40 text-xs uppercase tracking-wide mt-1">
                        {key.replace(/_/g, " ")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Highlight video embed */}
            {isSafeUrl(player.highlight_url) &&
              (player.highlight_url!.includes("youtube.com") || player.highlight_url!.includes("youtu.be")) && (
                <div className="bg-[#0d0d0d] border border-brand-white/10 p-6">
                  <h2 className="font-display uppercase text-brand-yellow text-xs tracking-widest mb-4">
                    Highlights
                  </h2>
                  <div className="relative aspect-video">
                    <iframe
                      src={player.highlight_url!.replace("watch?v=", "embed/")}
                      title={`${fullName} highlight reel`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full"
                    />
                  </div>
                </div>
              )}

            {/* Empty state */}
            {!player.bio && !ext.achievements && rawStats.length === 0 && (
              <div className="bg-[#0d0d0d] border border-brand-yellow/10 p-10 text-center">
                <p className="text-brand-white/40 text-sm">More profile details coming soon.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Similar players ───────────────────────────────────────────── */}
        {similarPlayers.length > 0 && (
          <div className="mt-16 pt-10 border-t border-brand-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-lg uppercase text-brand-white">
                Other {player.position} Players
              </h2>
              <Link
                href={`/players?position=${player.position}`}
                className="text-brand-yellow font-display text-xs uppercase tracking-widest hover:underline"
              >
                See All →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {similarPlayers.map((p) => (
                <PlayerCard key={p.id} player={p} />
              ))}
            </div>
          </div>
        )}
        {/* Podcast CTA */}
        <div className="mt-16 bg-[#0d0d0d] border border-brand-white/10 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-brand-white font-display uppercase tracking-widest text-sm">The Talkin Flag Show</p>
            <p className="text-brand-white/40 text-xs mt-1">Listen to the podcast and follow along @talkinflagshow.</p>
          </div>
          <Link
            href="/podcast"
            className="flex-shrink-0 border border-brand-yellow/40 text-brand-yellow font-display uppercase tracking-widest text-xs py-2 px-5 hover:bg-brand-yellow hover:text-brand-black transition-colors"
          >
            Listen to the Podcast →
          </Link>
        </div>
      </div>
      {/* Embed link */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-6 text-right">
        <a
          href={`/players/${player.id}/embed`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-white/20 hover:text-brand-white/50 text-xs font-display uppercase tracking-widest transition-colors"
        >
          {'</>'}  Embed this profile
        </a>
      </div>

      <FlagIQBadge userId={player.claimed_by} />

      <CareerUpdates userId={player.claimed_by} />

      <SimilarPlayers playerId={player.id} />

      {isVerifiedCoach && <CoachViewTracker playerId={player.id} />}
      <ShareCardModal
        playerId={player.id}
        playerName={fullName}
        position={player.position ?? null}
        school={player.school_or_team ?? null}
        gradYear={player.grad_year ?? null}
        rankNational={player.ranking_national ?? null}
        photoUrl={player.photo_url ?? null}
        heightIn={player.height_in ?? null}
        weightLbs={player.weight_lbs ?? null}
        level={player.level ?? null}
        verifiedStatKeys={Array.from(verifiedStats)}
        fortyYard={ext.forty_yard ? String(ext.forty_yard) : null}
        verticalJump={ext.vertical_jump ? String(ext.vertical_jump) : null}
      />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SideCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0d0d0d] border border-brand-white/10 p-5 space-y-3">
      <h2 className="font-display uppercase text-brand-yellow text-xs tracking-widest pb-3 border-b border-brand-white/10">
        {title}
      </h2>
      {children}
    </div>
  );
}

function DetailRow({
  label,
  value,
  highlight,
  selfReported,
  verified,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  selfReported?: boolean;
  verified?: boolean;
}) {
  return (
    <div className="flex justify-between items-start gap-4 text-sm">
      <span className="text-brand-white/40 flex-shrink-0 text-xs">{label}</span>
      <span className="flex items-center gap-1.5">
        <span className={highlight ? "text-brand-yellow font-display font-bold" : "text-brand-white text-right text-xs"}>
          {value}
        </span>
        {verified && (
          <span title="Verified" className="text-brand-yellow text-[9px] font-display">✓</span>
        )}
        {!verified && selfReported && (
          <span title="Self-reported by player" className="text-brand-white/20 text-[9px] cursor-help">·</span>
        )}
      </span>
    </div>
  );
}

function StatChip({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className={`font-display text-xl md:text-2xl ${highlight ? "text-brand-yellow" : "text-brand-white"}`}>
        {value}
      </div>
      <div className="text-brand-white/40 text-[11px] uppercase tracking-widest mt-0.5">{label}</div>
    </div>
  );
}
