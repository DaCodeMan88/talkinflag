// The 10 practical evaluation dimensions, in display order, with their
// primary mapping to the NotebookLM biopsychosocial science dimensions (S1–S6).
// Kept in sync with scripts/seed-eval.ts and the eval_dimensions table.

export const DIMENSION_KEYS = [
  "athleticism",
  "football_iq",
  "ball_skills",
  "defense",
  "production",
  "competition",
  "clutch",
  "versatility",
  "intangibles",
  "consistency",
] as const;

export type DimensionKey = (typeof DIMENSION_KEYS)[number];

export const DIMENSION_LABELS: Record<DimensionKey, string> = {
  athleticism: "Athleticism & Explosiveness",
  football_iq: "Football IQ",
  ball_skills: "Ball Skills",
  defense: "Defensive Technique",
  production: "Production & Tools",
  competition: "Competition Level",
  clutch: "Clutch & Big-Game",
  versatility: "Versatility",
  intangibles: "Intangibles & Leadership",
  consistency: "Consistency & Durability",
};

export const SCIENCE_KEYS = ["S1", "S2", "S3", "S4", "S5", "S6"] as const;
export type ScienceKey = (typeof SCIENCE_KEYS)[number];

export const SCIENCE_LABELS: Record<ScienceKey, string> = {
  S1: "Cognitive Processing & Tactical Game Intelligence",
  S2: "Visual Search, Gaze & Visuomotor",
  S3: "Psychological Characteristics & Coping",
  S4: "Personality, Mamba Mentality & Behavioral",
  S5: "Neuromuscular & Proprioceptive",
  S6: "Physiological, Anthropometric & Recovery",
};

// Primary science-dimension mapping for the rollup (production/competition are
// objective/league-adjusted and don't map to a biopsychosocial dimension).
export const DIMENSION_SCIENCE: Partial<Record<DimensionKey, ScienceKey>> = {
  athleticism: "S5",
  football_iq: "S1",
  ball_skills: "S2",
  defense: "S2",
  clutch: "S3",
  versatility: "S1",
  intangibles: "S4",
  consistency: "S6",
};

export type Fingerprint = Record<DimensionKey, number>;

export function emptyFingerprint(): Fingerprint {
  return Object.fromEntries(DIMENSION_KEYS.map((k) => [k, 0])) as Fingerprint;
}
