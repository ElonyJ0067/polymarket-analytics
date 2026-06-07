# Polymarket Admin Dashboard

A Next.js dashboard for tracking top Polymarket traders, inspecting wallet activity, and running AI-powered analysis on shared open positions.

## Features

- **Leaderboard** — Fetch ranked traders by category (Sports, Politics, Crypto, and more) with daily PnL and volume.
- **Wallet activity** — View daily PnL, recent market activity, and open positions for any wallet address.
- **Wallet analysis** — Score wallets on trading consistency over a 14-day lookback (qualifying volume, positive days, fit metrics).
- **AI batch analysis** — Analyze open positions across a rank range and surface recurring markets/events with OpenAI-generated insights.

## Prerequisites

- Node.js 18+
- An [OpenAI API key](https://platform.openai.com/api-keys) (required only for AI batch analysis)

Leaderboard and wallet activity features use the public [Polymarket Data API](https://data-api.polymarket.com) and do not require authentication.

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` in the project root:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

3. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command        | Description              |
| -------------- | ------------------------ |
| `npm run dev`  | Start development server |
| `npm run build`| Production build         |
| `npm run start`| Run production server    |
| `npm run lint` | Run ESLint               |

## API Routes

| Route              | Method | Description                                      |
| ------------------ | ------ | ------------------------------------------------ |
| `/api/leaderboard` | GET    | Fetch leaderboard entries by category and period |
| `/api/activity`    | GET    | Fetch wallet activity, PnL, and open positions   |
| `/api/analyze`     | POST   | Analyze wallet trading consistency               |
| `/api/ai-analysis` | POST   | Run AI analysis on open positions (OpenAI)       |

## Project Structure

```
src/
├── app/                 # Next.js App Router pages and API routes
├── components/dashboard/# Dashboard UI (sidebar, activity panel, charts)
├── lib/
│   ├── polymarket/      # Polymarket API clients and analysis logic
│   └── openai/          # OpenAI position analysis
└── types/               # Shared TypeScript types
```

## Tech Stack

- [Next.js 14](https://nextjs.org) (App Router)
- [React 18](https://react.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com)
