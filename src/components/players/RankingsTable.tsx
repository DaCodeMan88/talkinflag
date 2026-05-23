interface RankedPlayer {
  id: string;
  first_name: string;
  last_name: string;
  position?: string | null;
  level?: string | null;
  school_or_team?: string | null;
  country?: string | null;
  ranking_national?: number | null;
  is_verified?: boolean;
}

export function RankingsTable({ players }: { players: RankedPlayer[] }) {
  if (players.length === 0) return null;

  return (
    <div className="overflow-x-auto mb-12">
      <table className="w-full text-sm" aria-label="Player national rankings">
        <thead>
          <tr className="border-b border-brand-yellow/20">
            <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-4">#</th>
            <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-4">Player</th>
            <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-4">Pos</th>
            <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-4 hidden md:table-cell">Level</th>
            <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 hidden lg:table-cell">Team / School</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, i) => (
            <tr key={player.id} className="border-b border-brand-white/5 hover:bg-brand-white/5 transition-colors">
              <td className="py-3 pr-4 text-brand-yellow font-display">
                {player.ranking_national ?? i + 1}
              </td>
              <td className="py-3 pr-4">
                <span className="text-brand-white font-medium">
                  {player.first_name} {player.last_name}
                </span>
                {player.is_verified && (
                  <span className="ml-2 text-brand-yellow text-xs">✓</span>
                )}
              </td>
              <td className="py-3 pr-4">
                <span className="text-brand-yellow font-display text-xs uppercase">{player.position || "—"}</span>
              </td>
              <td className="py-3 pr-4 text-brand-white/50 text-xs hidden md:table-cell">
                {player.level?.replace("_", " ") || "—"}
              </td>
              <td className="py-3 text-brand-white/50 text-xs hidden lg:table-cell">
                {player.school_or_team || player.country || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
