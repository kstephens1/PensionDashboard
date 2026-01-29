import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PensionConfig, TaxConfig, DrawdownInput, OptimizerConfig } from '@/types/pension'
import {
  DEFAULT_PENSION_CONFIG,
  DEFAULT_TAX_CONFIG,
  DEFAULT_OPTIMIZER_CONFIG,
  DEFAULT_INFLATION_RATE,
  START_YEAR,
  TOTAL_YEARS,
  DEFAULT_PCLS_DRAWDOWN,
  DEFAULT_SIPP_DRAWDOWN,
} from '@/constants/defaults'

interface PensionState {
  pensionConfig: PensionConfig
  taxConfig: TaxConfig
  drawdownInputs: Map<number, DrawdownInput>
  biasPct: number
  optimizerConfig: OptimizerConfig
  showRealTerms: boolean
  inflationRate: number

  updatePensionConfig: (config: Partial<PensionConfig>) => void
  updateTaxConfig: (config: Partial<TaxConfig>) => void
  updateDrawdown: (year: number, pclsDrawdown: number, sippDrawdown: number) => void
  setBiasPct: (pct: number) => void
  updateOptimizerConfig: (config: Partial<OptimizerConfig>) => void
  applyDrawdownPlan: (plan: Map<number, { pcls: number; sipp: number }>) => void
  setShowRealTerms: (value: boolean) => void
  setInflationRate: (rate: number) => void
  resetStore: () => void
}

function createInitialDrawdownInputs(): Map<number, DrawdownInput> {
  const inputs = new Map<number, DrawdownInput>()
  for (let i = 0; i < TOTAL_YEARS; i++) {
    const year = START_YEAR + i
    const taxYear = `${year}/${(year + 1) % 100}`
    inputs.set(year, {
      year,
      taxYear,
      pclsDrawdown: DEFAULT_PCLS_DRAWDOWN,
      sippDrawdown: DEFAULT_SIPP_DRAWDOWN,
    })
  }
  return inputs
}

export const usePensionStore = create<PensionState>()(
  persist(
    (set) => ({
      pensionConfig: DEFAULT_PENSION_CONFIG,
      taxConfig: DEFAULT_TAX_CONFIG,
      drawdownInputs: createInitialDrawdownInputs(),
      biasPct: 20,
      optimizerConfig: DEFAULT_OPTIMIZER_CONFIG,
      showRealTerms: false,
      inflationRate: DEFAULT_INFLATION_RATE,

      updatePensionConfig: (config) =>
        set((state) => ({
          pensionConfig: { ...state.pensionConfig, ...config },
        })),

      updateTaxConfig: (config) =>
        set((state) => ({
          taxConfig: { ...state.taxConfig, ...config },
        })),

      updateDrawdown: (year, pclsDrawdown, sippDrawdown) =>
        set((state) => {
          const newInputs = new Map(state.drawdownInputs)
          const existing = newInputs.get(year)
          if (existing) {
            newInputs.set(year, {
              ...existing,
              pclsDrawdown,
              sippDrawdown,
            })
          }
          return { drawdownInputs: newInputs }
        }),

      setBiasPct: (pct) => set({ biasPct: pct }),

      updateOptimizerConfig: (config) =>
        set((state) => ({
          optimizerConfig: { ...state.optimizerConfig, ...config },
        })),

      applyDrawdownPlan: (plan) =>
        set((state) => {
          const newInputs = new Map(state.drawdownInputs)
          plan.forEach((values, year) => {
            const existing = newInputs.get(year)
            if (existing) {
              newInputs.set(year, {
                ...existing,
                pclsDrawdown: values.pcls,
                sippDrawdown: values.sipp,
              })
            }
          })
          return { drawdownInputs: newInputs }
        }),

      setShowRealTerms: (value) => set({ showRealTerms: value }),

      setInflationRate: (rate) => set({ inflationRate: rate }),

      resetStore: () =>
        set({
          pensionConfig: DEFAULT_PENSION_CONFIG,
          taxConfig: DEFAULT_TAX_CONFIG,
          drawdownInputs: createInitialDrawdownInputs(),
          biasPct: 20,
          optimizerConfig: DEFAULT_OPTIMIZER_CONFIG,
          showRealTerms: false,
          inflationRate: DEFAULT_INFLATION_RATE,
        }),
    }),
    {
      name: 'pension-dashboard-storage',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name)
          if (!str) return null
          const parsed = JSON.parse(str)
          // Convert drawdownInputs array back to Map
          if (parsed.state?.drawdownInputs) {
            parsed.state.drawdownInputs = new Map(parsed.state.drawdownInputs)
          }
          // Merge in defaults and remove deprecated PCLS fields
          if (parsed.state?.optimizerConfig) {
            const { pclsDepletionYear, pclsRemainder, ...rest } = parsed.state.optimizerConfig
            parsed.state.optimizerConfig = {
              ...DEFAULT_OPTIMIZER_CONFIG,
              ...rest,
            }
          }
          return parsed
        },
        setItem: (name, value) => {
          // Convert Map to array for JSON serialization
          const toStore = {
            ...value,
            state: {
              ...value.state,
              drawdownInputs: Array.from(value.state.drawdownInputs.entries()),
            },
          }
          localStorage.setItem(name, JSON.stringify(toStore))
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
)
