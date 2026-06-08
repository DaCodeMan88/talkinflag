import { DIMENSION_KEYS, DimensionKey, Fingerprint } from "./dimensions";
import { euclidean } from "./vector";

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
];

export function classifyArchetype(fingerprint: Fingerprint): Archetype {
  const v = DIMENSION_KEYS.map((k) => fingerprint[k]);
  let best = ARCHETYPES[0];
  let bestDist = Infinity;
  for (const a of ARCHETYPES) {
    const d = euclidean(v, DIMENSION_KEYS.map((k) => a.centroid[k]));
    if (d < bestDist) { bestDist = d; best = a; }
  }
  return best;
}
