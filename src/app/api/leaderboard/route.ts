import { NextResponse } from "next/server";
import {
  fetchAllLeaderboard,
  type FetchLeaderboardOptions,
  type LeaderboardCategory,
  type LeaderboardTimePeriod,
} from "@/lib/polymarket/leaderboard";
import { truncateAddress } from "@/lib/utils";
import type { Wallet } from "@/types/dashboard";

export const dynamic = "force-dynamic";

function toWallet(entry: {
  rank: string;
  proxyWallet: string;
  userName: string;
  vol: number;
  pnl: number;
}): Wallet {
  return {
    id: entry.proxyWallet,
    rank: Number.parseInt(entry.rank, 10) || 0,
    username: entry.userName || truncateAddress(entry.proxyWallet, 8, 6),
    address: entry.proxyWallet,
    pnl: entry.pnl,
    volume: entry.vol,
    analyzed: false,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const category = (searchParams.get("category") ??
      "SPORTS") as LeaderboardCategory;
    const timePeriod = (searchParams.get("timePeriod") ??
      "DAY") as LeaderboardTimePeriod;
    const orderBy = searchParams.get("orderBy") === "VOL" ? "VOL" : "PNL";

    const options: FetchLeaderboardOptions = {
      category,
      timePeriod,
      orderBy,
    };

    const entries = await fetchAllLeaderboard(options);
    const wallets = entries.map(toWallet);

    return NextResponse.json({
      wallets,
      total: wallets.length,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch leaderboard";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
