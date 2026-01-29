import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { escapeCSVField, generateDrawdownCSV, getExportFilename } from './csvExporter'
import type { YearProjection } from '@/types/pension'

describe('escapeCSVField', () => {
  it('returns simple strings unchanged', () => {
    expect(escapeCSVField('hello')).toBe('hello')
    expect(escapeCSVField('12345')).toBe('12345')
  })

  it('wraps strings with commas in quotes', () => {
    expect(escapeCSVField('hello, world')).toBe('"hello, world"')
  })

  it('wraps strings with quotes in quotes and escapes inner quotes', () => {
    expect(escapeCSVField('say "hello"')).toBe('"say ""hello"""')
  })

  it('wraps strings with newlines in quotes', () => {
    expect(escapeCSVField('line1\nline2')).toBe('"line1\nline2"')
  })

  it('handles strings with multiple special characters', () => {
    expect(escapeCSVField('hello, "world"\ntest')).toBe('"hello, ""world""\ntest"')
  })

  it('handles empty strings', () => {
    expect(escapeCSVField('')).toBe('')
  })

  it('handles numbers converted to strings', () => {
    expect(escapeCSVField('1234.56')).toBe('1234.56')
  })
})

describe('generateDrawdownCSV', () => {
  const mockProjections: YearProjection[] = [
    {
      year: 2031,
      taxYear: '2031/32',
      pclsDrawdown: 10000,
      sippDrawdown: 20000,
      dbPensionIncome: [],
      totalDBIncome: 0,
      totalGrossIncome: 20000,
      monthlyTax: 100,
      annualTax: 1200,
      monthlyNetIncome: 2400,
      annualNetIncome: 28800,
      pclsRemaining: 258000,
      sippRemaining: 750000,
      pclsStartOfYear: 268000,
      sippStartOfYear: 770000,
    },
    {
      year: 2032,
      taxYear: '2032/33',
      pclsDrawdown: 15000,
      sippDrawdown: 25000,
      dbPensionIncome: [
        { pensionId: 'db1', name: 'DB Pension', grossIncome: 5000, isPartialYear: false },
      ],
      totalDBIncome: 5000,
      totalGrossIncome: 30000,
      monthlyTax: 200,
      annualTax: 2400,
      monthlyNetIncome: 3550,
      annualNetIncome: 42600,
      pclsRemaining: 243000,
      sippRemaining: 725000,
      pclsStartOfYear: 258000,
      sippStartOfYear: 750000,
    },
  ]

  it('generates CSV with correct headers', () => {
    const csv = generateDrawdownCSV(mockProjections)
    const lines = csv.split('\n')
    expect(lines[0]).toBe('Tax Year,PCLS Drawdown,SIPP Drawdown,DB/State Income,Annual Income (Gross),Annual Income (Net),Monthly Tax,Monthly Net,PCLS Remaining,SIPP Remaining')
  })

  it('generates correct data rows', () => {
    const csv = generateDrawdownCSV(mockProjections)
    const lines = csv.split('\n')

    // First data row (year 2031)
    expect(lines[1]).toBe('2031/32,10000.00,20000.00,0.00,30000.00,28800.00,100.00,2400.00,258000.00,750000.00')

    // Second data row (year 2032)
    expect(lines[2]).toBe('2032/33,15000.00,25000.00,5000.00,45000.00,42600.00,200.00,3550.00,243000.00,725000.00')
  })

  it('includes TOTALS row at the bottom', () => {
    const csv = generateDrawdownCSV(mockProjections)
    const lines = csv.split('\n')
    const totalsLine = lines[lines.length - 1]

    expect(totalsLine.startsWith('TOTALS,')).toBe(true)
    // Check totals: PCLS=25000, SIPP=45000, DB=5000, Gross=75000, Net=71400, Tax=3600
    expect(totalsLine).toContain('25000.00') // Total PCLS drawdown
    expect(totalsLine).toContain('45000.00') // Total SIPP drawdown
    expect(totalsLine).toContain('5000.00')  // Total DB income
  })

  it('handles empty projections array', () => {
    const csv = generateDrawdownCSV([])
    const lines = csv.split('\n')

    // Should have header and totals row
    expect(lines.length).toBe(2)
    expect(lines[0]).toContain('Tax Year')
    expect(lines[1]).toContain('TOTALS')
  })

  it('formats numbers with 2 decimal places', () => {
    const csv = generateDrawdownCSV(mockProjections)
    expect(csv).toContain('10000.00')
    expect(csv).toContain('258000.00')
  })
})

describe('getExportFilename', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('generates filename with current date', () => {
    vi.setSystemTime(new Date('2031-04-15'))
    expect(getExportFilename()).toBe('pension-drawdown-2031-04-15.csv')
  })

  it('pads month and day with zeros', () => {
    vi.setSystemTime(new Date('2031-01-05'))
    expect(getExportFilename()).toBe('pension-drawdown-2031-01-05.csv')
  })
})
