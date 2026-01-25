import { calculatePclsSplit, TOTAL_YEARS, START_YEAR } from '@/constants/defaults'
import type { PensionConfig } from '@/types/pension'
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
}

const BOOSTED_YEARS = 10

/**
 * Calculates an optimized drawdown plan where the first 10 years
 * receive higher income than subsequent years, controlled by a bias percentage.
 *
 * Algorithm:
 * 1. Calculate initial PCLS/SIPP balances from pension config
 * 2. Determine target income ratio: first 10 years get (1 + biasPct/100) times base income
 * 3. Calculate total withdrawable over TOTAL_YEARS (accounting for growth)
 * 4. Solve for base annual income where: 10 * boosted + (TOTAL_YEARS-10) * base = total
 * 5. Distribute drawdowns per year: PCLS first (tax-free), then SIPP
 */
export function calculateBiasedDrawdownPlan(
  pensionConfig: PensionConfig,
  biasPct: number
): OptimizerResult {
  const { pcls: initialPcls, sipp: initialSipp } = calculatePclsSplit(
    pensionConfig.dcPot,
    pensionConfig.pclsCap
  )

  const annualRate = pensionConfig.returnRate
  const biasMultiplier = 1 + biasPct / 100
  const remainingYears = TOTAL_YEARS - BOOSTED_YEARS

  // Estimate total withdrawable amount over TOTAL_YEARS
  // We use an iterative approach to find the right base income
  const totalWithdrawable = estimateTotalWithdrawable(
    initialPcls,
    initialSipp,
    annualRate,
    TOTAL_YEARS
  )

  // Solve for base income:
  // 10 * base * biasMultiplier + remainingYears * base = totalWithdrawable
  // base * (10 * biasMultiplier + remainingYears) = totalWithdrawable
  const baseIncome = totalWithdrawable / (BOOSTED_YEARS * biasMultiplier + remainingYears)
  const boostedIncome = baseIncome * biasMultiplier

  // Build the drawdown plan
  const plan = new Map<number, { pcls: number; sipp: number }>()
  let remainingPcls = initialPcls
  let remainingSipp = initialSipp

  for (let i = 0; i < TOTAL_YEARS; i++) {
    const year = START_YEAR + i
    const targetIncome = i < BOOSTED_YEARS ? boostedIncome : baseIncome

    // Simulate growth at start of year (simplified - apply to both pots)
    if (i > 0) {
      remainingPcls *= (1 + annualRate)
      remainingSipp *= (1 + annualRate)
    }

    // Get DB pension income for this year
    // This reduces the amount we need to withdraw from DC pots
    const { total: dbIncome } = getAllDBIncomeForYear(year)
    const dcNeeded = Math.max(0, targetIncome - dbIncome)

    // Distribute: PCLS first (tax-free), then SIPP
    let pclsDrawdown = 0
    let sippDrawdown = 0

    if (remainingPcls > 0) {
      pclsDrawdown = Math.min(dcNeeded, remainingPcls)
      sippDrawdown = Math.max(0, dcNeeded - pclsDrawdown)
    } else {
      sippDrawdown = dcNeeded
    }

    // Cap to available balances
    pclsDrawdown = Math.min(pclsDrawdown, Math.max(0, remainingPcls))
    sippDrawdown = Math.min(sippDrawdown, Math.max(0, remainingSipp))

    // Update remaining balances
    remainingPcls = Math.max(0, remainingPcls - pclsDrawdown)
    remainingSipp = Math.max(0, remainingSipp - sippDrawdown)

    plan.set(year, {
      pcls: Math.round(pclsDrawdown),
      sipp: Math.round(sippDrawdown),
    })
  }

  return {
    plan,
    baseIncome: Math.round(baseIncome),
    boostedIncome: Math.round(boostedIncome),
  }
}

/**
 * Estimates total withdrawable amount over a number of years
 * by simulating pot growth with moderate drawdowns
 */
function estimateTotalWithdrawable(
  initialPcls: number,
  initialSipp: number,
  annualRate: number,
  years: number
): number {
  // Calculate present value of annuity with growth
  // This is an approximation - the exact calculation would require iteration

  const totalPot = initialPcls + initialSipp
  let totalWithdrawable = 0

  // Account for the fact that later withdrawals benefit from more growth
  // Use a weighted average approach
  for (let i = 0; i < years; i++) {
    const growthMultiplier = Math.pow(1 + annualRate, i)
    totalWithdrawable += (totalPot / years) * growthMultiplier
  }

  return totalWithdrawable
}
