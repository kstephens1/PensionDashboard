import { memo } from 'react'
import type { YearProjection, DrawdownInput } from '@/types/pension'
import { CurrencyInput } from '@/components/common/CurrencyInput'
import { formatCurrency } from '@/utils/formatters'
import { getAgeForYear } from '@/constants/defaults'

interface ColWidths {
  taxYear: string
  pclsDrawdown: string
  sippDrawdown: string
  yearlyDrawdown: string
  monthlyTax: string
  monthlyNet: string
  pclsRemaining: string
  sippRemaining: string
}

interface YearRowProps {
  projection: YearProjection
  input: DrawdownInput | undefined
  onDrawdownChange: (year: number, pclsDrawdown: number, sippDrawdown: number) => void
  colWidths: ColWidths
}

export const YearRow = memo(function YearRow({
  projection,
  input,
  onDrawdownChange,
  colWidths,
}: YearRowProps) {
  const {
    year,
    taxYear,
    pclsDrawdown,
    sippDrawdown,
    monthlyTax,
    monthlyNetIncome,
    pclsRemaining,
    sippRemaining,
    pclsStartOfYear,
    sippStartOfYear,
  } = projection

  const yearlyDrawdown = pclsDrawdown + sippDrawdown

  // Calculate max drawdown based on start of year balance + potential growth
  const maxPclsDrawdown = pclsStartOfYear * 1.1 // Allow for some growth
  const maxSippDrawdown = sippStartOfYear * 1.1

  const isPclsDepleted = pclsRemaining <= 0
  const isSippDepleted = sippRemaining <= 0

  const age = getAgeForYear(year)

  return (
    <div className="flex border-b hover:bg-gray-50">
      <div
        className={`${colWidths.taxYear} px-4 py-2 font-medium text-gray-900 whitespace-nowrap flex items-center cursor-help`}
        title={`Age ${age}`}
      >
        {taxYear}
      </div>
      <div className={`${colWidths.pclsDrawdown} px-4 py-2 flex items-center`}>
        <CurrencyInput
          value={input?.pclsDrawdown ?? 0}
          onChange={(value) =>
            onDrawdownChange(year, value, input?.sippDrawdown ?? 0)
          }
          max={maxPclsDrawdown}
          disabled={isPclsDepleted && (input?.pclsDrawdown ?? 0) === 0}
          className="w-28 text-sm"
          placeholder="£0"
        />
      </div>
      <div className={`${colWidths.sippDrawdown} px-4 py-2 flex items-center`}>
        <CurrencyInput
          value={input?.sippDrawdown ?? 0}
          onChange={(value) =>
            onDrawdownChange(year, input?.pclsDrawdown ?? 0, value)
          }
          max={maxSippDrawdown}
          disabled={isSippDepleted && (input?.sippDrawdown ?? 0) === 0}
          className="w-28 text-sm"
          placeholder="£0"
        />
      </div>
      <div className={`${colWidths.yearlyDrawdown} px-4 py-2 text-right font-medium text-gray-900 whitespace-nowrap flex items-center justify-end`}>
        {formatCurrency(yearlyDrawdown)}
      </div>
      <div className={`${colWidths.monthlyTax} px-4 py-2 text-right text-gray-600 whitespace-nowrap flex items-center justify-end`}>
        {formatCurrency(monthlyTax)}
      </div>
      <div className={`${colWidths.monthlyNet} px-4 py-2 text-right font-medium text-green-700 whitespace-nowrap flex items-center justify-end`}>
        {formatCurrency(monthlyNetIncome)}
      </div>
      <div className={`${colWidths.pclsRemaining} px-4 py-2 text-right whitespace-nowrap flex items-center justify-end ${isPclsDepleted ? 'text-red-500' : 'text-blue-700'}`}>
        {formatCurrency(pclsRemaining)}
      </div>
      <div className={`${colWidths.sippRemaining} px-4 py-2 text-right whitespace-nowrap flex items-center justify-end ${isSippDepleted ? 'text-red-500' : 'text-orange-700'}`}>
        {formatCurrency(sippRemaining)}
      </div>
    </div>
  )
})
