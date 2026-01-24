import { describe, it, expect } from 'vitest'
import { calculateTax, calculatePersonalAllowance, calculateNetIncome } from './taxCalculator'
import { DEFAULT_TAX_CONFIG } from '@/constants/defaults'

describe('calculatePersonalAllowance', () => {
  it('returns full allowance for income below £100,000', () => {
    expect(calculatePersonalAllowance(50000, 12570)).toBe(12570)
    expect(calculatePersonalAllowance(99999, 12570)).toBe(12570)
  })

  it('tapers allowance for income above £100,000', () => {
    // £1 reduction for every £2 over £100k
    expect(calculatePersonalAllowance(100000, 12570)).toBe(12570)
    expect(calculatePersonalAllowance(102000, 12570)).toBe(11570) // loses £1000
    expect(calculatePersonalAllowance(110000, 12570)).toBe(7570) // loses £5000
  })

  it('returns zero allowance when fully tapered', () => {
    // Fully tapered at £125,140 (£12,570 * 2 + £100,000)
    expect(calculatePersonalAllowance(125140, 12570)).toBe(0)
    expect(calculatePersonalAllowance(150000, 12570)).toBe(0)
  })
})

describe('calculateTax', () => {
  it('returns zero tax for income below personal allowance', () => {
    const result = calculateTax(12570, DEFAULT_TAX_CONFIG)
    expect(result.totalTax).toBe(0)
  })

  it('returns zero tax for zero income', () => {
    const result = calculateTax(0, DEFAULT_TAX_CONFIG)
    expect(result.totalTax).toBe(0)
  })

  it('calculates basic rate tax correctly', () => {
    // £20,000 income: £12,570 PA, £7,430 taxable at 20%
    const result = calculateTax(20000, DEFAULT_TAX_CONFIG)
    expect(result.totalTax).toBeCloseTo(1486, 0) // £7,430 * 0.20
  })

  it('calculates higher rate tax correctly', () => {
    // £60,000 income: £12,570 PA, taxable = £47,430
    // Basic: £37,700 at 20% = £7,540
    // Higher: £9,730 at 40% = £3,892
    // Total: £11,432
    const result = calculateTax(60000, DEFAULT_TAX_CONFIG)
    expect(result.totalTax).toBeCloseTo(11432, 0)
  })

  it('calculates additional rate tax correctly', () => {
    // £150,000 income: PA tapered to 0
    // Taxable = £150,000
    // Basic: £37,700 at 20% = £7,540
    // Higher: £74,870 (£125,140 - £50,270) at 40% = £29,948
    // Additional: £37,430 at 45% = £16,843.50
    // Total: £54,331.50
    const result = calculateTax(150000, DEFAULT_TAX_CONFIG)
    expect(result.totalTax).toBeCloseTo(54331.5, 0)
  })

  it('handles personal allowance taper in tax calculation', () => {
    // £110,000 income: PA = 12570 - ((110000-100000)/2) = 7570
    // Taxable = £102,430
    // Basic: £37,700 at 20% = £7,540
    // Higher: £64,730 at 40% = £25,892
    // Total: £33,432
    const result = calculateTax(110000, DEFAULT_TAX_CONFIG)
    expect(result.totalTax).toBeCloseTo(33432, 0)
  })

  it('returns breakdown by band', () => {
    const result = calculateTax(60000, DEFAULT_TAX_CONFIG)
    expect(result.breakdown).toHaveLength(2)
    expect(result.breakdown[0].band).toBe('Basic Rate')
    expect(result.breakdown[1].band).toBe('Higher Rate')
  })
})

describe('calculateNetIncome', () => {
  it('returns gross minus tax', () => {
    const gross = 50000
    const result = calculateTax(gross, DEFAULT_TAX_CONFIG)
    expect(calculateNetIncome(gross, result.totalTax)).toBe(gross - result.totalTax)
  })

  it('returns gross for zero tax', () => {
    expect(calculateNetIncome(10000, 0)).toBe(10000)
  })
})
