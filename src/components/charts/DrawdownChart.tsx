import React from 'react'
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
    // Extract year from taxYear (e.g., "2031/32" -> 2031)
    const year = label ? parseInt(label.split('/')[0], 10) : null
    const age = year ? getAgeForYear(year) : null

    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border">
        <p className="font-semibold text-gray-900 mb-2">
          {label} {age !== null && <span className="text-gray-500 font-normal">(Age {age})</span>}
        </p>
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

export function DrawdownChart({ data }: DrawdownChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        No data available
      </div>
    )
  }

  // Build reference lines for pension milestones
  const milestoneLines: React.ReactElement[] = []
  pensionMilestones.forEach((milestones, year) => {
    const taxYear = formatTaxYear(year)
    const names = milestones.map(m => m.name.replace(' Pension', '').replace(' DB', '')).join(', ')
    const hasState = milestones.some(m => m.type === 'state')
    const color = hasState ? MILESTONE_COLORS.state : MILESTONE_COLORS.db

    milestoneLines.push(
      <ReferenceLine
        key={`milestone-${year}`}
        x={taxYear}
        stroke={color}
        strokeDasharray="5 5"
        strokeWidth={2}
        yAxisId="left"
        label={{
          value: names,
          position: 'top',
          fill: color,
          fontSize: 10,
          fontWeight: 500,
        }}
      />
    )
  })

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart
        data={data}
        margin={{
          top: 5,
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
