import { describe, it, expect } from 'vitest'
import { calculateBiasedDrawdownPlan } from './drawdownOptimizer'
import type { PensionConfig, OptimizerConfig } from '@/types/pension'
import { START_YEAR } from '@/constants/defaults'

const DEFAULT_PENSION_CONFIG: PensionConfig = {
  dcPot: 863000,
  returnRate: 0.04,
  pclsCap: 268275,
}

// PCLS is now automatically depleted to £0 by SIPP depletion year (tax-optimal)
const DEFAULT_OPTIMIZER_CONFIG: OptimizerConfig = {
  sippDepletionYear: 2056,
  sippRemainder: 100000,
}

describe('calculateBiasedDrawdownPlan', () => {
  describe('target-based SIPP depletion', () => {
    it('reaches target SIPP remainder within tolerance', () => {
      const result = calculateBiasedDrawdownPlan(
        DEFAULT_PENSION_CONFIG,
        20, // 20% bias
        DEFAULT_OPTIMIZER_CONFIG
      )

      // Should reach target within ±£5000 tolerance
      expect(result.projectedSippAtDepletion).toBeGreaterThan(95000)
      expect(result.projectedSippAtDepletion).toBeLessThan(105000)
    })

    it('boosted income equals base income multiplied by bias factor', () => {
      const result = calculateBiasedDrawdownPlan(
        DEFAULT_PENSION_CONFIG,
        20, // 20% bias
        DEFAULT_OPTIMIZER_CONFIG
      )

      expect(result.boostedIncome).toBeCloseTo(result.baseIncome * 1.2, -2) // within £100
    })

    it('plan covers years from START_YEAR to depletionYear', () => {
      const depletionYear = 2056
      const optimizerConfig: OptimizerConfig = {
        ...DEFAULT_OPTIMIZER_CONFIG,
        sippDepletionYear: depletionYear,
      }

      const result = calculateBiasedDrawdownPlan(
        DEFAULT_PENSION_CONFIG,
        20,
        optimizerConfig
      )

      const years = Array.from(result.plan.keys())
      expect(years[0]).toBe(START_YEAR)
      expect(years[years.length - 1]).toBe(depletionYear - 1)
      expect(years.length).toBe(depletionYear - START_YEAR)
    })

    it('different depletion years produce different plan lengths', () => {
      const config2050: OptimizerConfig = {
        ...DEFAULT_OPTIMIZER_CONFIG,
        sippDepletionYear: 2050,
      }

      const config2060: OptimizerConfig = {
        ...DEFAULT_OPTIMIZER_CONFIG,
        sippDepletionYear: 2060,
      }

      const result2050 = calculateBiasedDrawdownPlan(
        DEFAULT_PENSION_CONFIG,
        20,
        config2050
      )

      const result2060 = calculateBiasedDrawdownPlan(
        DEFAULT_PENSION_CONFIG,
        20,
        config2060
      )

      // Different depletion years produce different plan lengths
      expect(result2050.plan.size).toBe(2050 - START_YEAR)
      expect(result2060.plan.size).toBe(2060 - START_YEAR)
      expect(result2050.plan.size).toBeLessThan(result2060.plan.size)

      // Both should still hit target remainder
      expect(result2050.projectedSippAtDepletion).toBeGreaterThan(95000)
      expect(result2060.projectedSippAtDepletion).toBeGreaterThan(95000)
    })

    it('different remainder targets produce different withdrawal rates', () => {
      const configHighRemainder: OptimizerConfig = {
        ...DEFAULT_OPTIMIZER_CONFIG,
        sippRemainder: 200000,
      }

      const configLowRemainder: OptimizerConfig = {
        ...DEFAULT_OPTIMIZER_CONFIG,
        sippRemainder: 50000,
      }

      const resultHigh = calculateBiasedDrawdownPlan(
        DEFAULT_PENSION_CONFIG,
        20,
        configHighRemainder
      )

      const resultLow = calculateBiasedDrawdownPlan(
        DEFAULT_PENSION_CONFIG,
        20,
        configLowRemainder
      )

      // Higher remainder = lower withdrawals (keeping more in pot)
      expect(resultHigh.baseIncome).toBeLessThan(resultLow.baseIncome)
    })
  })

  describe('bias behavior', () => {
    it('zero bias results in equal income all years', () => {
      const result = calculateBiasedDrawdownPlan(
        DEFAULT_PENSION_CONFIG,
        0, // No bias
        DEFAULT_OPTIMIZER_CONFIG
      )

      expect(result.boostedIncome).toBe(result.baseIncome)
    })

    it('higher bias increases gap between boosted and base income', () => {
      const result20 = calculateBiasedDrawdownPlan(
        DEFAULT_PENSION_CONFIG,
        20,
        DEFAULT_OPTIMIZER_CONFIG
      )

      const result40 = calculateBiasedDrawdownPlan(
        DEFAULT_PENSION_CONFIG,
        40,
        DEFAULT_OPTIMIZER_CONFIG
      )

      const gap20 = result20.boostedIncome - result20.baseIncome
      const gap40 = result40.boostedIncome - result40.baseIncome

      expect(gap40).toBeGreaterThan(gap20)
    })
  })

  describe('income sanity checks', () => {
    it('produces reasonable annual income with default settings', () => {
      const result = calculateBiasedDrawdownPlan(
        DEFAULT_PENSION_CONFIG,
        20,
        DEFAULT_OPTIMIZER_CONFIG
      )

      // With £863k pot, 4% return, 25 years to 2056, £100k remainder
      // Income includes both DC withdrawals and DB pensions
      // Expect boosted income in reasonable range (accounts for DB pensions)
      expect(result.boostedIncome).toBeGreaterThan(40000)
      expect(result.boostedIncome).toBeLessThan(120000)

      // Base income should be lower (but also elevated by DB income target)
      expect(result.baseIncome).toBeGreaterThan(30000)
      expect(result.baseIncome).toBeLessThan(100000)
    })

    it('uses PCLS first before SIPP', () => {
      const result = calculateBiasedDrawdownPlan(
        DEFAULT_PENSION_CONFIG,
        20,
        DEFAULT_OPTIMIZER_CONFIG
      )

      // First year should draw from PCLS
      const firstYear = result.plan.get(START_YEAR)
      expect(firstYear).toBeDefined()
      expect(firstYear!.pcls).toBeGreaterThan(0)
    })
  })

  describe('automatic PCLS depletion (tax-optimal)', () => {
    it('automatically depletes PCLS to £0 by SIPP depletion year', () => {
      const result = calculateBiasedDrawdownPlan(
        DEFAULT_PENSION_CONFIG,
        20,
        DEFAULT_OPTIMIZER_CONFIG
      )

      // PCLS should be near £0 by SIPP depletion year (within £5000 tolerance)
      expect(result.projectedPclsAtDepletion).toBeLessThan(5000)
    })

    it('draws PCLS as fixed annual amount', () => {
      const result = calculateBiasedDrawdownPlan(
        DEFAULT_PENSION_CONFIG,
        20,
        DEFAULT_OPTIMIZER_CONFIG
      )

      // Should have a positive PCLS annual drawdown
      expect(result.pclsAnnualDrawdown).toBeGreaterThan(0)

      // Check first few years have consistent PCLS drawdown (within rounding)
      const years = Array.from(result.plan.entries())
      const pclsDrawdowns = years
        .slice(0, 5)
        .map(([, values]) => values.pcls)

      // All should be close to pclsAnnualDrawdown (within £100 for rounding)
      pclsDrawdowns.forEach((pcls) => {
        expect(Math.abs(pcls - result.pclsAnnualDrawdown)).toBeLessThan(100)
      })
    })

    it('PCLS is drawn as fixed amount independent of DB income', () => {
      // This verifies that PCLS drawdown is independent of DB income levels
      // The algorithm draws PCLS as a fixed amount, not based on dcNeeded
      const result = calculateBiasedDrawdownPlan(
        DEFAULT_PENSION_CONFIG,
        20,
        DEFAULT_OPTIMIZER_CONFIG
      )

      // Check that PCLS drawdown is consistent across years (fixed amount)
      // regardless of whether DB income varies
      const earlyYears = [2031, 2032, 2033, 2034, 2035]
      const pclsDrawdowns = earlyYears.map((year) => result.plan.get(year)!.pcls)

      // All should be close to the calculated annual drawdown (within rounding)
      const expectedDrawdown = result.pclsAnnualDrawdown
      pclsDrawdowns.forEach((pcls) => {
        expect(Math.abs(pcls - expectedDrawdown)).toBeLessThan(200)
      })

      // Verify the annual PCLS drawdown is positive and reasonable
      expect(result.pclsAnnualDrawdown).toBeGreaterThan(5000)
      expect(result.pclsAnnualDrawdown).toBeLessThan(50000)
    })

    it('different SIPP depletion years produce different PCLS drawdown rates', () => {
      const configEarly: OptimizerConfig = {
        sippDepletionYear: 2046, // 15 years - PCLS also depletes by this year
        sippRemainder: 100000,
      }

      const configLate: OptimizerConfig = {
        sippDepletionYear: 2061, // 30 years - PCLS also depletes by this year
        sippRemainder: 100000,
      }

      const resultEarly = calculateBiasedDrawdownPlan(
        DEFAULT_PENSION_CONFIG,
        20,
        configEarly
      )

      const resultLate = calculateBiasedDrawdownPlan(
        DEFAULT_PENSION_CONFIG,
        20,
        configLate
      )

      // Earlier depletion = higher annual PCLS drawdown (same pot over fewer years)
      expect(resultEarly.pclsAnnualDrawdown).toBeGreaterThan(resultLate.pclsAnnualDrawdown)

      // Both should deplete PCLS to near £0
      expect(resultEarly.projectedPclsAtDepletion).toBeLessThan(5000)
      expect(resultLate.projectedPclsAtDepletion).toBeLessThan(5000)
    })
  })
})
