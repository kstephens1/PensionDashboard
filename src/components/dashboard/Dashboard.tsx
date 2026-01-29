import { usePensionStore } from '@/store/pensionStore'
import { useDrawdownCalculations } from '@/hooks/useDrawdownCalculations'
import { ConfigPanel } from '@/components/settings/ConfigPanel'
import { PotSummary } from './PotSummary'
import { DrawdownTable } from './DrawdownTable'
import { DrawdownChart } from '@/components/charts/DrawdownChart'
import { ToggleSwitch } from '@/components/common/ToggleSwitch'
import { generateDrawdownCSV, downloadCSV, getExportFilename } from '@/utils/csvExporter'

export function Dashboard() {
  const { pensionConfig, taxConfig, drawdownInputs, updateDrawdown, updatePensionConfig, updateTaxConfig, resetStore, showRealTerms, setShowRealTerms } = usePensionStore()
  const { projections, totals, chartData } = useDrawdownCalculations()

  const handleExportCSV = () => {
    const csv = generateDrawdownCSV(projections)
    downloadCSV(csv, getExportFilename())
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">UK Pension Drawdown Dashboard</h1>
        <p className="text-gray-600 mt-2">Plan your PCLS and SIPP drawdown from April 2031 to April 2071</p>
      </header>

      <div className="space-y-6">
        <ConfigPanel
          pensionConfig={pensionConfig}
          taxConfig={taxConfig}
          onPensionConfigChange={updatePensionConfig}
          onTaxConfigChange={updateTaxConfig}
          onReset={resetStore}
        />

        <PotSummary
          pclsRemaining={totals.pclsRemaining}
          sippRemaining={totals.sippRemaining}
          initialPcls={totals.initialPcls}
          initialSipp={totals.initialSipp}
        />

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Projection Overview</h2>
          <DrawdownChart data={chartData} showRealTerms={showRealTerms} />
          <div className="mt-4 flex items-center justify-end">
            <ToggleSwitch
              checked={showRealTerms}
              onChange={setShowRealTerms}
              label="Show in today's money"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-xl font-semibold">Year-by-Year Drawdown</h2>
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          </div>
          <DrawdownTable
            projections={projections}
            drawdownInputs={drawdownInputs}
            onDrawdownChange={updateDrawdown}
          />
        </div>
      </div>
    </div>
  )
}
