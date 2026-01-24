import { useMemo } from 'react'
import type { TaxConfig } from '@/types/pension'
import { calculateTax, type TaxResult } from '@/utils/taxCalculator'

export function useTaxCalculation(annualIncome: number, taxConfig: TaxConfig): TaxResult {
  return useMemo(() => {
    return calculateTax(annualIncome, taxConfig)
  }, [annualIncome, taxConfig])
}
