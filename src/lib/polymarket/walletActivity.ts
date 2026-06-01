import type {
  DailyPnL,
  MarketActivity,
  OpenPosition,
  WalletActivity,
} from "@/types/dashboard";
import {
  fetchActivityInRange,
  type ActivityRecord,
} from "@/lib/polymarket/analyze";

const LOOKBACK_DAYS = 14;
const POSITIONS_URL = "https://data-api.polymarket.com/positions";

export interface WalletActivityResult extends WalletActivity {
  activityCount: number;
  positionCount: number;
  lastFetch: string;
}

interface RawPosition {
  conditionId: string;
  title?: string;
  outcome?: string;
  size?: number;
  avgPrice?: number;
  curPrice?: number;
  currentValue?: number;
  cashPnl?: number;
  percentPnl?: number;
  endDate?: string;
  slug?: string;
  asset?: string;
}

function dayKey(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString().slice(0, 10);
}

function calendarDays(lookbackDays: number): string[] {
  const days: string[] = [];
  for (let i = lookbackDays - 1; i >= 0; i--) {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - i);
    days.push(date.toISOString().slice(0, 10));
  }
  return days;
}

function cashFlow(activity: ActivityRecord): number {
  if (
    activity.type === "REDEEM" ||
    activity.type === "REWARD" ||
    activity.type === "MAKER_REBATE" ||
    activity.type === "REFERRAL_REWARD"
  ) {
    return activity.usdcSize;
  }

  if (activity.type === "TRADE") {
    if (activity.side === "BUY") return -activity.usdcSize;
    if (activity.side === "SELL") return activity.usdcSize;
  }

  return 0;
}

function parseEventDate(
  title?: string,
  slug?: string,
  endDate?: string
): Date | null {
  const titleMatch = title?.match(/(\d{4}-\d{2}-\d{2})/);
  if (titleMatch) return new Date(`${titleMatch[1]}T12:00:00Z`);

  const slugMatch = slug?.match(/(\d{4}-\d{2}-\d{2})/);
  if (slugMatch) return new Date(`${slugMatch[1]}T12:00:00Z`);

  if (endDate) {
    const parsed = new Date(endDate);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

function isTermSportsMarket(title?: string, slug?: string): boolean {
  const normalizedTitle = title ?? "";
  const normalizedSlug = slug ?? "";

  if (/will .+ win on \d{4}-\d{2}-\d{2}/i.test(normalizedTitle)) return true;

  if (
    /^(nba|nfl|mlb|nhl|mls|wnba|ufc|fifwc|epl|ncaa|atp|wta)-/i.test(
      normalizedSlug
    )
  ) {
    return true;
  }

  return (
    / vs\.? /i.test(normalizedTitle) && /\d{4}-\d{2}-\d{2}/.test(normalizedSlug)
  );
}

function isEventWithinQualifyingWindow(eventDate: Date, now = new Date()): boolean {
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const eventDay = new Date(
    Date.UTC(
      eventDate.getUTCFullYear(),
      eventDate.getUTCMonth(),
      eventDate.getUTCDate()
    )
  );
  const diffDays =
    (eventDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= -7 && diffDays <= 1;
}

function buildDailyPnL(activities: ActivityRecord[]): DailyPnL[] {
  const days = calendarDays(LOOKBACK_DAYS);
  const byDay = new Map<string, { pnl: number; volume: number }>();

  for (const dateStr of days) {
    byDay.set(dateStr, { pnl: 0, volume: 0 });
  }

  for (const activity of activities) {
    const dateStr = dayKey(activity.timestamp);
    const entry = byDay.get(dateStr);
    if (!entry) continue;

    entry.pnl += cashFlow(activity);
    if (activity.type === "TRADE") {
      entry.volume += Math.abs(activity.usdcSize);
    }
  }

  return days.map((dateStr) => {
    const entry = byDay.get(dateStr)!;
    const day = new Date(`${dateStr}T12:00:00Z`).getUTCDate();
    return { day, pnl: entry.pnl, volume: entry.volume };
  });
}

function buildQualifyingMarkets(activities: ActivityRecord[]): MarketActivity[] {
  const weekCutoff = Math.floor(Date.now() / 1000) - 7 * 86400;
  const byMarket = new Map<
    string,
    {
      title?: string;
      slug?: string;
      buyAmount: number;
      activityCount: number;
      lastTradeTs: number;
    }
  >();

  for (const activity of activities) {
    if (!activity.conditionId) continue;

    const existing = byMarket.get(activity.conditionId) ?? {
      title: activity.title,
      slug: activity.slug,
      buyAmount: 0,
      activityCount: 0,
      lastTradeTs: 0,
    };

    existing.title = existing.title || activity.title;
    existing.slug = existing.slug || activity.slug;
    existing.activityCount += 1;
    existing.lastTradeTs = Math.max(existing.lastTradeTs, activity.timestamp);

    if (activity.type === "TRADE" && activity.side === "BUY") {
      existing.buyAmount += activity.usdcSize;
    }

    byMarket.set(activity.conditionId, existing);
  }

  const markets: MarketActivity[] = [];

  for (const [conditionId, market] of Array.from(byMarket.entries())) {
    if (market.lastTradeTs < weekCutoff) continue;
    if (!isTermSportsMarket(market.title, market.slug)) continue;
    if (market.buyAmount < 100 && market.activityCount < 1) continue;

    const eventDate = parseEventDate(market.title, market.slug);
    if (!eventDate || !isEventWithinQualifyingWindow(eventDate)) continue;

    markets.push({
      id: conditionId,
      question: market.title ?? "Unknown market",
      date: eventDate.toISOString().slice(0, 10),
      term: "Term",
      buyAmount: market.buyAmount,
      activityCount: market.activityCount,
    });
  }

  return markets.sort((a, b) => b.buyAmount - a.buyAmount);
}

export async function fetchOpenPositions(address: string): Promise<OpenPosition[]> {
  const all: RawPosition[] = [];
  let offset = 0;

  while (offset <= 10000) {
    const params = new URLSearchParams({
      user: address,
      limit: "500",
      offset: String(offset),
      sizeThreshold: "0",
    });

    const response = await fetch(`${POSITIONS_URL}?${params}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Positions request failed (${response.status})`);
    }

    const page = (await response.json()) as RawPosition[];
    if (!Array.isArray(page) || page.length === 0) break;

    all.push(...page);
    if (page.length < 500) break;
    offset += 500;
  }

  return all
    .map((position) => ({
      id: position.asset ?? position.conditionId,
      conditionId: position.conditionId,
      title: position.title ?? "Unknown market",
      outcome: position.outcome ?? "—",
      size: position.size ?? 0,
      avgPrice: position.avgPrice ?? 0,
      curPrice: position.curPrice ?? 0,
      currentValue: position.currentValue ?? 0,
      cashPnl: position.cashPnl ?? 0,
      percentPnl: position.percentPnl ?? 0,
      endDate: position.endDate,
      slug: position.slug,
    }))
    .sort((a, b) => Math.abs(b.currentValue) - Math.abs(a.currentValue));
}

export async function fetchWalletActivity(
  address: string
): Promise<WalletActivityResult> {
  const start = Math.floor(Date.now() / 1000) - LOOKBACK_DAYS * 86400;
  const [activities, positions] = await Promise.all([
    fetchActivityInRange(address, start),
    fetchOpenPositions(address),
  ]);
  const dailyPnL = buildDailyPnL(activities);
  const totalPnL14d = dailyPnL.reduce((sum, day) => sum + day.pnl, 0);
  const markets = buildQualifyingMarkets(activities);

  return {
    address,
    dailyPnL,
    totalPnL14d,
    totalPnL: totalPnL14d,
    markets,
    positions,
    activityCount: activities.length,
    positionCount: positions.length,
    lastFetch: new Date().toISOString(),
  };
}

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address.trim());
}
