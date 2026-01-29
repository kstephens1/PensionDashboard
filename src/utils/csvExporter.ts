import type { YearProjection } from '@/types/pension'

/**
 * Escapes a field value for CSV format.
 * Wraps in quotes if contains comma, quote, or newline.
 * Doubles any embedded quotes.
 */
export function escapeCSVField(value: string): string {
  if (value === '') return ''

  const needsQuotes = value.includes(',') || value.includes('"') || value.includes('\n')

  if (needsQuotes) {
    const escaped = value.replace(/"/g, '""')
    return `"${escaped}"`
  }

  return value
}

/**
 * Formats a number to 2 decimal places for CSV output.
 */
function formatNumber(value: number): string {
  return value.toFixed(2)
}

/**
 * Generates CSV content from projection data.
 * Includes headers, all year rows, and a totals row.
 */
export function generateDrawdownCSV(projections: YearProjection[]): string {
  const headers = [
    'Tax Year',
    'PCLS Drawdown',
    'SIPP Drawdown',
    'DB/State Income',
    'Annual Income (Gross)',
    'Annual Income (Net)',
    'Monthly Tax',
    'Monthly Net',
    'PCLS Remaining',
    'SIPP Remaining',
  ]

  const rows: string[] = []

  // Header row
  rows.push(headers.join(','))

  // Running totals
  let totalPclsDrawdown = 0
  let totalSippDrawdown = 0
  let totalDBIncome = 0
  let totalGrossIncome = 0
  let totalNetIncome = 0
  let totalMonthlyTax = 0

  // Data rows
  for (const projection of projections) {
    // Calculate gross income (PCLS + SIPP + DB)
    const annualGrossIncome = projection.pclsDrawdown + projection.sippDrawdown + projection.totalDBIncome

    totalPclsDrawdown += projection.pclsDrawdown
    totalSippDrawdown += projection.sippDrawdown
    totalDBIncome += projection.totalDBIncome
    totalGrossIncome += annualGrossIncome
    totalNetIncome += projection.annualNetIncome
    totalMonthlyTax += projection.monthlyTax

    const row = [
      escapeCSVField(projection.taxYear),
      formatNumber(projection.pclsDrawdown),
      formatNumber(projection.sippDrawdown),
      formatNumber(projection.totalDBIncome),
      formatNumber(annualGrossIncome),
      formatNumber(projection.annualNetIncome),
      formatNumber(projection.monthlyTax),
      formatNumber(projection.monthlyNetIncome),
      formatNumber(projection.pclsRemaining),
      formatNumber(projection.sippRemaining),
    ]

    rows.push(row.join(','))
  }

  // Totals row
  const lastProjection = projections[projections.length - 1]
  const totalsRow = [
    'TOTALS',
    formatNumber(totalPclsDrawdown),
    formatNumber(totalSippDrawdown),
    formatNumber(totalDBIncome),
    formatNumber(totalGrossIncome),
    formatNumber(totalNetIncome),
    formatNumber(totalMonthlyTax),
    '', // Monthly Net doesn't make sense as a total
    formatNumber(lastProjection?.pclsRemaining ?? 0),
    formatNumber(lastProjection?.sippRemaining ?? 0),
  ]

  rows.push(totalsRow.join(','))

  return rows.join('\n')
}

/**
 * Triggers a browser download of CSV content.
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * Generates a timestamped filename for the CSV export.
 */
export function getExportFilename(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `pension-drawdown-${year}-${month}-${day}.csv`
}
