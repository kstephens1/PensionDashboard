import { formatCurrency } from '@/utils/formatters'

interface PotSummaryProps {
  pclsRemaining: number
  sippRemaining: number
  initialPcls: number
  initialSipp: number
}

export function PotSummary({
  pclsRemaining,
  sippRemaining,
  initialPcls,
  initialSipp,
}: PotSummaryProps) {
  const pclsPercentage = initialPcls > 0 ? (pclsRemaining / initialPcls) * 100 : 0
  const sippPercentage = initialSipp > 0 ? (sippRemaining / initialSipp) * 100 : 0
  const totalRemaining = pclsRemaining + sippRemaining
  const totalInitial = initialPcls + initialSipp
  const totalPercentage = totalInitial > 0 ? (totalRemaining / totalInitial) * 100 : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-blue-700">PCLS Remaining</span>
          <span className="text-xs text-blue-500">{pclsPercentage.toFixed(1)}%</span>
        </div>
        <p className="text-2xl font-bold text-blue-900 mt-1">
          {formatCurrency(pclsRemaining)}
        </p>
        <div className="mt-2 bg-blue-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, pclsPercentage)}%` }}
          />
        </div>
        <p className="text-xs text-blue-600 mt-1">
          of {formatCurrency(initialPcls)} initial
        </p>
      </div>

      <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-orange-700">SIPP Remaining</span>
          <span className="text-xs text-orange-500">{sippPercentage.toFixed(1)}%</span>
        </div>
        <p className="text-2xl font-bold text-orange-900 mt-1">
          {formatCurrency(sippRemaining)}
        </p>
        <div className="mt-2 bg-orange-200 rounded-full h-2">
          <div
            className="bg-orange-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, sippPercentage)}%` }}
          />
        </div>
        <p className="text-xs text-orange-600 mt-1">
          of {formatCurrency(initialSipp)} initial
        </p>
      </div>

      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-green-700">Total Remaining</span>
          <span className="text-xs text-green-500">{totalPercentage.toFixed(1)}%</span>
        </div>
        <p className="text-2xl font-bold text-green-900 mt-1">
          {formatCurrency(totalRemaining)}
        </p>
        <div className="mt-2 bg-green-200 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, totalPercentage)}%` }}
          />
        </div>
        <p className="text-xs text-green-600 mt-1">
          of {formatCurrency(totalInitial)} initial
        </p>
      </div>
    </div>
  )
}
