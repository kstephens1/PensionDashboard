import { useRef, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { YearProjection, DrawdownInput } from '@/types/pension'
import { YearRow } from './YearRow'
import { formatCurrency } from '@/utils/formatters'

interface DrawdownTableProps {
  projections: YearProjection[]
  drawdownInputs: Map<number, DrawdownInput>
  onDrawdownChange: (year: number, pclsDrawdown: number, sippDrawdown: number) => void
}

// Fixed column widths for alignment
const COL_WIDTHS = {
  taxYear: 'w-24',
  pclsDrawdown: 'w-36',
  sippDrawdown: 'w-36',
  yearlyDrawdown: 'w-32',
  monthlyTax: 'w-28',
  monthlyNet: 'w-28',
  pclsRemaining: 'w-32',
  sippRemaining: 'w-32',
}

export function DrawdownTable({
  projections,
  drawdownInputs,
  onDrawdownChange,
}: DrawdownTableProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: projections.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 5,
  })

  const handleDrawdownChange = useCallback(
    (year: number, pclsDrawdown: number, sippDrawdown: number) => {
      onDrawdownChange(year, pclsDrawdown, sippDrawdown)
    },
    [onDrawdownChange]
  )

  // Calculate totals
  const totals = projections.reduce(
    (acc, p) => ({
      pclsDrawdown: acc.pclsDrawdown + p.pclsDrawdown,
      sippDrawdown: acc.sippDrawdown + p.sippDrawdown,
      annualTax: acc.annualTax + p.annualTax,
      annualNetIncome: acc.annualNetIncome + p.annualNetIncome,
    }),
    { pclsDrawdown: 0, sippDrawdown: 0, annualTax: 0, annualNetIncome: 0 }
  )

  return (
    <div className="overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b">
        <div className="flex">
          <div className={`${COL_WIDTHS.taxYear} px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider`}>
            Tax Year
          </div>
          <div className={`${COL_WIDTHS.pclsDrawdown} px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider`}>
            PCLS Drawdown
          </div>
          <div className={`${COL_WIDTHS.sippDrawdown} px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider`}>
            SIPP Drawdown
          </div>
          <div className={`${COL_WIDTHS.yearlyDrawdown} px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider`}>
            Yearly Drawdown
          </div>
          <div className={`${COL_WIDTHS.monthlyTax} px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider`}>
            Monthly Tax
          </div>
          <div className={`${COL_WIDTHS.monthlyNet} px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider`}>
            Monthly Net
          </div>
          <div className={`${COL_WIDTHS.pclsRemaining} px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider`}>
            PCLS Remaining
          </div>
          <div className={`${COL_WIDTHS.sippRemaining} px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider`}>
            SIPP Remaining
          </div>
        </div>
      </div>

      {/* Virtualized Body */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: 'calc(100vh - 600px)', minHeight: '400px' }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const projection = projections[virtualRow.index]
            return (
              <div
                key={projection.year}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <YearRow
                  projection={projection}
                  input={drawdownInputs.get(projection.year)}
                  onDrawdownChange={handleDrawdownChange}
                  colWidths={COL_WIDTHS}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-100 border-t">
        <div className="flex font-semibold">
          <div className={`${COL_WIDTHS.taxYear} px-4 py-3 text-gray-900`}>
            Totals
          </div>
          <div className={`${COL_WIDTHS.pclsDrawdown} px-4 py-3 text-gray-900`}>
            {formatCurrency(totals.pclsDrawdown)}
          </div>
          <div className={`${COL_WIDTHS.sippDrawdown} px-4 py-3 text-gray-900`}>
            {formatCurrency(totals.sippDrawdown)}
          </div>
          <div className={`${COL_WIDTHS.yearlyDrawdown} px-4 py-3 text-right text-gray-900`}>
            {formatCurrency(totals.pclsDrawdown + totals.sippDrawdown)}
          </div>
          <div className={`${COL_WIDTHS.monthlyTax} px-4 py-3 text-right text-gray-900`}>
            {formatCurrency(totals.annualTax / 12)}
          </div>
          <div className={`${COL_WIDTHS.monthlyNet} px-4 py-3 text-right text-green-700`}>
            {formatCurrency(totals.annualNetIncome / 12)}
          </div>
          <div className={`${COL_WIDTHS.pclsRemaining} px-4 py-3 text-right text-blue-700`}>
            {formatCurrency(projections[projections.length - 1]?.pclsRemaining ?? 0)}
          </div>
          <div className={`${COL_WIDTHS.sippRemaining} px-4 py-3 text-right text-orange-700`}>
            {formatCurrency(projections[projections.length - 1]?.sippRemaining ?? 0)}
          </div>
        </div>
      </div>
    </div>
  )
}
