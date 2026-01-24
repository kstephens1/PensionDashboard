export interface PensionConfig {
  dcPot: number
  returnRate: number
  pclsCap: number
}

export interface TaxBand {
  name: string
  min: number
  max: number
  rate: number
}

export interface TaxConfig {
  personalAllowance: number
  bands: TaxBand[]
}

export interface DrawdownInput {
  year: number
  taxYear: string
  pclsDrawdown: number
  sippDrawdown: number
}

export interface YearProjection {
  year: number
  taxYear: string
  pclsDrawdown: number
  sippDrawdown: number
  monthlyTax: number
  annualTax: number
  monthlyNetIncome: number
  annualNetIncome: number
  pclsRemaining: number
  sippRemaining: number
  pclsStartOfYear: number
  sippStartOfYear: number
}

export interface PclsSplit {
  pcls: number
  sipp: number
}

export interface ChartDataPoint {
  year: number
  taxYear: string
  annualNetIncome: number
  pclsRemaining: number
  sippRemaining: number
}
