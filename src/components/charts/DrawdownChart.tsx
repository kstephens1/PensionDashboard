import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { ChartDataPoint } from '@/types/pension'
import { formatCurrency, formatCompact, formatTaxYear } from '@/utils/formatters'
import { getAgeForYear } from '@/constants/defaults'
import { getGroupedPensionMilestones } from '@/constants/dbPensions'
import { usePensionStore } from '@/store/pensionStore'

interface DrawdownChartProps {
  data: ChartDataPoint[]
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    color: string
    dataKey: string
    payload: ChartDataPoint
  }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    // Extract year from taxYear (e.g., "2031/32" -> 2031)
    const year = label ? parseInt(label.split('/')[0], 10) : null
    const age = year ? getAgeForYear(year) : null

    // Get full data point from first payload entry
    const dataPoint = payload[0]?.payload

    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border min-w-[200px]">
        <p className="font-semibold text-gray-900 mb-2">
          {label} {age !== null && <span className="text-gray-500 font-normal">(Age {age})</span>}
        </p>
        {payload.map((entry) => {
          // Check if this is the annual income line
          const isIncomeEntry = entry.dataKey === 'annualGrossIncome'

          return (
            <div key={entry.dataKey}>
              <p style={{ color: entry.color }} className={`text-sm ${isIncomeEntry ? 'font-semibold' : ''}`}>
                {entry.name}: {formatCurrency(entry.value)}
              </p>
              {/* Show breakdown for income line */}
              {isIncomeEntry && dataPoint && (
                <div className="ml-2 pl-2 border-l-2 border-gray-200 mt-1 mb-2">
                  {dataPoint.pclsDrawdownAmount > 0 && (
                    <p className="text-xs text-blue-600">
                      PCLS: {formatCurrency(dataPoint.pclsDrawdownAmount)}
                    </p>
                  )}
                  {dataPoint.sippDrawdownAmount > 0 && (
                    <p className="text-xs text-orange-600">
                      SIPP: {formatCurrency(dataPoint.sippDrawdownAmount)}
                    </p>
                  )}
                  {dataPoint.dbPensionIncome.map((pension) => (
                    pension.grossIncome > 0 && (
                      <p key={pension.pensionId} className="text-xs text-purple-600">
                        {pension.name}: {formatCurrency(pension.grossIncome)}
                        {pension.isPartialYear && ' (partial)'}
                      </p>
                    )
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }
  return null
}

interface CustomXAxisTickProps {
  x?: number
  y?: number
  payload?: { value: string }
}

function CustomXAxisTick({ x, y, payload }: CustomXAxisTickProps) {
  if (!payload) return null

  const yearStr = payload.value.split('/')[0]
  const year = parseInt(yearStr, 10)
  const age = getAgeForYear(year)

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={12} textAnchor="middle" fill="#666" fontSize={11}>
        {yearStr}
      </text>
      <text x={0} y={0} dy={24} textAnchor="middle" fill="#9ca3af" fontSize={9}>
        ({age})
      </text>
    </g>
  )
}

// Get pension milestones for reference lines
const pensionMilestones = getGroupedPensionMilestones()

// Colors for milestone lines
const MILESTONE_COLORS = {
  db: '#7c3aed',      // Purple for DB pensions
  state: '#0891b2',   // Cyan for state pensions
}

// Custom label component with vertical offset support
interface CustomReferenceLabelProps {
  viewBox?: { x?: number; y?: number }
  value?: string
  fill?: string
  verticalOffset?: number
}

function CustomReferenceLabel({ viewBox, value, fill, verticalOffset = 0 }: CustomReferenceLabelProps) {
  const x = viewBox?.x ?? 0
  const y = (viewBox?.y ?? 0) - 5 - verticalOffset

  return (
    <text
      x={x}
      y={y}
      fill={fill}
      fontSize={10}
      fontWeight={500}
      textAnchor="middle"
    >
      {value}
    </text>
  )
}

export function DrawdownChart({ data }: DrawdownChartProps) {
  const { optimizerConfig } = usePensionStore()

  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        No data available
      </div>
    )
  }

  // Build all milestone data with years for sorting
  interface MilestoneData {
    year: number
    taxYear: string
    name: string
    color: string
    key: string
  }

  const allMilestones: MilestoneData[] = []

  // Add pension milestones
  pensionMilestones.forEach((milestones, year) => {
    const names = milestones.map(m => m.name.replace(' Pension', '').replace(' DB', '')).join(', ')
    const hasState = milestones.some(m => m.type === 'state')
    const color = hasState ? MILESTONE_COLORS.state : MILESTONE_COLORS.db

    allMilestones.push({
      year,
      taxYear: formatTaxYear(year),
      name: names,
      color,
      key: `milestone-${year}`,
    })
  })

  // Add SIPP depletion milestone
  allMilestones.push({
    year: optimizerConfig.sippDepletionYear,
    taxYear: formatTaxYear(optimizerConfig.sippDepletionYear),
    name: 'SIPP Depletes',
    color: '#ea580c',
    key: 'sipp-depletion',
  })

  // Sort by year to calculate offsets
  allMilestones.sort((a, b) => a.year - b.year)

  // Calculate vertical offsets to avoid label collisions
  // Labels within threshold years of each other get staggered alternately
  const YEAR_THRESHOLD = 6
  const LABEL_OFFSET = 14

  const milestoneOffsets: number[] = []
  allMilestones.forEach((m, idx) => {
    if (idx === 0) {
      milestoneOffsets.push(0)
      return
    }

    const prevYear = allMilestones[idx - 1].year
    const prevOffset = milestoneOffsets[idx - 1]

    if (m.year - prevYear < YEAR_THRESHOLD) {
      // Too close to previous - alternate the offset
      milestoneOffsets.push(prevOffset === 0 ? LABEL_OFFSET : 0)
    } else {
      // Far enough apart - reset to base level
      milestoneOffsets.push(0)
    }
  })

  // Build reference lines with calculated offsets
  const milestoneLines = allMilestones.map((m, idx) => (
    <ReferenceLine
      key={m.key}
      x={m.taxYear}
      stroke={m.color}
      strokeDasharray="5 5"
      strokeWidth={2}
      yAxisId="left"
      label={<CustomReferenceLabel value={m.name} fill={m.color} verticalOffset={milestoneOffsets[idx]} />}
    />
  ))

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart
        data={data}
        margin={{
          top: 35,
          right: 60,
          left: 20,
          bottom: 20,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="taxYear"
          tick={<CustomXAxisTick />}
          interval="preserveStartEnd"
        />
        {/* Left Y-axis for pot balances */}
        <YAxis
          yAxisId="left"
          tickFormatter={(value) => formatCompact(value)}
          tick={{ fontSize: 11 }}
        />
        {/* Right Y-axis for Annual Gross Income with scale £20k - £100k */}
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
        {milestoneLines}
        <Line
          type="monotone"
          dataKey="annualGrossIncome"
          name="Annual income (gross)"
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
