import Link from "next/link";
import { Player } from "@/types/player";
import { cohortRankLabel } from "@/lib/rankings/cohort";

function isSafeUrl(url: string | null | undefined): boolean {
  return !!(url && (url.startsWith("https://") || url.startsWith("http://")));
}

/** Convert ISO 3166-1 alpha-2 country code to flag emoji */
function countryFlag(code: string | null | undefined): string {
  if (!code || code.length !== 2) return "";
  const offset = 127397; // 0x1F1E6 - 0x41
  return Array.from(code.toUpperCase())
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + offset))
    .join("");
}

export function PlayerCard({ player }: { player: Player }) {
  const name = `${player.first_name} ${player.last_name}`;
  const levelLabel = player.level === "youth" ? "High School" : player.level?.replaceAll("_", " ");
  const flag = countryFlag(player.country_code);

  return (
    <article className="bg-[#222222] border border-brand-white/10 hover:border-brand-yellow/40 transition-colors p-5 group relative">
      {/* Clickable overlay for the entire card */}
      <Link
        href={`/players/${player.id}`}
        className="absolute inset-0 z-0"
        aria-label={`View ${name}'s profile`}
      />

      <div className="flex items-start justify-between gap-2 mb-3 relative z-10">
        <div>
          {cohortRankLabel(player.level, player.ranking_national) && (
            <span className="text-brand-yellow font-display text-xs uppercase tracking-widest">
              {cohortRankLabel(player.level, player.ranking_national)}
            </span>
          )}
          <h3 className="font-display text-lg uppercase text-brand-white leading-tight mt-0.5 group-hover:text-brand-yellow transition-colors">{name}</h3>
        </div>
        <div className="flex flex-col items-end gap-1">
          {(player.interest_count ?? 0) >= 3 && (
            <span className="shrink-0 bg-brand-yellow text-brand-black font-display text-[9px] px-2 py-0.5 uppercase tracking-widest font-bold">
              🔥 In Demand
            </span>
          )}
          {player.is_claimed && !player.claim_pending ? (
            <span className="shrink-0 bg-brand-yellow text-brand-black font-display text-[9px] px-2 py-0.5 uppercase tracking-widest">
              ✓ Claimed
            </span>
          ) : (
            <span className="shrink-0 border border-brand-white/15 text-brand-white/25 font-display text-[9px] px-2 py-0.5 uppercase tracking-widest">
              Unclaimed
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {player.position && (
          <span className="bg-brand-black border border-brand-yellow/30 text-brand-yellow font-display text-xs px-2 py-0.5 uppercase tracking-widest">
            {player.position}
          </span>
        )}
        {levelLabel && (
          <span className="text-brand-white/40 text-xs self-center">
            {levelLabel}
          </span>
        )}
      </div>

      {player.school_or_team && (
        <p className="text-brand-white/60 text-xs mb-1">{player.school_or_team}</p>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        {player.country && (
          <p className="text-brand-white/40 text-xs">
            {flag && <span className="mr-1" aria-hidden="true">{flag}</span>}
            {player.country}
          </p>
        )}
        {player.grad_year && (
          <span className="text-brand-white/25 text-xs font-display uppercase tracking-widest">
            Class of {player.grad_year}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 mt-3 relative z-10">
        {isSafeUrl(player.highlight_url) && (
          <a
            href={player.highlight_url!}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-yellow text-xs font-display uppercase tracking-widest hover:underline"
            aria-label={`Watch ${name} highlight video`}
          >
            Highlights ↗
          </a>
        )}
        {player.instagram && (
          <a
            href={`https://instagram.com/${player.instagram.replace("@", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-white/40 text-xs hover:text-brand-white transition-colors"
            aria-label={`${name} on Instagram`}
          >
            {player.instagram}
          </a>
        )}
        {!player.highlight_url && !player.instagram && (
          <span className="text-brand-white/30 text-xs font-display uppercase tracking-widest">
            View Profile →
          </span>
        )}
      </div>
    </article>
  );
}
