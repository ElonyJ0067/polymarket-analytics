export type LeaderboardCategory =
  | "OVERALL"
  | "POLITICS"
  | "SPORTS"
  | "ESPORTS"
  | "CRYPTO"
  | "CULTURE"
  | "MENTIONS"
  | "WEATHER"
  | "ECONOMICS"
  | "TECH"
  | "FINANCE";

export type LeaderboardTimePeriod = "DAY" | "WEEK" | "MONTH" | "ALL";

export interface LeaderboardEntry {
  rank: string;
  proxyWallet: string;
  userName: string;
  vol: number;
  pnl: number;
  profileImage?: string;
  xUsername?: string;
  verifiedBadge?: boolean;
}

export interface FetchLeaderboardOptions {
  category?: LeaderboardCategory;
  timePeriod?: LeaderboardTimePeriod;
  orderBy?: "PNL" | "VOL";
}

const LEADERBOARD_URL = "https://data-api.polymarket.com/v1/leaderboard";
const PAGE_SIZE = 50;
const MAX_OFFSET = 1000;

async function fetchLeaderboardPage(
  options: FetchLeaderboardOptions & { limit: number; offset: number }
): Promise<LeaderboardEntry[]> {
  const params = new URLSearchParams({
    category: options.category ?? "SPORTS",
    timePeriod: options.timePeriod ?? "DAY",
    orderBy: options.orderBy ?? "PNL",
    limit: String(options.limit),
    offset: String(options.offset),
  });

  const response = await fetch(`${LEADERBOARD_URL}?${params}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Leaderboard request failed (${response.status})`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Unexpected leaderboard response");
  }

  return data as LeaderboardEntry[];
}

export async function fetchAllLeaderboard(
  options: FetchLeaderboardOptions = {}
): Promise<LeaderboardEntry[]> {
  const all: LeaderboardEntry[] = [];
  let offset = 0;

  while (offset <= MAX_OFFSET) {
    const page = await fetchLeaderboardPage({
      ...options,
      limit: PAGE_SIZE,
      offset,
    });

    if (page.length === 0) break;

    all.push(...page);

    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return all.sort((a, b) => b.pnl - a.pnl);
}
