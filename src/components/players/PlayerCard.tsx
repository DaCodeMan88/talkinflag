interface Player {
  id: string;
  first_name: string;
  last_name: string;
  position?: string | null;
  level?: string | null;
  school_or_team?: string | null;
  country?: string | null;
  country_code?: string | null;
  ranking_national?: number | null;
  highlight_url?: string | null;
  instagram?: string | null;
  bio?: string | null;
  is_verified?: boolean;
}

export function PlayerCard({ player }: { player: Player }) {
  const name = `${player.first_name} ${player.last_name}`;
  const levelLabel = player.level?.replace("_", " ");

  return (
    <article className="bg-[#222222] border border-brand-white/10 hover:border-brand-yellow/40 transition-colors p-5">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          {player.ranking_national && (
            <span className="text-brand-yellow font-display text-xs uppercase tracking-widest">
              #{player.ranking_national}
            </span>
          )}
          <h3 className="font-display text-lg uppercase text-brand-white leading-tight mt-0.5">{name}</h3>
        </div>
        {player.is_verified && (
          <span className="shrink-0 bg-brand-yellow text-brand-black font-display text-xs px-2 py-0.5 uppercase tracking-widest">
            Verified
          </span>
        )}
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
      {player.country && (
        <p className="text-brand-white/40 text-xs">{player.country}</p>
      )}

      <div className="flex items-center gap-3 mt-3">
        {player.highlight_url && (
          <a
            href={player.highlight_url}
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
      </div>
    </article>
  );
}
