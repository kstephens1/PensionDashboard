export interface PensionConfig {
  dcPot: number
  returnRate: number
  pclsCap: number
}

export type PensionOwner = 'keith' | 'kath'

export interface DBPension {
  id: string
  name: string
  owner: PensionOwner
  lumpSum: number           // Added to PCLS pot
  annualIncome: number      // Base annual income
  startYear: number         // Year payments begin
  startMonth: number        // Month (1-12, 4=April, 1=January)
  indexRate: number         // Annual increase (0.04 = 4%)
  isStatePension: boolean
}

export interface DBPensionYearIncome {
  pensionId: string
  name: string
  grossIncome: number
  isPartialYear: boolean
}

export interface PensionMilestone {
  year: number
  taxYear: string
  name: string
  type: 'db' | 'state'
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
  dbPensionIncome: DBPensionYearIncome[]
  totalDBIncome: number
  totalGrossIncome: number   // SIPP + DB income (for tax calculation)
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
  dbLumpSums: number
}

export interface ChartDataPoint {
  year: number
  taxYear: string
  annualNetIncome: number
  totalDBIncome: number
  pclsRemaining: number
  sippRemaining: number
}
