import { useMemo } from 'react'
import { usePensionStore } from '@/store/pensionStore'
import type { YearProjection, ChartDataPoint } from '@/types/pension'
import { calculatePclsSplit, START_YEAR, TOTAL_YEARS, CURRENT_YEAR } from '@/constants/defaults'
import { calculateMonthlyInterestWithDrawdown } from '@/utils/compoundInterest'
import { calculateTax } from '@/utils/taxCalculator'
import { formatTaxYear } from '@/utils/formatters'
import { getAllDBIncomeForYear } from '@/utils/dbPensionCalculator'
import { adjustForInflation } from '@/utils/inflationAdjuster'

interface DrawdownTotals {
  initialPcls: number
  initialSipp: number
  pclsRemaining: number
  sippRemaining: number
  totalPclsDrawn: number
  totalSippDrawn: number
  totalDBIncome: number
  totalTaxPaid: number
  totalNetIncome: number
}

interface DrawdownCalculationsResult {
  projections: YearProjection[]
  totals: DrawdownTotals
  chartData: ChartDataPoint[]
}

export function useDrawdownCalculations(): DrawdownCalculationsResult {
  const { pensionConfig, taxConfig, drawdownInputs, showRealTerms, inflationRate } = usePensionStore()

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
    let totalDBIncome = 0
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

      // Get DB pension income for this tax year
      const { breakdown: dbPensionIncome, total: yearDBIncome } = getAllDBIncomeForYear(year)

      // Calculate total taxable income (SIPP + DB pensions)
      // PCLS is tax-free so excluded from tax calculation
      const totalGrossIncome = actualSippDrawdown + yearDBIncome
      const taxResult = calculateTax(totalGrossIncome, taxConfig)
      const annualTax = taxResult.totalTax
      const monthlyTax = annualTax / 12

      // Net income = PCLS (tax-free) + SIPP + DB income - tax
      const annualNetIncome = actualPclsDrawdown + actualSippDrawdown + yearDBIncome - annualTax
      const monthlyNetIncome = annualNetIncome / 12

      currentPcls = pclsResult.endBalance
      currentSipp = sippResult.endBalance

      totalPclsDrawn += actualPclsDrawdown
      totalSippDrawn += actualSippDrawdown
      totalDBIncome += yearDBIncome
      totalTaxPaid += annualTax
      totalNetIncome += annualNetIncome

      const projection: YearProjection = {
        year,
        taxYear,
        pclsDrawdown: actualPclsDrawdown,
        sippDrawdown: actualSippDrawdown,
        dbPensionIncome,
        totalDBIncome: yearDBIncome,
        totalGrossIncome,
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

      // Gross income = PCLS + SIPP + DB (before tax)
      const annualGrossIncome = actualPclsDrawdown + actualSippDrawdown + yearDBIncome

      // Apply inflation adjustment if showRealTerms is enabled
      const adjust = (value: number) =>
        showRealTerms ? adjustForInflation(value, year, CURRENT_YEAR, inflationRate) : value

      chartData.push({
        year,
        taxYear,
        annualGrossIncome: adjust(annualGrossIncome),
        annualNetIncome: adjust(annualNetIncome),
        totalDBIncome: adjust(yearDBIncome),
        pclsRemaining: adjust(currentPcls),
        sippRemaining: adjust(currentSipp),
        pclsDrawdownAmount: adjust(actualPclsDrawdown),
        sippDrawdownAmount: adjust(actualSippDrawdown),
        dbPensionIncome: dbPensionIncome.map(pension => ({
          ...pension,
          grossIncome: adjust(pension.grossIncome),
        })),
      })
    }

    const totals: DrawdownTotals = {
      initialPcls,
      initialSipp,
      pclsRemaining: currentPcls,
      sippRemaining: currentSipp,
      totalPclsDrawn,
      totalSippDrawn,
      totalDBIncome,
      totalTaxPaid,
      totalNetIncome,
    }

    return { projections, totals, chartData }
  }, [pensionConfig, taxConfig, drawdownInputs, showRealTerms, inflationRate])
}
