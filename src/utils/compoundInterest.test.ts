import { describe, it, expect } from 'vitest'
import { calculateYearEndBalance, calculateMonthlyInterestWithDrawdown, applyAnnualGrowth } from './compoundInterest'

describe('calculateMonthlyInterestWithDrawdown', () => {
  it('applies monthly compound interest without drawdown', () => {
    // £100,000 at 4% annual = ~£104,074 (monthly compounding)
    const result = calculateMonthlyInterestWithDrawdown(100000, 0.04, 0)
    expect(result.endBalance).toBeCloseTo(104074, 0)
    expect(result.totalInterest).toBeCloseTo(4074, 0)
  })

  it('applies monthly drawdown after interest', () => {
    // £100,000 at 4%, £1000/month drawdown
    const result = calculateMonthlyInterestWithDrawdown(100000, 0.04, 1000)
    expect(result.endBalance).toBeGreaterThan(0)
    expect(result.endBalance).toBeLessThan(100000 - 12000 + 4074)
    expect(result.totalDrawdown).toBe(12000)
  })

  it('stops drawdown when balance reaches zero', () => {
    // Small balance, large drawdown should cap at available funds
    const result = calculateMonthlyInterestWithDrawdown(5000, 0.04, 1000)
    expect(result.endBalance).toBe(0)
    expect(result.totalDrawdown).toBeLessThanOrEqual(5000 + 200) // approx interest
  })

  it('handles zero balance', () => {
    const result = calculateMonthlyInterestWithDrawdown(0, 0.04, 1000)
    expect(result.endBalance).toBe(0)
    expect(result.totalInterest).toBe(0)
    expect(result.totalDrawdown).toBe(0)
  })

  it('handles zero interest rate', () => {
    const result = calculateMonthlyInterestWithDrawdown(100000, 0, 1000)
    expect(result.endBalance).toBe(88000)
    expect(result.totalInterest).toBe(0)
    expect(result.totalDrawdown).toBe(12000)
  })
})

describe('calculateYearEndBalance', () => {
  it('calculates year-end balance with drawdown', () => {
    const result = calculateYearEndBalance(100000, 0.04, 12000)
    expect(result.endBalance).toBeGreaterThan(0)
    expect(result.endBalance).toBeLessThan(100000)
  })
})

describe('applyAnnualGrowth', () => {
  it('applies simple annual growth', () => {
    expect(applyAnnualGrowth(100000, 0.04)).toBeCloseTo(104000, 0)
    expect(applyAnnualGrowth(100000, 0.10)).toBeCloseTo(110000, 0)
  })

  it('handles zero growth', () => {
    expect(applyAnnualGrowth(100000, 0)).toBe(100000)
  })
})
