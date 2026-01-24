import { usePensionStore } from '@/store/pensionStore'
import { useDrawdownCalculations } from '@/hooks/useDrawdownCalculations'
import { ConfigPanel } from '@/components/settings/ConfigPanel'
import { PotSummary } from './PotSummary'
import { DrawdownTable } from './DrawdownTable'
import { DrawdownChart } from '@/components/charts/DrawdownChart'

export function Dashboard() {
  const { pensionConfig, taxConfig, drawdownInputs, updateDrawdown, updatePensionConfig, updateTaxConfig, resetStore } = usePensionStore()
  const { projections, totals, chartData } = useDrawdownCalculations()

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
          <DrawdownChart data={chartData} />
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Year-by-Year Drawdown</h2>
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
