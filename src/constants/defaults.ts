import type { PensionConfig, TaxConfig } from '@/types/pension'

export const DEFAULT_DC_POT = 863000
export const DEFAULT_RETURN_RATE = 0.04
export const PCLS_PERCENTAGE = 0.25
export const PCLS_CAP = 268275

export const START_YEAR = 2031
export const END_YEAR = 2071
export const TOTAL_YEARS = END_YEAR - START_YEAR
export const START_AGE = 60

export function getAgeForYear(year: number): number {
  return START_AGE + (year - START_YEAR)
}
export const DEFAULT_PCLS_DRAWDOWN = 15000
export const DEFAULT_SIPP_DRAWDOWN = 35000

export const DEFAULT_PENSION_CONFIG: PensionConfig = {
  dcPot: DEFAULT_DC_POT,
  returnRate: DEFAULT_RETURN_RATE,
  pclsCap: PCLS_CAP,
}

export const DEFAULT_TAX_CONFIG: TaxConfig = {
  personalAllowance: 12570,
  bands: [
    { name: 'Basic Rate', min: 12571, max: 50270, rate: 0.20 },
    { name: 'Higher Rate', min: 50271, max: 125140, rate: 0.40 },
    { name: 'Additional Rate', min: 125141, max: Infinity, rate: 0.45 },
  ],
}

export function calculatePclsSplit(dcPot: number, pclsCap: number) {
  const rawPcls = dcPot * PCLS_PERCENTAGE
  const pcls = Math.min(rawPcls, pclsCap)
  const sipp = dcPot - pcls
  return { pcls, sipp }
}
