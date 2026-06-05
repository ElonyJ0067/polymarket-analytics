import { fetchOpenPositions } from "@/lib/polymarket/walletActivity";
import type { AiAnalysisResult, AiEventResult } from "@/types/dashboard";

export interface WalletInput {
  address: string;
  rank: number;
  username: string;
}

interface AggregatedEvent {
  event: string;
  count: number;
  walletCount: number;
}

interface OpenAiEventPayload {
  event: string;
  count: number;
  walletCount: number;
  frequency?: string;
  insight?: string;
}

const POSITION_FETCH_CONCURRENCY = 5;

async function fetchPositionsForWallets(
  wallets: WalletInput[],
  onProgress?: (done: number, total: number) => void
) {
  const results: {
    address: string;
    rank: number;
    username: string;
    positions: Awaited<ReturnType<typeof fetchOpenPositions>>;
  }[] = [];

  for (let i = 0; i < wallets.length; i += POSITION_FETCH_CONCURRENCY) {
    const batch = wallets.slice(i, i + POSITION_FETCH_CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async (wallet) => {
        const positions = await fetchOpenPositions(wallet.address);
        return {
          address: wallet.address,
          rank: wallet.rank,
          username: wallet.username,
          positions,
        };
      })
    );
    results.push(...batchResults);
    onProgress?.(Math.min(i + batch.length, wallets.length), wallets.length);
  }

  return results;
}

function aggregateEvents(
  walletPositions: Awaited<ReturnType<typeof fetchPositionsForWallets>>
): AggregatedEvent[] {
  const byMarket = new Map<
    string,
    { event: string; count: number; wallets: Set<string> }
  >();

  for (const wallet of walletPositions) {
    for (const position of wallet.positions) {
      const key = position.conditionId || position.title;
      const existing = byMarket.get(key) ?? {
        event: position.title,
        count: 0,
        wallets: new Set<string>(),
      };
      existing.count += 1;
      existing.wallets.add(wallet.address);
      byMarket.set(key, existing);
    }
  }

  return Array.from(byMarket.values())
    .map((entry) => ({
      event: entry.event,
      count: entry.count,
      walletCount: entry.wallets.size,
    }))
    .sort((a, b) => b.count - a.count);
}

async function callOpenAi(
  walletCount: number,
  positionCount: number,
  aggregated: AggregatedEvent[]
): Promise<AiEventResult[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured in .env.local");
  }

  const systemPrompt = `You analyze Polymarket open positions across multiple ranked traders.
Given aggregated event/market data, identify recurring events and how often they appear.
Group only when market titles clearly refer to the same underlying event.
Return valid JSON only with this shape:
{
  "events": [
    {
      "event": "market or event name",
      "count": total open positions across all wallets,
      "walletCount": number of distinct wallets holding this event,
      "frequency": "human-readable frequency e.g. 12 of 50 wallets (24%)",
      "insight": "one short sentence on why traders may be positioned here"
    }
  ]
}
Sort events by count descending (highest first).`;

  const userPayload = {
    walletCount,
    positionCount,
    aggregated: aggregated.slice(0, 200),
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: JSON.stringify(userPayload),
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI request failed (${response.status}): ${errorBody}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned an empty response");
  }

  const parsed = JSON.parse(content) as { events?: OpenAiEventPayload[] };
  const events = parsed.events ?? [];

  return events
    .map((item) => ({
      event: item.event,
      count: item.count,
      walletCount: item.walletCount,
      frequency:
        item.frequency ??
        `${item.walletCount} of ${walletCount} wallets`,
      insight: item.insight ?? "",
    }))
    .sort((a, b) => b.count - a.count);
}

function fallbackFromAggregated(
  aggregated: AggregatedEvent[],
  walletCount: number
): AiEventResult[] {
  return aggregated.map((item) => ({
    event: item.event,
    count: item.count,
    walletCount: item.walletCount,
    frequency: `${item.walletCount} of ${walletCount} wallets (${walletCount > 0 ? Math.round((item.walletCount / walletCount) * 100) : 0}%)`,
    insight: "",
  }));
}

export async function analyzeWalletPositions(
  wallets: WalletInput[],
  rankRange: { min: number | null; max: number | null },
  onProgress?: (done: number, total: number) => void
): Promise<AiAnalysisResult> {
  const walletPositions = await fetchPositionsForWallets(wallets, onProgress);
  const positionCount = walletPositions.reduce(
    (sum, wallet) => sum + wallet.positions.length,
    0
  );
  const aggregated = aggregateEvents(walletPositions);

  let events: AiEventResult[];
  try {
    events = await callOpenAi(wallets.length, positionCount, aggregated);
  } catch {
    events = fallbackFromAggregated(aggregated, wallets.length);
  }

  return {
    events,
    walletCount: wallets.length,
    positionCount,
    rankRange,
    analyzedAt: new Date().toISOString(),
  };
}
