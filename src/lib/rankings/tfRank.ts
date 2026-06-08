// TF Rank — community-weighted player ranking algorithm.
// Pure functions only; no I/O. Tested in tfRank.test.ts.
//
// ranking_weights table keys:
//   dim.<role>.<dimension>  — role weight for each eval dimension (0–10)
//   blend.coach / blend.expert / blend.host — constituency blend (default 55/30/15)
//
// Output:
//   ranking_national  — ordinal rank across all players (1 = best)
//   ranking_position  — ordinal rank within position bucket

import { DIMENSION_KEYS, DimensionKey } from "@/lib/eval/dimensions";

export type WeightMap = Record<string, number>;

export const DEFAULT_BLENDS = { coach: 0.55, expert: 0.30, host: 0.15 };

// Position buckets matching the players table check constraint
export type PositionBucket = "QB" | "WR" | "DB" | "LB" | "C" | "Rusher" | "Utility";
const VALID_BUCKETS: PositionBucket[] = ["QB", "WR", "DB", "LB", "C", "Rusher", "Utility"];

export function positionBucket(position?: string | null): PositionBucket {
  const p = position as PositionBucket;
  return VALID_BUCKETS.includes(p) ? p : "Utility";
}

// Verification confidence factors
export function verificationFactor(isVerified?: boolean, isClaimed?: boolean): number {
  if (isVerified) return 1.0;
  if (isClaimed) return 0.85;
  return 0.65;
}

// Blend the three role weight vectors into a single dimension weight vector.
// Each role's weights (from dim.<role>.<dim>) are blended by the constituency
// fractions (blend.coach etc.), normalised to sum to 1.
export function blendWeights(weights: WeightMap): Record<DimensionKey, number> {
  const raw = {
    coach:  weights["blend.coach"]  ?? DEFAULT_BLENDS.coach,
    expert: weights["blend.expert"] ?? DEFAULT_BLENDS.expert,
    host:   weights["blend.host"]   ?? DEFAULT_BLENDS.host,
  };
  const total = raw.coach + raw.expert + raw.host;
  const b = {
    coach:  raw.coach  / total,
    expert: raw.expert / total,
    host:   raw.host   / total,
  };

  const result = {} as Record<DimensionKey, number>;
  for (const dim of DIMENSION_KEYS) {
    const cw = weights[`dim.coach.${dim}`]  ?? 0;
    const ew = weights[`dim.expert.${dim}`] ?? 0;
    const hw = weights[`dim.host.${dim}`]   ?? 0;
    result[dim] = b.coach * cw + b.expert * ew + b.host * hw;
  }
  return result;
}

type Stats = Record<string, unknown> | null | undefined;

function n(s: Stats, k: string): number {
  const v = Number((s as Record<string, unknown>)?.[k]);
  return Number.isFinite(v) ? v : 0;
}

const r1 = (x: number) => Math.round(x * 10) / 10;

// Derive a 0–10 score per eval dimension from a player's stats + context.
// Scores sharpen as verified stats grow; sparse profiles default to proxies.
export function playerDimensionScores(
  stats: Stats,
  isVerified: boolean,
  difficulty: number,  // league difficulty 0.7–1.3
): Record<DimensionKey, number> {
  const s = stats ?? {};

  // production (league-adjusted TDs + yards composite)
  const offTDs = n(s,"td_passes") + n(s,"passing_tds_season") + n(s,"receiving_tds") + n(s,"rush_tds_season") + n(s,"total_tds");
  const offYds = (n(s,"passing_yards") + n(s,"passing_yards_season") + n(s,"receiving_yards") + n(s,"rushing_yards_season")) / 100;
  const production = r1(Math.min(10, (offTDs + offYds) * difficulty * 0.8));

  // defense (league-adjusted)
  const defRaw = n(s,"tackles_season") + n(s,"sacks_season") * 2 + n(s,"flag_pulls_for_loss");
  const defense = r1(Math.min(10, defRaw * difficulty * 0.5));

  // competition: league difficulty → 0–10 scale (1.3 → 10, 0.7 → 5.4)
  const competition = r1(Math.min(10, difficulty * 7.7));

  // clutch: big-game stats (league-adjusted)
  const clutchRaw = n(s,"championship_passing_tds") + n(s,"championship_receiving_tds") +
    n(s,"championship_rush_tds") + n(s,"championship_tackles") +
    (n(s,"championship_passing_yards") + n(s,"championship_receiving_yards") + n(s,"championship_rush_yards")) / 100;
  const clutch = r1(Math.min(10, clutchRaw * difficulty));

  // athleticism: measurable first, fall back to competition-level proxy
  const fortyYard = n(s,"forty_yard");
  const vertJump  = n(s,"vertical_jump");
  const athleticism = (fortyYard > 0 || vertJump > 0)
    ? r1(Math.min(10, (vertJump / 4) + (fortyYard > 0 ? Math.max(0, (5.5 - fortyYard) * 5) : 0)))
    : r1(competition * 0.55); // proxy: higher competition assumed more athletic

  // ball_skills: passing precision + receiving volume (league-adjusted)
  const totalYds = n(s,"passing_yards") + n(s,"passing_yards_season") + n(s,"receiving_yards");
  const compPct  = n(s,"completion_pct") || n(s,"completion_percentage");
  const ball_skills = r1(Math.min(10, (totalYds / 300 + compPct / 20) * difficulty));

  // football_iq: completion % primary, competition proxy otherwise
  const football_iq = compPct > 0
    ? r1(Math.min(10, compPct / 10))
    : r1(competition * 0.7);

  // intangibles: national team + verified/claimed status signals
  const isNationalSenior = String(s["team_designation"] ?? "").includes("national");
  const intangibles = r1(Math.min(10,
    (isVerified ? 3.5 : 0) + (isNationalSenior ? 3.5 : 0) + 2.0
  ));

  // versatility: richness of stats on record
  const statCount = Object.keys(s as object).filter(
    (k) => Number.isFinite(Number((s as Record<string,unknown>)[k])) && Number((s as Record<string,unknown>)[k]) > 0
  ).length;
  const versatility = r1(Math.min(10, statCount * 0.5 + (isVerified ? 2 : 0)));

  // consistency: years active + seasons
  const yearsActive = n(s,"years_active");
  const consistency = yearsActive > 0
    ? r1(Math.min(10, yearsActive * 2))
    : r1(competition * 0.3 + 1);

  return {
    athleticism,
    football_iq,
    ball_skills,
    defense,
    production,
    competition,
    clutch,
    versatility,
    intangibles,
    consistency,
  };
}

export type TfScore = {
  playerId: string;
  dimScores: Record<DimensionKey, number>;
  rawScore: number;
  verificationFactor: number;
  score: number;
  positionBucket: PositionBucket;
};

// Compute a 0–100 TF score for one player.
export function computePlayerTfScore(
  player: {
    id: string;
    position?: string | null;
    is_verified?: boolean;
    is_claimed?: boolean;
    stats?: Stats;
    difficulty?: number;
  },
  blendedWeights: Record<DimensionKey, number>,
): TfScore {
  const difficulty = player.difficulty ?? 0.8;
  const dims = playerDimensionScores(player.stats, player.is_verified ?? false, difficulty);
  const vf = verificationFactor(player.is_verified, player.is_claimed);

  // Weighted sum — max possible is sum(weight * 10) per dimension
  let weightedSum = 0;
  let maxPossible = 0;
  for (const dim of DIMENSION_KEYS) {
    const w = blendedWeights[dim] ?? 0;
    weightedSum += w * dims[dim];
    maxPossible += w * 10;
  }

  const rawScore = maxPossible > 0 ? (weightedSum / maxPossible) * 100 : 0;
  const score = Math.round(rawScore * vf * 10) / 10;

  return {
    playerId: player.id,
    dimScores: dims,
    rawScore: Math.round(rawScore * 10) / 10,
    verificationFactor: vf,
    score,
    positionBucket: positionBucket(player.position),
  };
}

export type RankedPlayer = TfScore & {
  ranking_national: number;
  ranking_position: number;
};

// Compute TF Rank for an entire player cohort.
// Returns array sorted by score desc, with national + position ordinal ranks.
export function computeTfRank(
  players: Array<{
    id: string;
    position?: string | null;
    is_verified?: boolean;
    is_claimed?: boolean;
    stats?: Stats;
    difficulty?: number;
  }>,
  weights: WeightMap,
): RankedPlayer[] {
  const blended = blendWeights(weights);
  const scored = players
    .map((p) => computePlayerTfScore(p, blended))
    .sort((a, b) => b.score - a.score);

  // Assign national ranks (ties share the same rank)
  const positionCounters = new Map<string, number>();
  const positionLastScore = new Map<string, number>();
  const positionLastRank  = new Map<string, number>();

  let lastScore = -1;
  let lastNatRank = 0;

  return scored.map((s, idx) => {
    // National rank — standard competition ranking (ties share same rank)
    if (s.score !== lastScore) {
      lastNatRank = idx + 1;
      lastScore = s.score;
    }

    // Position rank — same tie logic within bucket
    const bucket = s.positionBucket;
    const prevScore = positionLastScore.get(bucket);
    const prevRank  = positionLastRank.get(bucket) ?? 0;
    const prevCount = positionCounters.get(bucket) ?? 0;
    const newCount  = prevCount + 1;
    positionCounters.set(bucket, newCount);

    let posRank: number;
    if (s.score === prevScore) {
      posRank = prevRank;
    } else {
      posRank = newCount;
      positionLastScore.set(bucket, s.score);
      positionLastRank.set(bucket, newCount);
    }

    return { ...s, ranking_national: lastNatRank, ranking_position: posRank };
  });
}
