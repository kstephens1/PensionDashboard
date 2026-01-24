# UK Pension Drawdown Dashboard

A React application for planning and visualising UK pension drawdown strategies, including PCLS (Pension Commencement Lump Sum) and SIPP (Self-Invested Personal Pension) withdrawals with UK tax calculations.

## Features

- **40-Year Projection**: Plan drawdowns from April 2031 to April 2071
- **PCLS & SIPP Tracking**: Manage tax-free lump sum and taxable pension withdrawals separately
- **UK Tax Calculations**: Accurate income tax with personal allowance tapering above £100k
- **Compound Growth**: Model investment returns on remaining pension pots
- **Interactive Charts**: Visualise income and remaining balances over time
- **Year-by-Year Control**: Customise drawdown amounts for each tax year
- **Configurable Settings**: Adjust DC pot size, return rates, PCLS cap, and tax bands

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **State Management**: Zustand
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod validation
- **Build**: Vite
- **Testing**: Vitest (unit), Playwright (E2E)

## Getting Started

### Prerequisites

- Node.js 20+ (recommended: 25.x)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/kstephens1/PensionDashboard.git
cd PensionDashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run unit tests |
| `npm run test:watch` | Run unit tests in watch mode |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── components/
│   ├── charts/         # Recharts visualisations
│   ├── common/         # Reusable input components
│   ├── dashboard/      # Main dashboard components
│   └── settings/       # Configuration panel
├── hooks/              # Custom React hooks
├── store/              # Zustand state management
├── types/              # TypeScript type definitions
└── utils/              # Tax calculations, formatters
```

## How It Works

1. **Configure** your DC pension pot size, expected return rate, and PCLS cap
2. **View** the default drawdown strategy across 40 years
3. **Adjust** individual year withdrawals as needed
4. **Monitor** tax implications and remaining balances via charts and tables

The dashboard calculates UK income tax using current bands and automatically tapers the personal allowance for incomes exceeding £100,000.

## License

MIT
