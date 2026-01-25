import type { DBPension, PensionMilestone } from '@/types/pension'
import { formatTaxYear } from '@/utils/formatters'

export const DB_PENSIONS: DBPension[] = [
  {
    id: 'keith-kcc-db',
    name: 'Keith KCC DB',
    owner: 'keith',
    lumpSum: 21775.15,
    annualIncome: 7258.38,
    startYear: 2031,
    startMonth: 4,        // April
    indexRate: 0.04,
    isStatePension: false,
  },
  {
    id: 'kath-kcc-db',
    name: 'Kath KCC DB',
    owner: 'kath',
    lumpSum: 12180.11,
    annualIncome: 13628.19,
    startYear: 2047,
    startMonth: 1,        // January
    indexRate: 0.04,
    isStatePension: false,
  },
  {
    id: 'keith-nre-db',
    name: 'Keith NRE DB',
    owner: 'keith',
    lumpSum: 0,
    annualIncome: 5632.00,
    startYear: 2036,
    startMonth: 4,        // April
    indexRate: 0.04,
    isStatePension: false,
  },
  {
    id: 'keith-state',
    name: 'Keith State Pension',
    owner: 'keith',
    lumpSum: 0,
    annualIncome: 11541.90,
    startYear: 2038,
    startMonth: 4,        // April
    indexRate: 0.04,
    isStatePension: true,
  },
  {
    id: 'kath-state',
    name: 'Kath State Pension',
    owner: 'kath',
    lumpSum: 0,
    annualIncome: 11541.90,
    startYear: 2047,
    startMonth: 1,        // January
    indexRate: 0.04,
    isStatePension: true,
  },
]

/**
 * Returns total lump sums from all DB pensions
 * These get added to the PCLS pot
 */
export function getTotalDBLumpSums(): number {
  return DB_PENSIONS.reduce((sum, pension) => sum + pension.lumpSum, 0)
}

/**
 * Returns pension milestones for chart markers
 * Grouped by tax year to avoid cluttering the chart
 */
export function getPensionMilestones(): PensionMilestone[] {
  const milestones: PensionMilestone[] = []

  for (const pension of DB_PENSIONS) {
    // Determine which tax year the pension starts in
    // UK tax year runs April to April
    // April start (month 4+) = starts in that tax year
    // Jan start (month 1-3) = belongs to previous tax year (ends that April)
    const taxYear = pension.startMonth >= 4
      ? pension.startYear
      : pension.startYear - 1  // Jan 2047 start belongs to 2046/47 tax year

    milestones.push({
      year: taxYear,
      taxYear: formatTaxYear(taxYear),
      name: pension.name,
      type: pension.isStatePension ? 'state' : 'db',
    })
  }

  return milestones
}

/**
 * Groups milestones by year for cleaner chart display
 */
export function getGroupedPensionMilestones(): Map<number, PensionMilestone[]> {
  const milestones = getPensionMilestones()
  const grouped = new Map<number, PensionMilestone[]>()

  for (const milestone of milestones) {
    const existing = grouped.get(milestone.year) || []
    existing.push(milestone)
    grouped.set(milestone.year, existing)
  }

  return grouped
}
