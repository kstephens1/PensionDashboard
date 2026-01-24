import { useState } from 'react'
import type { PensionConfig, TaxConfig } from '@/types/pension'
import { CurrencyInput } from '@/components/common/CurrencyInput'
import { PercentageInput } from '@/components/common/PercentageInput'
import { formatCurrency, formatPercentage } from '@/utils/formatters'
import { calculatePclsSplit } from '@/constants/defaults'

interface ConfigPanelProps {
  pensionConfig: PensionConfig
  taxConfig: TaxConfig
  onPensionConfigChange: (config: Partial<PensionConfig>) => void
  onTaxConfigChange: (config: Partial<TaxConfig>) => void
  onReset: () => void
}

export function ConfigPanel({
  pensionConfig,
  taxConfig,
  onPensionConfigChange,
  onTaxConfigChange,
  onReset,
}: ConfigPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { pcls, sipp } = calculatePclsSplit(pensionConfig.dcPot, pensionConfig.pclsCap)

  return (
    <div className="bg-white rounded-lg shadow">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between text-left"
      >
        <div>
          <h2 className="text-xl font-semibold">Configuration</h2>
          <p className="text-sm text-gray-600 mt-1">
            DC Pot: {formatCurrency(pensionConfig.dcPot)} | Return: {formatPercentage(pensionConfig.returnRate)}
          </p>
        </div>
        <svg
          className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total DC Pot
              </label>
              <CurrencyInput
                value={pensionConfig.dcPot}
                onChange={(value) => onPensionConfigChange({ dcPot: value })}
                className="w-full"
              />
              <div className="mt-2 text-xs text-gray-500">
                <p>PCLS (25%): {formatCurrency(pcls)}</p>
                <p>SIPP (75%): {formatCurrency(sipp)}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Annual Return Rate
              </label>
              <PercentageInput
                value={pensionConfig.returnRate}
                onChange={(value) => onPensionConfigChange({ returnRate: value })}
                max={0.2}
                className="w-full"
              />
              <p className="mt-2 text-xs text-gray-500">
                Applied monthly with compound interest
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PCLS Cap
              </label>
              <CurrencyInput
                value={pensionConfig.pclsCap}
                onChange={(value) => onPensionConfigChange({ pclsCap: value })}
                className="w-full"
              />
              <p className="mt-2 text-xs text-gray-500">
                Maximum tax-free lump sum
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Personal Allowance
              </label>
              <CurrencyInput
                value={taxConfig.personalAllowance}
                onChange={(value) => onTaxConfigChange({ personalAllowance: value })}
                className="w-full"
              />
              <p className="mt-2 text-xs text-gray-500">
                Tax-free income threshold
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Tax Bands</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2 pr-4">Band</th>
                    <th className="py-2 pr-4">Min</th>
                    <th className="py-2 pr-4">Max</th>
                    <th className="py-2">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {taxConfig.bands.map((band, index) => (
                    <tr key={index} className="border-t">
                      <td className="py-2 pr-4 font-medium">{band.name}</td>
                      <td className="py-2 pr-4">{formatCurrency(band.min)}</td>
                      <td className="py-2 pr-4">
                        {band.max === Infinity ? 'No limit' : formatCurrency(band.max)}
                      </td>
                      <td className="py-2">{formatPercentage(band.rate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t flex justify-end">
            <button
              onClick={onReset}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
