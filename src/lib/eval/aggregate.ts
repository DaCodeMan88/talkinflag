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
