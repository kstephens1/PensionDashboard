import { describe, it, expect } from 'vitest'
import { formatCurrency, formatPercentage, parseCurrency, parsePercentage, formatTaxYear } from './formatters'

describe('formatCurrency', () => {
  it('formats positive numbers with pound sign and commas', () => {
    expect(formatCurrency(1234567.89)).toBe('£1,234,567.89')
    expect(formatCurrency(1000)).toBe('£1,000.00')
    expect(formatCurrency(0)).toBe('£0.00')
  })

  it('handles negative numbers', () => {
    expect(formatCurrency(-1000)).toBe('-£1,000.00')
  })

  it('rounds to 2 decimal places', () => {
    expect(formatCurrency(1234.567)).toBe('£1,234.57')
  })
})

describe('parseCurrency', () => {
  it('parses currency strings to numbers', () => {
    expect(parseCurrency('£1,234.56')).toBe(1234.56)
    expect(parseCurrency('1234.56')).toBe(1234.56)
    expect(parseCurrency('£1,000')).toBe(1000)
  })

  it('returns 0 for invalid input', () => {
    expect(parseCurrency('')).toBe(0)
    expect(parseCurrency('abc')).toBe(0)
  })
})

describe('formatPercentage', () => {
  it('formats decimals as percentages', () => {
    expect(formatPercentage(0.04)).toBe('4%')
    expect(formatPercentage(0.125)).toBe('12.5%')
    expect(formatPercentage(1)).toBe('100%')
  })

  it('handles zero', () => {
    expect(formatPercentage(0)).toBe('0%')
  })
})

describe('parsePercentage', () => {
  it('parses percentage strings to decimals', () => {
    expect(parsePercentage('4%')).toBe(0.04)
    expect(parsePercentage('12.5%')).toBe(0.125)
    expect(parsePercentage('100')).toBe(1)
  })

  it('returns 0 for invalid input', () => {
    expect(parsePercentage('')).toBe(0)
  })
})

describe('formatTaxYear', () => {
  it('formats year as UK tax year', () => {
    expect(formatTaxYear(2031)).toBe('2031/32')
    expect(formatTaxYear(2099)).toBe('2099/00')
  })
})
