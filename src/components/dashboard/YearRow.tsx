import { memo, useState } from 'react'
import type { YearProjection, DrawdownInput } from '@/types/pension'
import { CurrencyInput } from '@/components/common/CurrencyInput'
import { formatCurrency } from '@/utils/formatters'
import { getAgeForYear } from '@/constants/defaults'

interface ColWidths {
  taxYear: string
  pclsDrawdown: string
  sippDrawdown: string
  dbIncome: string
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
    dbPensionIncome,
    totalDBIncome,
    monthlyTax,
    monthlyNetIncome,
    pclsRemaining,
    sippRemaining,
    pclsStartOfYear,
    sippStartOfYear,
  } = projection

  const totalIncome = pclsDrawdown + sippDrawdown + totalDBIncome
  const [isDBHovered, setIsDBHovered] = useState(false)

  // Calculate max drawdown based on start of year balance + potential growth
  const maxPclsDrawdown = pclsStartOfYear * 1.1 // Allow for some growth
  const maxSippDrawdown = sippStartOfYear * 1.1

  const isPclsDepleted = pclsRemaining <= 0
  const isSippDepleted = sippRemaining <= 0

  const age = getAgeForYear(year)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className="flex border-b hover:bg-gray-50">
      <div
        className={`${colWidths.taxYear} px-4 py-2 font-medium text-gray-900 whitespace-nowrap flex items-center gap-2`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {taxYear}
        {isHovered && (
          <span className="px-1.5 py-0.5 bg-gray-700 text-white text-xs rounded">
            Age {age}
          </span>
        )}
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
      <div
        className={`${colWidths.dbIncome} px-4 py-2 text-right whitespace-nowrap flex items-center justify-end relative ${totalDBIncome > 0 ? 'text-purple-700 font-medium' : 'text-gray-400'}`}
        onMouseEnter={() => setIsDBHovered(true)}
        onMouseLeave={() => setIsDBHovered(false)}
      >
        {formatCurrency(totalDBIncome)}
        {isDBHovered && dbPensionIncome.length > 0 && (
          <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-3 py-2 bg-gray-800 text-white text-xs rounded shadow-lg whitespace-nowrap">
            {dbPensionIncome.map((p) => (
              <div key={p.pensionId} className="flex justify-between gap-4">
                <span>{p.name.replace(' Pension', '')}:</span>
                <span>{formatCurrency(p.grossIncome)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className={`${colWidths.yearlyDrawdown} px-4 py-2 text-right font-medium text-gray-900 whitespace-nowrap flex items-center justify-end`}>
        {formatCurrency(totalIncome)}
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
