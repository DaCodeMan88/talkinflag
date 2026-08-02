import { DIMENSION_KEYS, DimensionKey, Fingerprint } from "./dimensions";
import { center, cosine, stdev } from "./vector";

// Archetype centroids on the 10 practical dimensions (0–10 scale).
// Nearest centroid by Euclidean distance labels the member's evaluation style.
export type Archetype = {
  name: string;
  blurb: string;
  centroid: Record<DimensionKey, number>;
};

const C = (partial: Partial<Record<DimensionKey, number>>): Record<DimensionKey, number> =>
  Object.fromEntries(DIMENSION_KEYS.map((k) => [k, partial[k] ?? 3])) as Record<DimensionKey, number>;

export const ARCHETYPES: Archetype[] = [
  {
    name: "Film-Room Evaluator",
    blurb: "You prize what shows up on the whiteboard — football IQ, defensive technique, and versatility over raw measurables.",
    centroid: C({ football_iq: 10, defense: 9, versatility: 8, ball_skills: 6, athleticism: 3, production: 2, consistency: 3 }),
  },
  {
    name: "Numbers Purist",
    blurb: "You trust the box score. Raw production and the physical tools that drive it carry the most weight in your evaluation.",
    centroid: C({ production: 10, athleticism: 8, competition: 7, ball_skills: 6, football_iq: 4, intangibles: 3, clutch: 4 }),
  },
  {
    name: "Big-Stage Believer",
    blurb: "You value players who rise when it matters — clutch performance, big-game pedigree, and competition level.",
    centroid: C({ clutch: 10, competition: 9, intangibles: 7, football_iq: 6, production: 5, athleticism: 4 }),
  },
  {
    name: "Athlete-First Scout",
    blurb: "You bet on traits and tools — explosiveness, ball skills, and the raw athletic ceiling a player can grow into.",
    centroid: C({ athleticism: 10, ball_skills: 8, versatility: 7, production: 6, defense: 5, football_iq: 4, intangibles: 4 }),
  },
  {
    name: "Old-School Fundamentalist",
    blurb: "You reward the intangibles — leadership, coachability, durability, and disciplined defensive fundamentals.",
    centroid: C({ intangibles: 10, defense: 8, consistency: 8, clutch: 6, football_iq: 6, athleticism: 4, production: 3 }),
  },
  {
    name: "Balanced Evaluator",
    blurb: "You don't over-index on any one trait — you weigh the whole player. Rare, and hard to fool.",
    centroid: C({}), // 5 across the board — only reached via the flat-vector guard below.
  },
];

// A fingerprint whose dimensions barely vary expresses no real preference; the
// old Euclidean classifier let sheer magnitude pick a label for it (a max-
// everything vector always landed on the largest-norm centroid). We instead
// match on SHAPE (cosine of the mean-centered vector) and, when there is no
// shape to speak of, say so explicitly.
const FLAT_STDEV_THRESHOLD = 1.0;

export function classifyArchetype(fingerprint: Fingerprint): Archetype {
  const v = DIMENSION_KEYS.map((k) => fingerprint[k] ?? 0);
  if (stdev(v) < FLAT_STDEV_THRESHOLD) {
    return ARCHETYPES.find((a) => a.name === "Balanced Evaluator")!;
  }
  const cv = center(v);
  let best = ARCHETYPES[0];
  let bestSim = -Infinity;
  for (const a of ARCHETYPES) {
    if (a.name === "Balanced Evaluator") continue;
    const sim = cosine(cv, center(DIMENSION_KEYS.map((k) => a.centroid[k])));
    if (sim > bestSim) { bestSim = sim; best = a; }
  }
  return best;
}
