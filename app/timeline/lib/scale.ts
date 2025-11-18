/**
 * Convert a year to a 0..100 percentage using a domain (minYear..maxYear).
 * Supports large negatives (BCE) by using plain numbers instead of Date.
 */
export function yearToPct(year: number, minYear: number, maxYear: number) {
  const clamped = Math.max(minYear, Math.min(maxYear, year));
  const span = maxYear - minYear || 1;
  return ((clamped - minYear) / span) * 100;
}

export function zoomDomain(kind: "cosmic" | "human" | "personal"): [number, number] {
  const now = new Date().getFullYear();
  if (kind === "cosmic") return [-13800000000, now + 10];
  if (kind === "human")  return [-300000, now + 10];
  return [now - 50, now + 1]; // personal: last ~50 years
}
