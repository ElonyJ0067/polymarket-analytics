export interface ActivityRecord {
  timestamp: number;
  conditionId: string;
  type: string;
  usdcSize: number;
  side?: string;
  title?: string;
  slug?: string;
  eventSlug?: string;
}

export interface PositionRecord {
  conditionId: string;
  title?: string;
  slug?: string;
  eventSlug?: string;
  endDate?: string;
  timestamp?: number;
  totalBought?: number;
  realizedPnl?: number;
}

export interface WalletAnalysis {
  address: string;
  dayPlusPercent: number;
  qualPercent: number;
  sum: number;
  nonQual: number;
  volume: number;
  pnl: number;
  fit: boolean;
  positiveDays: number;
  totalDays: number;
}

const ACTIVITY_URL = "https://data-api.polymarket.com/activity";
const CLOSED_POSITIONS_URL = "https://data-api.polymarket.com/closed-positions";
const PAGE_LIMIT = 500;
const LOOKBACK_DAYS = 14;
const QUALIFYING_WINDOW_DAYS = 7;
const MIN_MARKET_VOLUME = 100;

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

async function fetchActivityInRange(
  address: string,
  start: number
): Promise<ActivityRecord[]> {
  const all: ActivityRecord[] = [];
  let endCursor: number | null = null;

  while (all.length < 10000) {
    const params = new URLSearchParams({
      user: address,
      limit: String(PAGE_LIMIT),
      start: String(start),
      sortBy: "TIMESTAMP",
      sortDirection: "DESC",
    });

    if (endCursor !== null) {
      params.set("end", String(endCursor));
    }

    const response = await fetch(`${ACTIVITY_URL}?${params}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Activity request failed (${response.status})`);
    }

    const page = (await response.json()) as ActivityRecord[];
    if (!Array.isArray(page) || page.length === 0) break;

    all.push(...page);

    if (page.length < PAGE_LIMIT) break;
    endCursor = page[page.length - 1].timestamp - 1;
  }

  return all;
}

async function fetchClosedPositions(address: string): Promise<PositionRecord[]> {
  const all: PositionRecord[] = [];
  let offset = 0;

  while (offset <= 10000) {
    const params = new URLSearchParams({
      user: address,
      limit: "50",
      offset: String(offset),
    });

    const response = await fetch(`${CLOSED_POSITIONS_URL}?${params}`, {
      cache: "no-store",
    });
    if (!response.ok) break;

    const page = (await response.json()) as PositionRecord[];
    if (!Array.isArray(page) || page.length === 0) break;

    all.push(...page);
    if (page.length < 50) break;
    offset += 50;
  }

  return all;
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

  if (/will .+ win on \d{4}-\d{2}-\d{2}/i.test(normalizedTitle)) {
    return true;
  }

  if (
    /^(nba|nfl|mlb|nhl|mls|wnba|ufc|fifwc|epl|ncaa|atp|wta)-/i.test(
      normalizedSlug
    )
  ) {
    return true;
  }

  if (/ vs\.? /i.test(normalizedTitle) && /\d{4}-\d{2}-\d{2}/.test(normalizedSlug)) {
    return true;
  }

  return false;
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

  return diffDays >= -QUALIFYING_WINDOW_DAYS && diffDays <= 1;
}

interface MarketMeta {
  conditionId: string;
  title?: string;
  slug?: string;
  eventSlug?: string;
  endDate?: string;
  tradeVolume: number;
  lastTradeTs: number;
}

function buildMarketMap(
  activities: ActivityRecord[],
  closedPositions: PositionRecord[]
): Map<string, MarketMeta> {
  const markets = new Map<string, MarketMeta>();

  for (const activity of activities) {
    if (!activity.conditionId || activity.type !== "TRADE") continue;

    const existing = markets.get(activity.conditionId) ?? {
      conditionId: activity.conditionId,
      title: activity.title,
      slug: activity.slug,
      eventSlug: activity.eventSlug,
      tradeVolume: 0,
      lastTradeTs: 0,
    };

    existing.title = existing.title || activity.title;
    existing.slug = existing.slug || activity.slug;
    existing.eventSlug = existing.eventSlug || activity.eventSlug;
    existing.tradeVolume += Math.abs(activity.usdcSize);
    existing.lastTradeTs = Math.max(existing.lastTradeTs, activity.timestamp);
    markets.set(activity.conditionId, existing);
  }

  for (const position of closedPositions) {
    if (!position.conditionId) continue;

    const existing = markets.get(position.conditionId) ?? {
      conditionId: position.conditionId,
      title: position.title,
      slug: position.slug,
      eventSlug: position.eventSlug,
      endDate: position.endDate,
      tradeVolume: 0,
      lastTradeTs: position.timestamp ?? 0,
    };

    existing.title = existing.title || position.title;
    existing.slug = existing.slug || position.slug;
    existing.eventSlug = existing.eventSlug || position.eventSlug;
    existing.endDate = existing.endDate || position.endDate;
    existing.tradeVolume = Math.max(
      existing.tradeVolume,
      position.totalBought ?? 0
    );
    existing.lastTradeTs = Math.max(
      existing.lastTradeTs,
      position.timestamp ?? 0
    );
    markets.set(position.conditionId, existing);
  }

  return markets;
}

function isQualifyingMarket(market: MarketMeta, now = new Date()): boolean {
  if (market.tradeVolume < MIN_MARKET_VOLUME) return false;
  if (!isTermSportsMarket(market.title, market.slug)) return false;

  const eventDate = parseEventDate(
    market.title,
    market.slug,
    market.endDate
  );

  if (!eventDate) return false;
  return isEventWithinQualifyingWindow(eventDate, now);
}

export function analyzeActivity(
  address: string,
  activities: ActivityRecord[],
  closedPositions: PositionRecord[],
  leaderboardPnl: number,
  leaderboardVolume: number
): WalletAnalysis {
  const days = calendarDays(LOOKBACK_DAYS);
  const dailyPnL = new Map<string, number>();

  for (const day of days) {
    dailyPnL.set(day, 0);
  }

  for (const activity of activities) {
    const flow = cashFlow(activity);
    if (flow === 0) continue;

    const day = dayKey(activity.timestamp);
    if (!dailyPnL.has(day)) continue;
    dailyPnL.set(day, (dailyPnL.get(day) ?? 0) + flow);
  }

  const positiveDays = days.filter((day) => (dailyPnL.get(day) ?? 0) > 0).length;
  const dayPlusPercent = (positiveDays / LOOKBACK_DAYS) * 100;

  const markets = buildMarketMap(activities, closedPositions);
  let sum = 0;
  let nonQual = 0;

  for (const market of Array.from(markets.values())) {
    if (isQualifyingMarket(market)) {
      sum += 1;
    } else {
      nonQual += 1;
    }
  }

  const totalMarkets = sum + nonQual;
  const qualPercent = totalMarkets > 0 ? (sum / totalMarkets) * 100 : 0;

  const computedVolume = activities
    .filter((activity) => activity.type === "TRADE")
    .reduce((total, activity) => total + Math.abs(activity.usdcSize), 0);

  const volume = leaderboardVolume > 0 ? leaderboardVolume : computedVolume;
  const fit = dayPlusPercent >= 50 && qualPercent >= 40 && leaderboardPnl > 0;

  return {
    address,
    dayPlusPercent,
    qualPercent,
    sum,
    nonQual,
    volume,
    pnl: leaderboardPnl,
    fit,
    positiveDays,
    totalDays: LOOKBACK_DAYS,
  };
}

export async function analyzeWallet(
  address: string,
  leaderboardPnl: number,
  leaderboardVolume: number
): Promise<WalletAnalysis> {
  const start = Math.floor(Date.now() / 1000) - LOOKBACK_DAYS * 86400;
  const [activities, closedPositions] = await Promise.all([
    fetchActivityInRange(address, start),
    fetchClosedPositions(address),
  ]);

  return analyzeActivity(
    address,
    activities,
    closedPositions,
    leaderboardPnl,
    leaderboardVolume
  );
}

export { fetchActivityInRange, fetchClosedPositions };
