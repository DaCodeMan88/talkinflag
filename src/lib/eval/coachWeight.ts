// Coach credibility weight — pure, no I/O. Tested in coachWeight.test.ts.
//
// Purpose: a verified coach's evaluation vote should count in proportion to
// their demonstrated credibility. Coach IQ is the PRIMARY lever and also a
// gate: a coach must clear a minimum Coach IQ to earn ANY extra voting
// influence. Below the gate (or with no IQ on record) the coach votes at the
// standard baseline — never penalized below it. Above the gate, level,
// win%, experience, and postseason/championship record from approved career
// updates lift the weight toward a hard cap.
//
// The output multiplier feeds aggregateRoleWeightsWeighted() for the coach
// role only (see src/lib/rankings/recompute.ts). Expert/host stay equal-weight.

export type CoachCredibilityInput = {
  /** Best Coach IQ score (0–100), or null if the coach has not taken it. */
  iqPct: number | null;
  /** coaches.level — 'national' | 'college' | 'high_school' (or 'hs') | other. */
  level: string | null;
  wins: number | null;
  losses: number | null;
  yearsCoaching: number | null;
  /** Counts from APPROVED career_updates for this coach. */
  championships: number;
  titleGames: number;
  postseason: number;
};

/** Minimum Coach IQ (score_pct) required to earn any extra voting influence. */
export const COACH_IQ_THRESHOLD = 60;
/** Minimum games before win% contributes (guards tiny-sample records). */
export const MIN_GAMES = 5;

export const MIN_WEIGHT = 0.5;
export const MAX_WEIGHT = 2.0;
export const BASELINE_WEIGHT = 1.0;

// Component blend (sums to 1.0). IQ dominates by design.
const W_IQ = 0.45;
const W_LEVEL = 0.15;
const W_WINPCT = 0.15;
const W_EXPERIENCE = 0.1;
const W_ACHIEVEMENT = 0.15;

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const clamp = (x: number, lo: number, hi: number) => (x < lo ? lo : x > hi ? hi : x);

function levelComponent(level: string | null): number {
  switch ((level ?? "").toLowerCase()) {
    case "national":
      return 1;
    case "college":
      return 0.6;
    case "high_school":
    case "high-school":
    case "hs":
      return 0.3;
    case "":
      return 0; // no level on record → no level credit
    default:
      return 0.2; // a recognized coach at some other recorded level
  }
}

/**
 * Voting-influence multiplier for a verified coach, in [MIN_WEIGHT, MAX_WEIGHT].
 * Coaches who clear the IQ gate land in [BASELINE_WEIGHT, MAX_WEIGHT]; those who
 * don't return exactly BASELINE_WEIGHT.
 */
export function coachCredibilityWeight(input: CoachCredibilityInput): number {
  const { iqPct } = input;

  // Gate: no Coach IQ on record, or below the threshold → standard baseline.
  if (iqPct == null || iqPct < COACH_IQ_THRESHOLD) return BASELINE_WEIGHT;

  // IQ component: normalized over the band above the threshold.
  const iqComp = clamp01((iqPct - COACH_IQ_THRESHOLD) / (100 - COACH_IQ_THRESHOLD));

  const levelComp = levelComponent(input.level);

  // Win%: only contributes above .500, and only with enough games.
  const wins = Math.max(0, input.wins ?? 0);
  const losses = Math.max(0, input.losses ?? 0);
  const games = wins + losses;
  const winComp = games >= MIN_GAMES ? clamp01((wins / games - 0.5) / 0.5) : 0;

  // Experience: diminishing returns (≈0.63 at 8 yrs, ≈0.86 at 16 yrs).
  const years = Math.max(0, input.yearsCoaching ?? 0);
  const expComp = clamp01(1 - Math.exp(-years / 8));

  // Achievements from approved career updates — championships weigh most.
  const achievements =
    Math.max(0, input.championships) * 1 +
    Math.max(0, input.titleGames) * 0.5 +
    Math.max(0, input.postseason) * 0.25;
  const achComp = clamp01(achievements / 3); // ~3 championship-equivalents maxes it

  const credibility =
    W_IQ * iqComp +
    W_LEVEL * levelComp +
    W_WINPCT * winComp +
    W_EXPERIENCE * expComp +
    W_ACHIEVEMENT * achComp;

  const weight = BASELINE_WEIGHT + credibility * (MAX_WEIGHT - BASELINE_WEIGHT);
  return Math.round(clamp(weight, MIN_WEIGHT, MAX_WEIGHT) * 100) / 100;
}

/** Plain-language label for a coach's voting influence, for profile/admin UI. */
export function coachInfluenceLabel(weight: number): "Standard" | "Elevated" | "High" {
  if (weight >= 1.5) return "High";
  if (weight > BASELINE_WEIGHT) return "Elevated";
  return "Standard";
}
