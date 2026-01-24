import type { TaxConfig } from '@/types/pension'

export interface TaxBreakdown {
  band: string
  taxableAmount: number
  rate: number
  tax: number
}

export interface TaxResult {
  grossIncome: number
  personalAllowance: number
  taxableIncome: number
  totalTax: number
  effectiveRate: number
  breakdown: TaxBreakdown[]
}

export function calculatePersonalAllowance(income: number, baseAllowance: number): number {
  if (income <= 100000) {
    return baseAllowance
  }

  const reduction = Math.floor((income - 100000) / 2)
  return Math.max(0, baseAllowance - reduction)
}

export function calculateTax(grossIncome: number, taxConfig: TaxConfig): TaxResult {
  if (grossIncome <= 0) {
    return {
      grossIncome: 0,
      personalAllowance: taxConfig.personalAllowance,
      taxableIncome: 0,
      totalTax: 0,
      effectiveRate: 0,
      breakdown: [],
    }
  }

  const personalAllowance = calculatePersonalAllowance(grossIncome, taxConfig.personalAllowance)
  const taxableIncome = Math.max(0, grossIncome - personalAllowance)

  if (taxableIncome === 0) {
    return {
      grossIncome,
      personalAllowance,
      taxableIncome: 0,
      totalTax: 0,
      effectiveRate: 0,
      breakdown: [],
    }
  }

  const breakdown: TaxBreakdown[] = []
  let remainingTaxable = taxableIncome
  let totalTax = 0
  let previousBandMax = taxConfig.personalAllowance

  for (const band of taxConfig.bands) {
    if (remainingTaxable <= 0) break

    const bandWidth = band.max === Infinity
      ? remainingTaxable
      : Math.min(band.max - previousBandMax, remainingTaxable)

    if (bandWidth > 0) {
      const taxForBand = bandWidth * band.rate
      totalTax += taxForBand
      remainingTaxable -= bandWidth

      breakdown.push({
        band: band.name,
        taxableAmount: bandWidth,
        rate: band.rate,
        tax: taxForBand,
      })
    }

    previousBandMax = band.max
  }

  return {
    grossIncome,
    personalAllowance,
    taxableIncome,
    totalTax,
    effectiveRate: totalTax / grossIncome,
    breakdown,
  }
}

export function calculateNetIncome(grossIncome: number, tax: number): number {
  return grossIncome - tax
}

export function calculateMonthlyTax(annualIncome: number, taxConfig: TaxConfig): number {
  const result = calculateTax(annualIncome, taxConfig)
  return result.totalTax / 12
}
