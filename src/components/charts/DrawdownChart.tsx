import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { ChartDataPoint } from '@/types/pension'
import { formatCurrency, formatCompact } from '@/utils/formatters'

interface DrawdownChartProps {
  data: ChartDataPoint[]
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    color: string
  }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function DrawdownChart({ data }: DrawdownChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        No data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 60,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="taxYear"
          tick={{ fontSize: 11 }}
          interval="preserveStartEnd"
          tickFormatter={(value) => value.split('/')[0]}
        />
        {/* Left Y-axis for pot balances */}
        <YAxis
          yAxisId="left"
          tickFormatter={(value) => formatCompact(value)}
          tick={{ fontSize: 11 }}
        />
        {/* Right Y-axis for Annual Net Income with scale £20k - £100k */}
        <YAxis
          yAxisId="right"
          orientation="right"
          domain={[20000, 100000]}
          tickFormatter={(value) => formatCompact(value)}
          tick={{ fontSize: 11, fill: '#16a34a' }}
          stroke="#16a34a"
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line
          type="monotone"
          dataKey="annualNetIncome"
          name="Annual Net Income"
          stroke="#16a34a"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6 }}
          yAxisId="right"
        />
        <Line
          type="monotone"
          dataKey="pclsRemaining"
          name="PCLS Remaining"
          stroke="#2563eb"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6 }}
          yAxisId="left"
        />
        <Line
          type="monotone"
          dataKey="sippRemaining"
          name="SIPP Remaining"
          stroke="#ea580c"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6 }}
          yAxisId="left"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
