import { calculatePclsSplit, START_YEAR } from '@/constants/defaults'
import type { PensionConfig, OptimizerConfig } from '@/types/pension'
import { getAllDBIncomeForYear } from './dbPensionCalculator'

export interface DrawdownPlan {
  year: number
  pclsDrawdown: number
  sippDrawdown: number
}

export interface OptimizerResult {
  plan: Map<number, { pcls: number; sipp: number }>
  baseIncome: number
  boostedIncome: number
  projectedSippAtDepletion: number
  projectedPclsAtDepletion: number
  pclsAnnualDrawdown: number
}

const BOOSTED_YEARS = 10

/**
 * Calculates an optimized drawdown plan that:
 * 1. Depletes PCLS to £0 by sippDepletionYear (fixed annual amount, tax-optimal)
 * 2. Depletes SIPP to a target remainder by sippDepletionYear (with bias for early years)
 *
 * PCLS is always depleted to £0 by the SIPP depletion year because:
 * - PCLS is tax-free, SIPP is taxable
 * - Using all tax-free money first minimizes lifetime tax
 * - No user configuration needed - this is always optimal
 */
export function calculateBiasedDrawdownPlan(
  pensionConfig: PensionConfig,
  biasPct: number,
  optimizerConfig: OptimizerConfig
): OptimizerResult {
  const { pcls: initialPcls, sipp: initialSipp } = calculatePclsSplit(
    pensionConfig.dcPot,
    pensionConfig.pclsCap
  )

  const annualRate = pensionConfig.returnRate
  const biasMultiplier = 1 + biasPct / 100
  const sippDepletionYear = optimizerConfig.sippDepletionYear
  const sippTargetRemainder = optimizerConfig.sippRemainder
  // PCLS: Always deplete to £0 by SIPP depletion year (tax-optimal strategy)
  const pclsDepletionYear = sippDepletionYear
  const pclsTargetRemainder = 0

  // Calculate number of years for each pot
  const sippTotalYears = sippDepletionYear - START_YEAR
  const pclsTotalYears = pclsDepletionYear - START_YEAR
  const boostedYearsActual = Math.min(BOOSTED_YEARS, sippTotalYears)

  // Step 1: Find the fixed annual PCLS withdrawal that depletes PCLS to target by pclsDepletionYear
  const pclsAnnualDrawdown = findOptimalPclsWithdrawal(
    initialPcls,
    annualRate,
    pclsTotalYears,
    pclsTargetRemainder
  )

  // Step 2: Find the base SIPP withdrawal that achieves target SIPP remainder
  // accounting for the fixed PCLS drawdown schedule
  const baseIncome = findOptimalSippWithdrawal(
    initialPcls,
    initialSipp,
    annualRate,
    sippTotalYears,
    boostedYearsActual,
    biasMultiplier,
    sippTargetRemainder,
    pclsAnnualDrawdown,
    pclsTotalYears
  )

  const boostedIncome = baseIncome * biasMultiplier

  // Build the drawdown plan with simulation
  const plan = new Map<number, { pcls: number; sipp: number }>()
  let remainingPcls = initialPcls
  let remainingSipp = initialSipp
  let projectedPclsAtDepletion = 0

  for (let i = 0; i < sippTotalYears; i++) {
    const year = START_YEAR + i
    const targetIncome = i < boostedYearsActual ? boostedIncome : baseIncome

    // Apply growth at start of year (except first year)
    if (i > 0) {
      remainingPcls *= (1 + annualRate)
      remainingSipp *= (1 + annualRate)
    }

    // Get DB pension income for this year
    const { total: dbIncome } = getAllDBIncomeForYear(year)

    // PCLS: Fixed annual amount (independent of DB income) until depletion year
    let pclsDrawdown = 0
    if (i < pclsTotalYears && remainingPcls > 0) {
      pclsDrawdown = Math.min(pclsAnnualDrawdown, remainingPcls)
    }

    // SIPP: Fills remaining income gap after DB and PCLS
    const incomeFromDbAndPcls = dbIncome + pclsDrawdown
    const sippNeeded = Math.max(0, targetIncome - incomeFromDbAndPcls)
    const sippDrawdown = Math.min(sippNeeded, Math.max(0, remainingSipp))

    // Update remaining balances
    remainingPcls = Math.max(0, remainingPcls - pclsDrawdown)
    remainingSipp = Math.max(0, remainingSipp - sippDrawdown)

    // Capture PCLS balance at depletion year
    if (i === pclsTotalYears - 1) {
      projectedPclsAtDepletion = Math.round(remainingPcls * (1 + annualRate))
    }

    plan.set(year, {
      pcls: Math.round(pclsDrawdown),
      sipp: Math.round(sippDrawdown),
    })
  }

  // If PCLS depletion year is same as SIPP depletion year, capture at end
  if (pclsTotalYears >= sippTotalYears) {
    projectedPclsAtDepletion = Math.round(remainingPcls * (1 + annualRate))
  }

  // Apply final year growth for projected SIPP balance
  const projectedSippAtDepletion = Math.round(remainingSipp * (1 + annualRate))

  return {
    plan,
    baseIncome: Math.round(baseIncome),
    boostedIncome: Math.round(boostedIncome),
    projectedSippAtDepletion,
    projectedPclsAtDepletion,
    pclsAnnualDrawdown: Math.round(pclsAnnualDrawdown),
  }
}

/**
 * Uses binary search to find the fixed annual PCLS withdrawal that depletes
 * PCLS to target remainder by the specified depletion year.
 */
function findOptimalPclsWithdrawal(
  initialPcls: number,
  annualRate: number,
  totalYears: number,
  targetRemainder: number
): number {
  if (totalYears <= 0) return 0

  // Initial estimate using simple annuity formula
  const futureValue = initialPcls * Math.pow(1 + annualRate, totalYears)
  const withdrawable = futureValue - targetRemainder
  const annuityFactor = (Math.pow(1 + annualRate, totalYears) - 1) / annualRate
  const initialEstimate = withdrawable / annuityFactor

  // Binary search for precise value
  let low = 0
  let high = initialEstimate * 3
  let bestWithdrawal = initialEstimate

  for (let iteration = 0; iteration < 50; iteration++) {
    const mid = (low + high) / 2
    const result = simulatePclsWithdrawals(initialPcls, annualRate, totalYears, mid)

    if (Math.abs(result - targetRemainder) < 100) {
      bestWithdrawal = mid
      break
    }

    if (result > targetRemainder) {
      // PCLS too high, not withdrawing enough, increase
      low = mid
    } else {
      // PCLS too low, withdrawing too much, decrease
      high = mid
    }

    bestWithdrawal = mid
  }

  return Math.max(0, bestWithdrawal)
}

/**
 * Simulates PCLS withdrawals and returns final balance.
 */
function simulatePclsWithdrawals(
  initialPcls: number,
  annualRate: number,
  totalYears: number,
  annualWithdrawal: number
): number {
  let pcls = initialPcls

  for (let i = 0; i < totalYears; i++) {
    // Apply growth at start of year (except first year)
    if (i > 0) {
      pcls *= (1 + annualRate)
    }

    // Withdraw
    pcls = Math.max(0, pcls - annualWithdrawal)
  }

  // Apply final year growth
  pcls *= (1 + annualRate)

  return pcls
}

/**
 * Uses binary search to find the base income withdrawal rate that achieves
 * the target SIPP remainder at depletion year, accounting for fixed PCLS drawdown.
 */
function findOptimalSippWithdrawal(
  initialPcls: number,
  initialSipp: number,
  annualRate: number,
  totalYears: number,
  boostedYears: number,
  biasMultiplier: number,
  targetRemainder: number,
  pclsAnnualDrawdown: number,
  pclsTotalYears: number
): number {
  // Calculate weighted years (boosted years count more due to higher withdrawal)
  const effectiveYears = boostedYears * biasMultiplier + (totalYears - boostedYears)

  // Initial estimate - rough approximation based on SIPP only
  const withdrawable = initialSipp - targetRemainder / Math.pow(1 + annualRate, totalYears)
  const initialEstimate = Math.max(10000, withdrawable / effectiveYears)

  // Binary search for precise value
  let low = initialEstimate * 0.1
  let high = initialEstimate * 5
  let bestWithdrawal = initialEstimate

  for (let iteration = 0; iteration < 50; iteration++) {
    const mid = (low + high) / 2
    const result = simulateSippWithdrawals(
      initialPcls,
      initialSipp,
      annualRate,
      totalYears,
      boostedYears,
      biasMultiplier,
      mid,
      START_YEAR,
      pclsAnnualDrawdown,
      pclsTotalYears
    )

    if (Math.abs(result - targetRemainder) < 100) {
      bestWithdrawal = mid
      break
    }

    if (result > targetRemainder) {
      // SIPP too high, not withdrawing enough, increase
      low = mid
    } else {
      // SIPP too low, withdrawing too much, decrease
      high = mid
    }

    bestWithdrawal = mid
  }

  return bestWithdrawal
}

/**
 * Simulates withdrawals with fixed PCLS drawdown and returns final SIPP balance.
 * PCLS is drawn as a fixed amount regardless of DB income.
 * SIPP fills the remaining gap to reach target income.
 */
function simulateSippWithdrawals(
  initialPcls: number,
  initialSipp: number,
  annualRate: number,
  totalYears: number,
  boostedYears: number,
  biasMultiplier: number,
  baseIncome: number,
  startYear: number,
  pclsAnnualDrawdown: number,
  pclsTotalYears: number
): number {
  let pcls = initialPcls
  let sipp = initialSipp

  for (let i = 0; i < totalYears; i++) {
    const year = startYear + i

    // Apply growth at start of year (except first year)
    if (i > 0) {
      pcls *= (1 + annualRate)
      sipp *= (1 + annualRate)
    }

    // Determine target income for this year
    const targetIncome = i < boostedYears
      ? baseIncome * biasMultiplier
      : baseIncome

    // DB income
    const { total: dbIncome } = getAllDBIncomeForYear(year)

    // PCLS: Fixed annual amount until depletion year
    let pclsWithdraw = 0
    if (i < pclsTotalYears && pcls > 0) {
      pclsWithdraw = Math.min(pclsAnnualDrawdown, pcls)
      pcls = Math.max(0, pcls - pclsWithdraw)
    }

    // SIPP: Fills remaining income gap
    const incomeFromDbAndPcls = dbIncome + pclsWithdraw
    const sippNeeded = Math.max(0, targetIncome - incomeFromDbAndPcls)
    sipp = Math.max(0, sipp - sippNeeded)
  }

  // Apply final year growth
  sipp *= (1 + annualRate)

  return sipp
}
