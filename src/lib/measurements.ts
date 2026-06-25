/** Shared, locale-neutral measurement formatting for a global audience. */

export function inchesToCm(inches: number): number {
  return Math.round(inches * 2.54);
}
export function cmToInches(cm: number): number {
  return Math.round(cm / 2.54);
}
export function lbsToKg(lbs: number): number {
  return Math.round(lbs * 0.45359237);
}
export function kgToLbs(kg: number): number {
  return Math.round(kg / 0.45359237);
}

/** "5'6\" / 168 cm" — empty string when missing. */
export function formatHeight(totalInches: number | null | undefined): string {
  if (!totalInches || totalInches <= 0) return "";
  const ft = Math.floor(totalInches / 12);
  const inch = totalInches % 12;
  return `${ft}'${inch}" / ${inchesToCm(totalInches)} cm`;
}

/** "128 lbs / 58 kg" — empty string when missing. */
export function formatWeight(lbs: number | null | undefined): string {
  if (!lbs || lbs <= 0) return "";
  return `${lbs} lbs / ${lbsToKg(lbs)} kg`;
}
