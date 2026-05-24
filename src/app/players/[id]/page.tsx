import { createServerClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import type { Player } from "@/types/player";

export const revalidate = 300;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isSafeUrl(url: string | null | undefined): boolean {
  return !!(url && (url.startsWith("https://") || url.startsWith("http://")));
}

function formatLevel(level: string | null): string {
  if (!level) return "";
  return level.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatHeight(inches: number | null): string {
  if (!inches) return "";
  const ft = Math.floor(inches / 12);
  const inch = inches % 12;
  return `${ft}'${inch}"`;
}

// ---------------------------------------------------------------------------
// generateStaticParams
// ---------------------------------------------------------------------------

export async function generateStaticParams(): Promise<{ id: string }[]> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("players")
      .select("id")
      .eq("is_verified", true);
    return (data ?? []).map((row) => ({ id: row.id as string }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// generateMetadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = createServerClient();
  const { data: player } = await supabase
    .from("players")
    .select("first_name, last_name, position, level")
    .eq("id", id)
    .single();

  if (!player) {
    return { title: "Player Not Found | Talkin Flag" };
  }

  const name = `${player.first_name} ${player.last_name}`;
  const desc = [player.position, formatLevel(player.level)]
    .filter(Boolean)
    .join(" · ");

  return {
    title: `${name} | Talkin Flag Players`,
    description: desc
      ? `${name} — ${desc}. Ranked flag football player profile on Talkin Flag.`
      : `${name} — flag football player profile on Talkin Flag.`,
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("id", id)
    .single() as { data: Player | null };

  if (!player) notFound();

  const fullName = `${player.first_name} ${player.last_name}`;
  const location = [player.city, player.state, player.country]
    .filter(Boolean)
    .join(", ");

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": fullName,
    "url": `https://talkinflag.com/players/${player.id}`,
    ...(player.position && { "jobTitle": `Flag Football ${player.position}` }),
    ...(location && { "address": { "@type": "PostalAddress", "addressLocality": location } }),
    ...(player.instagram && {
      "sameAs": [`https://instagram.com/${player.instagram.replace(/^@/, "")}`],
    }),
  };

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Back link */}
        <Link
          href="/players"
          className="inline-flex items-center gap-2 text-brand-white/50 hover:text-brand-yellow text-sm mb-10 transition-colors"
        >
          <span aria-hidden="true">&#8592;</span> Back to Players
        </Link>

        {/* Header */}
        <div className="border-l-4 border-brand-yellow pl-6 mb-10">
          <h1 className="font-display text-5xl md:text-7xl uppercase text-brand-white leading-none">
            {fullName}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            {player.position && (
              <span className="bg-brand-yellow text-brand-black font-display uppercase text-sm px-3 py-1 tracking-wider">
                {player.position}
              </span>
            )}
            {player.level && (
              <span className="border border-brand-white/30 text-brand-white/70 text-sm px-3 py-1 uppercase tracking-wide">
                {formatLevel(player.level)}
              </span>
            )}
            {player.is_verified && (
              <span className="border border-brand-yellow/40 text-brand-yellow text-xs px-3 py-1 uppercase tracking-wide">
                Verified
              </span>
            )}
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Left column — details */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-[#111111] border border-brand-white/10 p-6 space-y-4">
              <h2 className="font-display uppercase text-brand-yellow text-sm tracking-widest">
                Profile
              </h2>

              {player.school_or_team && (
                <DetailRow label="Team / School" value={player.school_or_team} />
              )}
              {player.grad_year && (
                <DetailRow label="Grad Year" value={String(player.grad_year)} />
              )}
              {location && (
                <DetailRow label="Location" value={location} />
              )}
              {player.height_in && (
                <DetailRow label="Height" value={formatHeight(player.height_in)} />
              )}
              {player.weight_lbs && (
                <DetailRow label="Weight" value={`${player.weight_lbs} lbs`} />
              )}
            </div>

            {/* Rankings */}
            {(player.ranking_national || player.ranking_position) && (
              <div className="bg-[#111111] border border-brand-white/10 p-6 space-y-4">
                <h2 className="font-display uppercase text-brand-yellow text-sm tracking-widest">
                  Rankings
                </h2>
                {player.ranking_national && (
                  <DetailRow label="National Rank" value={`#${player.ranking_national}`} />
                )}
                {player.ranking_position && (
                  <DetailRow
                    label={player.position ? `${player.position} Rank` : "Position Rank"}
                    value={`#${player.ranking_position}`}
                  />
                )}
              </div>
            )}

            {/* Links */}
            {(player.highlight_url || player.instagram) && (
              <div className="bg-[#111111] border border-brand-white/10 p-6 space-y-4">
                <h2 className="font-display uppercase text-brand-yellow text-sm tracking-widest">
                  Links
                </h2>
                {isSafeUrl(player.highlight_url) && (
                  <a
                    href={player.highlight_url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-brand-yellow hover:underline text-sm"
                  >
                    <span aria-hidden="true">&#9654;</span> Highlight Reel
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
                    className="flex items-center gap-2 text-brand-white/70 hover:text-brand-white text-sm"
                  >
                    <span aria-hidden="true">@</span>{" "}
                    {player.instagram.startsWith("@")
                      ? player.instagram
                      : `@${player.instagram}`}
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Right column — bio + stats */}
          <div className="md:col-span-2 space-y-6">
            {player.bio && (
              <div className="bg-[#111111] border border-brand-white/10 p-6">
                <h2 className="font-display uppercase text-brand-yellow text-sm tracking-widest mb-4">
                  Bio
                </h2>
                <p className="text-brand-white/80 leading-relaxed whitespace-pre-line">
                  {player.bio}
                </p>
              </div>
            )}

            {/* Stats */}
            {player.stats && Object.keys(player.stats).length > 0 && (
              <div className="bg-[#111111] border border-brand-white/10 p-6">
                <h2 className="font-display uppercase text-brand-yellow text-sm tracking-widest mb-4">
                  Stats
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {Object.entries(player.stats as Record<string, unknown>).map(([key, val]) => (
                    <div key={key} className="text-center p-3 bg-[#1a1a1a] border border-brand-white/5">
                      <div className="font-display text-2xl text-brand-white">
                        {String(val)}
                      </div>
                      <div className="text-brand-white/50 text-xs uppercase tracking-wide mt-1">
                        {key.replace(/_/g, " ")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Placeholder when no bio/stats */}
            {!player.bio && (!player.stats || Object.keys(player.stats).length === 0) && (
              <div className="bg-[#111111] border border-brand-yellow/10 p-10 text-center">
                <p className="text-brand-white/40 text-sm">
                  More profile details coming soon.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component
// ---------------------------------------------------------------------------

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-4 text-sm">
      <span className="text-brand-white/50 flex-shrink-0">{label}</span>
      <span className="text-brand-white text-right">{value}</span>
    </div>
  );
}
