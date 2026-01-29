import { calculatePclsSplit, START_YEAR, TOTAL_YEARS } from '@/constants/defaults'
import type { PensionConfig, OptimizerConfig } from '@/types/pension'
import { getAllDBIncomeForYear } from './dbPensionCalculator'
import { calculateMonthlyInterestWithDrawdown } from './compoundInterest'

/**
 * Applies monthly compounding with drawdown for a year, matching useDrawdownCalculations.
 * Returns { endBalance, actualDrawdown }
 */
function applyYearWithMonthlyCompounding(
  startBalance: number,
  annualRate: number,
  requestedDrawdown: number
): { endBalance: number; actualDrawdown: number } {
  const result = calculateMonthlyInterestWithDrawdown(
    startBalance,
    annualRate,
    requestedDrawdown / 12
  )
  return {
    endBalance: result.endBalance,
    actualDrawdown: result.totalDrawdown,
  }
}

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
 * 2. Depletes SIPP to a target remainder by sippDepletionYear using two phases:
 *    - Phase 1 (boosted years): Higher withdrawals to fill income gap
 *    - Phase 2 (remaining years): Fixed withdrawals to ensure SIPP depletion
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

  // Calculate number of years for each pot (inclusive of depletion year)
  // e.g., 2031 to 2054 = 24 years of withdrawals
  const sippTotalYears = sippDepletionYear - START_YEAR + 1
  const pclsTotalYears = pclsDepletionYear - START_YEAR + 1
  const boostedYearsActual = Math.min(BOOSTED_YEARS, sippTotalYears)

  // Step 1: Find the fixed annual PCLS withdrawal that depletes PCLS to target by pclsDepletionYear
  const pclsAnnualDrawdown = findOptimalPclsWithdrawal(
    initialPcls,
    annualRate,
    pclsTotalYears,
    pclsTargetRemainder
  )

  // Step 2: Find the boosted income for Phase 1 that maximizes early withdrawals
  // while still allowing SIPP to deplete by target year
  const { boostedIncome, phase2SippWithdrawal } = findOptimalTwoPhaseWithdrawal(
    initialPcls,
    initialSipp,
    annualRate,
    sippTotalYears,
    boostedYearsActual,
    sippTargetRemainder,
    pclsAnnualDrawdown,
    pclsTotalYears
  )

  const baseIncome = boostedIncome / biasMultiplier

  // Build the drawdown plan with simulation using monthly compounding
  // This matches the actual simulation in useDrawdownCalculations
  // IMPORTANT: Plan must cover ALL years (not just to depletion year) to override defaults
  const plan = new Map<number, { pcls: number; sipp: number }>()
  let remainingPcls = initialPcls
  let remainingSipp = initialSipp
  let projectedPclsAtDepletion = 0
  let projectedSippAtDepletion = 0

  for (let i = 0; i < TOTAL_YEARS; i++) {
    const year = START_YEAR + i
    const isWithinDepletionPeriod = i < sippTotalYears
    const isPhase1 = i < boostedYearsActual

    // Get DB pension income for this year
    const { total: dbIncome } = getAllDBIncomeForYear(year)

    // After depletion year, set drawdowns to £0
    if (!isWithinDepletionPeriod) {
      plan.set(year, { pcls: 0, sipp: 0 })
      continue
    }

    // Determine requested PCLS drawdown
    let requestedPclsDrawdown = 0
    if (i < pclsTotalYears && remainingPcls > 0) {
      requestedPclsDrawdown = pclsAnnualDrawdown
    }

    // Determine requested SIPP drawdown
    let requestedSippDrawdown: number
    if (isPhase1) {
      // Phase 1: Fill income gap to reach boosted income target
      // Estimate PCLS contribution (may be less if pot is low)
      const estimatedPclsDrawdown = Math.min(requestedPclsDrawdown, remainingPcls)
      const incomeFromDbAndPcls = dbIncome + estimatedPclsDrawdown
      requestedSippDrawdown = Math.max(0, boostedIncome - incomeFromDbAndPcls)
    } else {
      // Phase 2: Fixed withdrawal to ensure SIPP depletion
      requestedSippDrawdown = phase2SippWithdrawal
    }

    // Apply monthly compounding with drawdowns (matches useDrawdownCalculations)
    const pclsResult = applyYearWithMonthlyCompounding(remainingPcls, annualRate, requestedPclsDrawdown)
    const sippResult = applyYearWithMonthlyCompounding(remainingSipp, annualRate, requestedSippDrawdown)

    // Update remaining balances
    remainingPcls = pclsResult.endBalance
    remainingSipp = sippResult.endBalance

    plan.set(year, {
      pcls: Math.round(pclsResult.actualDrawdown),
      sipp: Math.round(sippResult.actualDrawdown),
    })

    // Capture balances at depletion year
    if (i === sippTotalYears - 1) {
      projectedSippAtDepletion = Math.round(remainingSipp)
      projectedPclsAtDepletion = Math.round(remainingPcls)
    }
  }

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
 * Uses monthly compounding to match useDrawdownCalculations.
 */
function simulatePclsWithdrawals(
  initialPcls: number,
  annualRate: number,
  totalYears: number,
  annualWithdrawal: number
): number {
  let pcls = initialPcls

  for (let i = 0; i < totalYears; i++) {
    const result = applyYearWithMonthlyCompounding(pcls, annualRate, annualWithdrawal)
    pcls = result.endBalance
  }

  return pcls
}

/**
 * Finds optimal two-phase withdrawal strategy:
 * Phase 1: Boosted income-based withdrawals for early years
 * Phase 2: Fixed withdrawals to ensure SIPP depletion by target year
 *
 * Returns the boosted income target and the Phase 2 fixed SIPP withdrawal.
 */
function findOptimalTwoPhaseWithdrawal(
  initialPcls: number,
  initialSipp: number,
  annualRate: number,
  totalYears: number,
  boostedYears: number,
  targetRemainder: number,
  pclsAnnualDrawdown: number,
  pclsTotalYears: number
): { boostedIncome: number; phase2SippWithdrawal: number } {
  const phase2Years = totalYears - boostedYears

  // If no phase 2 years, use original income-based approach
  if (phase2Years <= 0) {
    const boostedIncome = findBoostedIncomeForTarget(
      initialPcls,
      initialSipp,
      annualRate,
      totalYears,
      boostedYears,
      targetRemainder,
      pclsAnnualDrawdown,
      pclsTotalYears
    )
    return { boostedIncome, phase2SippWithdrawal: 0 }
  }

  // Binary search for the boosted income that, combined with phase 2 fixed withdrawals,
  // depletes SIPP to target
  // Start with a wide range - income can vary significantly based on DB pensions
  let low = 20000
  let high = 200000
  let bestBoostedIncome = 80000
  let bestPhase2Withdrawal = 0

  // We want to find the boosted income that results in hitting the target SIPP.
  // Higher target remainder should result in lower boosted income (withdraw less).
  // Lower target remainder should result in higher boosted income (withdraw more).
  for (let iteration = 0; iteration < 50; iteration++) {
    const boostedIncome = (low + high) / 2

    // Simulate Phase 1 to find SIPP balance at end of boosted years
    const sippAtPhase2Start = simulatePhase1(
      initialPcls,
      initialSipp,
      annualRate,
      boostedYears,
      boostedIncome,
      pclsAnnualDrawdown,
      pclsTotalYears
    )

    // Calculate fixed Phase 2 withdrawal to deplete remaining SIPP
    const phase2Withdrawal = calculateFixedWithdrawal(
      sippAtPhase2Start,
      annualRate,
      phase2Years,
      targetRemainder
    )

    // Simulate full plan to verify
    const finalSipp = simulateTwoPhase(
      initialPcls,
      initialSipp,
      annualRate,
      totalYears,
      boostedYears,
      boostedIncome,
      phase2Withdrawal,
      pclsAnnualDrawdown,
      pclsTotalYears
    )

    if (Math.abs(finalSipp - targetRemainder) < 100) {
      bestBoostedIncome = boostedIncome
      bestPhase2Withdrawal = phase2Withdrawal
      break
    }

    // Higher boosted income → more withdrawn in Phase 1 → lower SIPP at Phase 2 start
    // → lower Phase 2 withdrawal needed → lower final SIPP
    if (finalSipp > targetRemainder) {
      // Final SIPP too high, need to withdraw more → increase boosted income
      low = boostedIncome
    } else {
      // Final SIPP too low, withdrawing too much → decrease boosted income
      high = boostedIncome
    }

    bestBoostedIncome = boostedIncome
    bestPhase2Withdrawal = phase2Withdrawal
  }

  // Recalculate phase2 withdrawal for the best boosted income found
  const finalSippAtPhase2Start = simulatePhase1(
    initialPcls,
    initialSipp,
    annualRate,
    boostedYears,
    bestBoostedIncome,
    pclsAnnualDrawdown,
    pclsTotalYears
  )
  bestPhase2Withdrawal = calculateFixedWithdrawal(
    finalSippAtPhase2Start,
    annualRate,
    phase2Years,
    targetRemainder
  )

  return { boostedIncome: bestBoostedIncome, phase2SippWithdrawal: bestPhase2Withdrawal }
}

/**
 * Simulates Phase 1 (boosted years) and returns SIPP balance at end of Phase 1.
 * Uses monthly compounding to match useDrawdownCalculations.
 */
function simulatePhase1(
  initialPcls: number,
  initialSipp: number,
  annualRate: number,
  boostedYears: number,
  boostedIncome: number,
  pclsAnnualDrawdown: number,
  pclsTotalYears: number
): number {
  let pcls = initialPcls
  let sipp = initialSipp

  for (let i = 0; i < boostedYears; i++) {
    const year = START_YEAR + i

    // DB income
    const { total: dbIncome } = getAllDBIncomeForYear(year)

    // Determine requested PCLS drawdown
    const requestedPclsDrawdown = i < pclsTotalYears ? pclsAnnualDrawdown : 0

    // Apply PCLS with monthly compounding
    const pclsResult = applyYearWithMonthlyCompounding(pcls, annualRate, requestedPclsDrawdown)
    const actualPclsDrawdown = pclsResult.actualDrawdown
    pcls = pclsResult.endBalance

    // SIPP fills income gap
    const incomeFromDbAndPcls = dbIncome + actualPclsDrawdown
    const sippNeeded = Math.max(0, boostedIncome - incomeFromDbAndPcls)

    // Apply SIPP with monthly compounding
    const sippResult = applyYearWithMonthlyCompounding(sipp, annualRate, sippNeeded)
    sipp = sippResult.endBalance
  }

  return sipp
}

/**
 * Calculates fixed annual withdrawal to deplete a pot from startBalance to targetRemainder.
 * Uses the annuity formula for initial estimate, then binary search with monthly compounding
 * to match useDrawdownCalculations.
 */
function calculateFixedWithdrawal(
  startBalance: number,
  annualRate: number,
  years: number,
  targetRemainder: number
): number {
  if (years <= 0) return 0
  if (startBalance <= targetRemainder) return 0

  // Use annuity formula to calculate initial estimate for sustainable withdrawal
  // PV = W * (1 - (1+r)^-n) / r
  // Solving for W: W = (PV - FV/(1+r)^n) * r / (1 - (1+r)^-n)
  // Simplified for FV (targetRemainder):
  const amountToWithdraw = startBalance - targetRemainder / Math.pow(1 + annualRate, years)
  const annuityFactor = (1 - Math.pow(1 + annualRate, -years)) / annualRate
  const annuityEstimate = amountToWithdraw / annuityFactor

  // Binary search around the annuity estimate (±50% range to account for monthly compounding)
  let low = annuityEstimate * 0.5
  let high = annuityEstimate * 1.5

  for (let iter = 0; iter < 50; iter++) {
    const W = (low + high) / 2
    let balance = startBalance

    // Simulate Phase 2 with monthly compounding
    for (let i = 0; i < years; i++) {
      const result = applyYearWithMonthlyCompounding(balance, annualRate, W)
      balance = result.endBalance
    }

    if (Math.abs(balance - targetRemainder) < 100) return W
    if (balance > targetRemainder) low = W
    else high = W
  }

  return (low + high) / 2
}

/**
 * Simulates full two-phase withdrawal and returns final SIPP balance.
 * Uses monthly compounding to match useDrawdownCalculations.
 */
function simulateTwoPhase(
  initialPcls: number,
  initialSipp: number,
  annualRate: number,
  totalYears: number,
  boostedYears: number,
  boostedIncome: number,
  phase2Withdrawal: number,
  pclsAnnualDrawdown: number,
  pclsTotalYears: number
): number {
  let pcls = initialPcls
  let sipp = initialSipp

  for (let i = 0; i < totalYears; i++) {
    const year = START_YEAR + i
    const isPhase1 = i < boostedYears

    // DB income
    const { total: dbIncome } = getAllDBIncomeForYear(year)

    // Determine requested PCLS drawdown
    const requestedPclsDrawdown = i < pclsTotalYears ? pclsAnnualDrawdown : 0

    // Apply PCLS with monthly compounding
    const pclsResult = applyYearWithMonthlyCompounding(pcls, annualRate, requestedPclsDrawdown)
    const actualPclsDrawdown = pclsResult.actualDrawdown
    pcls = pclsResult.endBalance

    // Determine requested SIPP drawdown
    let requestedSippDrawdown: number
    if (isPhase1) {
      // Phase 1: Fill income gap
      const incomeFromDbAndPcls = dbIncome + actualPclsDrawdown
      requestedSippDrawdown = Math.max(0, boostedIncome - incomeFromDbAndPcls)
    } else {
      // Phase 2: Fixed withdrawal
      requestedSippDrawdown = phase2Withdrawal
    }

    // Apply SIPP with monthly compounding
    const sippResult = applyYearWithMonthlyCompounding(sipp, annualRate, requestedSippDrawdown)
    sipp = sippResult.endBalance
  }

  return sipp
}

/**
 * Fallback: find boosted income using income-based approach (for cases with no Phase 2).
 */
function findBoostedIncomeForTarget(
  initialPcls: number,
  initialSipp: number,
  annualRate: number,
  totalYears: number,
  boostedYears: number,
  targetRemainder: number,
  pclsAnnualDrawdown: number,
  pclsTotalYears: number
): number {
  // Wide search range to accommodate various scenarios
  let low = 20000
  let high = 200000
  let bestIncome = 80000

  for (let iteration = 0; iteration < 50; iteration++) {
    const income = (low + high) / 2
    const result = simulateTwoPhase(
      initialPcls,
      initialSipp,
      annualRate,
      totalYears,
      boostedYears,
      income,
      0,
      pclsAnnualDrawdown,
      pclsTotalYears
    )

    if (Math.abs(result - targetRemainder) < 100) {
      bestIncome = income
      break
    }

    if (result > targetRemainder) {
      low = income
    } else {
      high = income
    }

    bestIncome = income
  }

  return bestIncome
}
