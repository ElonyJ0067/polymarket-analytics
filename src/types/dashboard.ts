import type { LeaderboardCategory } from "@/lib/polymarket/leaderboard";

export type LeaderboardCategoryFilter = LeaderboardCategory;

export const CATEGORY_OPTIONS: {
  value: LeaderboardCategoryFilter;
  label: string;
}[] = [
  { value: "OVERALL", label: "Overall" },
  { value: "POLITICS", label: "Politics" },
  { value: "SPORTS", label: "Sports" },
  { value: "ESPORTS", label: "E-Sports" },
  { value: "CRYPTO", label: "Crypto" },
  { value: "CULTURE", label: "Culture" },
  { value: "MENTIONS", label: "Mentions" },
  { value: "WEATHER", label: "Weather" },
  { value: "ECONOMICS", label: "Economics" },
  { value: "TECH", label: "Tech" },
  { value: "FINANCE", label: "Finance" },
];

export function getCategoryLabel(category: LeaderboardCategoryFilter): string {
  return (
    CATEGORY_OPTIONS.find((option) => option.value === category)?.label ??
    category
  );
}

export interface Wallet {
  id: string;
  rank: number;
  username: string;
  address: string;
  pnl: number;
  volume?: number;
  dayPlusPercent?: number;
  qualPercent?: number;
  sum?: number;
  nonQual?: number;
  fit?: boolean;
  analyzed?: boolean;
}

export interface DailyPnL {
  day: number;
  pnl: number;
  volume: number;
}

export interface MarketActivity {
  id: string;
  question: string;
  date: string;
  term: string;
  buyAmount: number;
  activityCount: number;
}

export interface OpenPosition {
  id: string;
  conditionId: string;
  title: string;
  outcome: string;
  size: number;
  avgPrice: number;
  curPrice: number;
  currentValue: number;
  cashPnl: number;
  percentPnl: number;
  endDate?: string;
  slug?: string;
}

export interface WalletActivity {
  address: string;
  dailyPnL: DailyPnL[];
  totalPnL14d: number;
  totalPnL: number;
  markets: MarketActivity[];
  positions: OpenPosition[];
}

export interface RankRange {
  minRank: string;
  maxRank: string;
}

export interface FilterState {
  search: string;
  minQualPercent: string;
  minDayPlusPercent: string;
  minPnl: string;
}

export interface AiEventResult {
  event: string;
  count: number;
  walletCount: number;
  frequency: string;
  insight: string;
}

export interface AiAnalysisResult {
  events: AiEventResult[];
  walletCount: number;
  positionCount: number;
  rankRange: { min: number | null; max: number | null };
  analyzedAt: string;
}
