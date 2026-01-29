/**
 * Adjusts a nominal value to real terms (today's money) by discounting for inflation.
 *
 * @param value - The nominal value to adjust
 * @param year - The year of the value
 * @param baseYear - The baseline year (typically current year)
 * @param inflationRate - Annual inflation rate as decimal (e.g., 0.0326 for 3.26%)
 * @returns The inflation-adjusted value in today's purchasing power
 */
export function adjustForInflation(
  value: number,
  year: number,
  baseYear: number,
  inflationRate: number
): number {
  const yearsFromBase = year - baseYear
  if (yearsFromBase <= 0) return value
  return value / Math.pow(1 + inflationRate, yearsFromBase)
}
