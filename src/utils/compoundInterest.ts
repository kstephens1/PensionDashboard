export interface YearResult {
  startBalance: number
  endBalance: number
  totalInterest: number
  totalDrawdown: number
  monthlyBreakdown: MonthlyResult[]
}

export interface MonthlyResult {
  month: number
  startBalance: number
  interest: number
  drawdown: number
  endBalance: number
}

export function calculateMonthlyInterestWithDrawdown(
  startBalance: number,
  annualRate: number,
  monthlyDrawdown: number
): YearResult {
  if (startBalance <= 0) {
    return {
      startBalance: 0,
      endBalance: 0,
      totalInterest: 0,
      totalDrawdown: 0,
      monthlyBreakdown: [],
    }
  }

  const monthlyRate = annualRate / 12
  let balance = startBalance
  let totalInterest = 0
  let totalDrawdown = 0
  const monthlyBreakdown: MonthlyResult[] = []

  for (let month = 1; month <= 12; month++) {
    const monthStart = balance

    // Apply interest first
    const interest = balance * monthlyRate
    balance += interest
    totalInterest += interest

    // Then apply drawdown (capped to available balance)
    const actualDrawdown = Math.min(monthlyDrawdown, balance)
    balance -= actualDrawdown
    totalDrawdown += actualDrawdown

    monthlyBreakdown.push({
      month,
      startBalance: monthStart,
      interest,
      drawdown: actualDrawdown,
      endBalance: balance,
    })

    if (balance <= 0) {
      balance = 0
      break
    }
  }

  return {
    startBalance,
    endBalance: Math.max(0, balance),
    totalInterest,
    totalDrawdown,
    monthlyBreakdown,
  }
}

export function calculateYearEndBalance(
  startBalance: number,
  annualRate: number,
  annualDrawdown: number
): YearResult {
  const monthlyDrawdown = annualDrawdown / 12
  return calculateMonthlyInterestWithDrawdown(startBalance, annualRate, monthlyDrawdown)
}

export function applyAnnualGrowth(balance: number, annualRate: number): number {
  return balance * (1 + annualRate)
}
