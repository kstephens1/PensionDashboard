import type { DBPension, DBPensionYearIncome } from '@/types/pension'
import { DB_PENSIONS } from '@/constants/dbPensions'

/**
 * Calculates indexed income for a DB pension in a given year
 * Applies compound growth from the start year using the index rate
 */
export function calculateIndexedIncome(pension: DBPension, year: number): number {
  if (year < pension.startYear) {
    return 0
  }

  // Calculate years of indexation
  // Indexation starts from the second year of payment
  const yearsOfGrowth = year - pension.startYear

  if (yearsOfGrowth <= 0) {
    return pension.annualIncome
  }

  // Compound growth: income * (1 + rate)^years
  return pension.annualIncome * Math.pow(1 + pension.indexRate, yearsOfGrowth)
}

/**
 * Calculates DB pension income for a specific tax year
 * Handles partial first year when pension starts mid-year
 *
 * UK tax year runs April 6 to April 5
 * - April start (month 4): full year from start year
 * - January start (month 1): 3 months (Jan-Mar) in prior tax year
 */
export function getDBPensionIncomeForYear(
  pension: DBPension,
  taxYear: number
): DBPensionYearIncome | null {
  // Determine the tax year the pension starts in
  // April start = pension starts in that tax year
  // January start = pension starts in the previous tax year (Jan-Mar are end of tax year)
  const pensionStartTaxYear = pension.startMonth >= 4
    ? pension.startYear
    : pension.startYear - 1

  // If this tax year is before the pension starts, return null
  if (taxYear < pensionStartTaxYear) {
    return null
  }

  const indexedIncome = calculateIndexedIncome(pension, taxYear)
  let grossIncome = indexedIncome
  let isPartialYear = false

  // Check if this is the first (partial) year
  if (taxYear === pensionStartTaxYear) {
    if (pension.startMonth < 4) {
      // Pension starts in January-March
      // This means it belongs to the tax year that ends that April
      // Only 3 months of the tax year (Jan-Mar)
      grossIncome = indexedIncome * (3 / 12)
      isPartialYear = true
    }
    // If startMonth >= 4 (April), it's a full year from the start of the pension
    // but we might want to handle exact month start for more precision
  }

  return {
    pensionId: pension.id,
    name: pension.name,
    grossIncome,
    isPartialYear,
  }
}

/**
 * Gets combined DB pension income for a tax year from all pensions
 */
export function getAllDBIncomeForYear(taxYear: number): {
  breakdown: DBPensionYearIncome[]
  total: number
} {
  const breakdown: DBPensionYearIncome[] = []
  let total = 0

  for (const pension of DB_PENSIONS) {
    const income = getDBPensionIncomeForYear(pension, taxYear)
    if (income && income.grossIncome > 0) {
      breakdown.push(income)
      total += income.grossIncome
    }
  }

  return { breakdown, total }
}

/**
 * Projects DB pension income for a range of years
 * Useful for displaying in tables or charts
 */
export function projectDBIncomeForYears(
  startYear: number,
  endYear: number
): Map<number, { breakdown: DBPensionYearIncome[]; total: number }> {
  const projections = new Map<number, { breakdown: DBPensionYearIncome[]; total: number }>()

  for (let year = startYear; year <= endYear; year++) {
    projections.set(year, getAllDBIncomeForYear(year))
  }

  return projections
}
