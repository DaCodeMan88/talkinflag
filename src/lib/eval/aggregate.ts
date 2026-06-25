import { DIMENSION_KEYS, DimensionKey, Fingerprint, emptyFingerprint } from "./dimensions";

/**
 * Element-wise mean of a role's fingerprints → the constituency's aggregate
 * weighting. This becomes the ranking_weights rows for that role
 * (dim.<role>.<dimension>). Returns a zero vector if no fingerprints.
 */
export function aggregateRoleWeights(fingerprints: Fingerprint[]): Fingerprint {
  const out = emptyFingerprint();
  if (fingerprints.length === 0) return out;
  for (const fp of fingerprints) {
    for (const k of DIMENSION_KEYS) out[k] += fp[k] ?? 0;
  }
  for (const k of DIMENSION_KEYS) {
    out[k] = Math.round((out[k] / fingerprints.length) * 1000) / 1000;
  }
  return out;
}

/**
 * Weighted element-wise mean of a role's fingerprints. Each entry carries a
 * credibility `weight` (e.g. from coachCredibilityWeight); the result is the
 * weight-normalized average. Equal weights reduce exactly to
 * aggregateRoleWeights. Returns a zero vector if there are no entries or the
 * total weight is non-positive. Used for the coach role; expert/host keep the
 * plain equal-weight mean.
 */
export function aggregateRoleWeightsWeighted(
  entries: { fingerprint: Fingerprint; weight: number }[]
): Fingerprint {
  const out = emptyFingerprint();
  let totalWeight = 0;
  for (const e of entries) totalWeight += e.weight;
  if (entries.length === 0 || totalWeight <= 0) return out;
  for (const e of entries) {
    for (const k of DIMENSION_KEYS) out[k] += (e.fingerprint[k] ?? 0) * e.weight;
  }
  for (const k of DIMENSION_KEYS) {
    out[k] = Math.round((out[k] / totalWeight) * 1000) / 1000;
  }
  return out;
}
