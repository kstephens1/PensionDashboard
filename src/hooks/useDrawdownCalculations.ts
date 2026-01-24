import { useMemo } from 'react'
import { usePensionStore } from '@/store/pensionStore'
import type { YearProjection, ChartDataPoint } from '@/types/pension'
import { calculatePclsSplit, START_YEAR, TOTAL_YEARS } from '@/constants/defaults'
import { calculateMonthlyInterestWithDrawdown } from '@/utils/compoundInterest'
import { calculateTax } from '@/utils/taxCalculator'
import { formatTaxYear } from '@/utils/formatters'

interface DrawdownTotals {
  initialPcls: number
  initialSipp: number
  pclsRemaining: number
  sippRemaining: number
  totalPclsDrawn: number
  totalSippDrawn: number
  totalTaxPaid: number
  totalNetIncome: number
}

interface DrawdownCalculationsResult {
  projections: YearProjection[]
  totals: DrawdownTotals
  chartData: ChartDataPoint[]
}

export function useDrawdownCalculations(): DrawdownCalculationsResult {
  const { pensionConfig, taxConfig, drawdownInputs } = usePensionStore()

  return useMemo(() => {
    const { pcls: initialPcls, sipp: initialSipp } = calculatePclsSplit(
      pensionConfig.dcPot,
      pensionConfig.pclsCap
    )

    const projections: YearProjection[] = []
    const chartData: ChartDataPoint[] = []

    let currentPcls = initialPcls
    let currentSipp = initialSipp
    let totalPclsDrawn = 0
    let totalSippDrawn = 0
    let totalTaxPaid = 0
    let totalNetIncome = 0

    for (let i = 0; i < TOTAL_YEARS; i++) {
      const year = START_YEAR + i
      const taxYear = formatTaxYear(year)
      const input = drawdownInputs.get(year)

      const pclsStartOfYear = currentPcls
      const sippStartOfYear = currentSipp

      // Get drawdown amounts, capped to available balance
      const requestedPclsDrawdown = input?.pclsDrawdown ?? 0
      const requestedSippDrawdown = input?.sippDrawdown ?? 0

      // Calculate PCLS year (tax-free, so no compound interest effect on drawdown timing)
      // Apply growth first, then drawdown
      const pclsResult = calculateMonthlyInterestWithDrawdown(
        currentPcls,
        pensionConfig.returnRate,
        requestedPclsDrawdown / 12
      )
      const actualPclsDrawdown = pclsResult.totalDrawdown

      // Calculate SIPP year
      const sippResult = calculateMonthlyInterestWithDrawdown(
        currentSipp,
        pensionConfig.returnRate,
        requestedSippDrawdown / 12
      )
      const actualSippDrawdown = sippResult.totalDrawdown

      // Calculate tax on SIPP drawdown (PCLS is tax-free)
      const taxResult = calculateTax(actualSippDrawdown, taxConfig)
      const annualTax = taxResult.totalTax
      const monthlyTax = annualTax / 12

      // Net income = PCLS (tax-free) + SIPP - tax
      const annualNetIncome = actualPclsDrawdown + actualSippDrawdown - annualTax
      const monthlyNetIncome = annualNetIncome / 12

      currentPcls = pclsResult.endBalance
      currentSipp = sippResult.endBalance

      totalPclsDrawn += actualPclsDrawdown
      totalSippDrawn += actualSippDrawdown
      totalTaxPaid += annualTax
      totalNetIncome += annualNetIncome

      const projection: YearProjection = {
        year,
        taxYear,
        pclsDrawdown: actualPclsDrawdown,
        sippDrawdown: actualSippDrawdown,
        monthlyTax,
        annualTax,
        monthlyNetIncome,
        annualNetIncome,
        pclsRemaining: currentPcls,
        sippRemaining: currentSipp,
        pclsStartOfYear,
        sippStartOfYear,
      }

      projections.push(projection)

      chartData.push({
        year,
        taxYear,
        annualNetIncome,
        pclsRemaining: currentPcls,
        sippRemaining: currentSipp,
      })
    }

    const totals: DrawdownTotals = {
      initialPcls,
      initialSipp,
      pclsRemaining: currentPcls,
      sippRemaining: currentSipp,
      totalPclsDrawn,
      totalSippDrawn,
      totalTaxPaid,
      totalNetIncome,
    }

    return { projections, totals, chartData }
  }, [pensionConfig, taxConfig, drawdownInputs])
}
