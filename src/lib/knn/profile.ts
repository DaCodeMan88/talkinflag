// Build a 10-dimension "statistical DNA" vector per player for KNN similarity.
// Given how sparse verified stats are today, the vector is dominated by
// position + league-adjusted level + gender, with production stats refining it
// where present. It sharpens automatically as profiles are verified.
//
// Dimensions (fixed order):
//   0 QB · 1 WR · 2 DB · 3 Rusher · 4 other-position   (one-hot × POS_WEIGHT)
//   5 league difficulty (~0.7–1.3)
//   6 gender (1 male / 0 female)
//   7 offense production (league-adjusted, normalized 0–1)
//   8 defense production (league-adjusted, normalized 0–1)
//   9 big-game production (league-adjusted, normalized 0–1)

export const POS_WEIGHT = 5;
export type Stats = Record<string, unknown> | null | undefined;
export type Maxes = { offense: number; defense: number; bigGame: number };
export type PlayerLite = { position?: string | null; gender?: string | null; stats?: Stats };

function posIndex(position?: string | null): number {
  switch (position) {
    case "QB": return 0;
    case "WR": return 1;
    case "DB": return 2;
    case "Rusher": return 3;
    default: return 4; // C / LB / Utility / null
  }
}

function n(s: Stats, k: string): number {
  const v = Number((s as Record<string, unknown>)?.[k]);
  return Number.isFinite(v) ? v : 0;
}

export function offenseRaw(s: Stats): number {
  return (
    n(s, "td_passes") + n(s, "passing_tds_season") + n(s, "receiving_tds") +
    n(s, "rush_tds_season") + n(s, "total_tds") +
    (n(s, "passing_yards") + n(s, "passing_yards_season") + n(s, "receiving_yards") + n(s, "rushing_yards_season")) / 100 +
    n(s, "receptions") / 2
  );
}

export function defenseRaw(s: Stats): number {
  return n(s, "tackles_season") + n(s, "sacks_season") * 2 + n(s, "flag_pulls_for_loss");
}

export function bigGameRaw(s: Stats): number {
  return (
    n(s, "championship_passing_tds") + n(s, "championship_receiving_tds") + n(s, "championship_rush_tds") +
    n(s, "championship_tackles") + n(s, "championship_completions") +
    (n(s, "championship_passing_yards") + n(s, "championship_receiving_yards") + n(s, "championship_rush_yards")) / 100
  );
}

const round3 = (x: number) => Math.round(x * 1000) / 1000;

/**
 * `maxes` are the league-wide maxima of the ADJUSTED (raw × difficulty)
 * production composites, so each production dimension lands in 0–1 and tougher
 * leagues lift comparable raw stats.
 */
export function buildPlayerVector(p: PlayerLite, difficulty: number, maxes: Maxes): number[] {
  const s = p.stats ?? {};
  const v = new Array(10).fill(0);
  v[posIndex(p.position)] = POS_WEIGHT;
  v[5] = difficulty;
  v[6] = p.gender === "male" ? 1 : 0;
  const norm = (raw: number, max: number) => (max > 0 ? Math.min(1, (raw * difficulty) / max) : 0);
  v[7] = norm(offenseRaw(s), maxes.offense);
  v[8] = norm(defenseRaw(s), maxes.defense);
  v[9] = norm(bigGameRaw(s), maxes.bigGame);
  return v.map(round3);
}
