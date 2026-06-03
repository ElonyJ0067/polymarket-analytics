"use client";

import { useCallback, useState } from "react";
import {
  LeaderboardCategoryFilter,
  RankRange,
  Wallet,
  AiAnalysisResult,
} from "@/types/dashboard";
import Sidebar from "./Sidebar";
import ActivityPanel from "./ActivityPanel";

const defaultRankRange: RankRange = {
  minRank: "",
  maxRank: "",
};

function filterByRank(wallets: Wallet[], rankRange: RankRange): Wallet[] {
  const min = parseInt(rankRange.minRank, 10);
  const max = parseInt(rankRange.maxRank, 10);

  return wallets.filter((wallet) => {
    if (!Number.isNaN(min) && wallet.rank < min) return false;
    if (!Number.isNaN(max) && wallet.rank > max) return false;
    return true;
  });
}

export default function Dashboard() {
  const [category, setCategory] = useState<LeaderboardCategoryFilter>("SPORTS");
  const [loadedCategory, setLoadedCategory] =
    useState<LeaderboardCategoryFilter | null>(null);
  const [rankRange, setRankRange] = useState<RankRange>(defaultRankRange);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [totalRetrieved, setTotalRetrieved] = useState(0);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysisResult | null>(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortedAt, setSortedAt] = useState<Date | null>(null);

  const retrieveLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    setWallets([]);
    setSelectedWallet(null);
    setAiAnalysis(null);

    try {
      const response = await fetch(
        `/api/leaderboard?category=${category}&timePeriod=DAY&orderBy=PNL`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to fetch leaderboard");
      }

      const fetched: Wallet[] = data.wallets ?? [];
      setWallets(fetched);
      setTotalRetrieved(data.total ?? fetched.length);
      setLoadedCategory(category);
      setSortedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch leaderboard");
    } finally {
      setLoading(false);
    }
  }, [category]);

  const runAiAnalysis = useCallback(async () => {
    const targets = filterByRank(wallets, rankRange);
    if (targets.length === 0) {
      setError("No wallets in the selected rank range");
      return;
    }

    setError(null);
    setAiAnalyzing(true);
    setAiAnalysis(null);

    const min = parseInt(rankRange.minRank, 10);
    const max = parseInt(rankRange.maxRank, 10);

    try {
      const response = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallets: targets.map((wallet) => ({
            address: wallet.address,
            rank: wallet.rank,
            username: wallet.username,
          })),
          rankRange: {
            min: Number.isNaN(min) ? null : min,
            max: Number.isNaN(max) ? null : max,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to run AI analysis");
      }

      setAiAnalysis(data as AiAnalysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run AI analysis");
    } finally {
      setAiAnalyzing(false);
    }
  }, [wallets, rankRange]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        category={category}
        loadedCategory={loadedCategory}
        wallets={wallets}
        totalRetrieved={totalRetrieved}
        selectedWallet={selectedWallet}
        rankRange={rankRange}
        loading={loading}
        aiAnalyzing={aiAnalyzing}
        error={error}
        sortedAt={sortedAt}
        onCategoryChange={setCategory}
        onRankRangeChange={setRankRange}
        onSelectWallet={setSelectedWallet}
        onRetrieve={retrieveLeaderboard}
        onAiAnalysis={runAiAnalysis}
      />
      <ActivityPanel
        selectedWallet={selectedWallet}
        aiAnalysis={aiAnalysis}
        aiAnalyzing={aiAnalyzing}
      />
    </div>
  );
}
