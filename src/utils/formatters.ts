export function formatCurrency(value: number): string {
  const formatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return formatter.format(value)
}

export function parseCurrency(value: string): number {
  if (!value) return 0
  const cleaned = value.replace(/[£,\s]/g, '')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

export function formatPercentage(value: number, decimals: number = 1): string {
  const percentage = value * 100
  const formatted = Number.isInteger(percentage)
    ? percentage.toString()
    : percentage.toFixed(decimals).replace(/\.?0+$/, '')
  return `${formatted}%`
}

export function parsePercentage(value: string): number {
  if (!value) return 0
  const cleaned = value.replace(/%/g, '').trim()
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed / 100
}

export function formatTaxYear(year: number): string {
  const nextYear = (year + 1) % 100
  const nextYearStr = nextYear.toString().padStart(2, '0')
  return `${year}/${nextYearStr}`
}

export function formatCompact(value: number): string {
  if (value >= 1000000) {
    return `£${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `£${(value / 1000).toFixed(0)}K`
  }
  return formatCurrency(value)
}
