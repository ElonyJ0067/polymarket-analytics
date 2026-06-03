"use client";

import { useMemo } from "react";
import {
  CATEGORY_OPTIONS,
  getCategoryLabel,
  LeaderboardCategoryFilter,
  RankRange,
  Wallet,
} from "@/types/dashboard";
import WalletCard from "./WalletCard";

interface SidebarProps {
  category: LeaderboardCategoryFilter;
  loadedCategory: LeaderboardCategoryFilter | null;
  wallets: Wallet[];
  totalRetrieved: number;
  selectedWallet: Wallet | null;
  rankRange: RankRange;
  loading: boolean;
  aiAnalyzing: boolean;
  error: string | null;
  sortedAt: Date | null;
  onCategoryChange: (category: LeaderboardCategoryFilter) => void;
  onRankRangeChange: (rankRange: RankRange) => void;
  onSelectWallet: (wallet: Wallet) => void;
  onRetrieve: () => void;
  onAiAnalysis: () => void;
}

function filterByRank(wallets: Wallet[], rankRange: RankRange): Wallet[] {
  const min = parseInt(rankRange.minRank, 10);
  const max = parseInt(rankRange.maxRank, 10);

  return wallets.filter((wallet) => {
    if (!Number.isNaN(min) && wallet.rank < min) return false;
    if (!Number.isNaN(max) && wallet.rank > max) return false;
    return true;
  });
}

export default function Sidebar({
  category,
  loadedCategory,
  wallets,
  totalRetrieved,
  selectedWallet,
  rankRange,
  loading,
  aiAnalyzing,
  error,
  sortedAt,
  onCategoryChange,
  onRankRangeChange,
  onSelectWallet,
  onRetrieve,
  onAiAnalysis,
}: SidebarProps) {
  const filteredWallets = useMemo(
    () => filterByRank(wallets, rankRange),
    [wallets, rankRange]
  );

  const sortedTime = sortedAt
    ? sortedAt.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      })
    : "—";

  const updateRank = (key: keyof RankRange, value: string) => {
    onRankRangeChange({ ...rankRange, [key]: value });
  };

  return (
    <aside className="flex h-screen w-[400px] shrink-0 flex-col border-r border-slate-800 bg-slate-950">
      <div className="border-b border-slate-800 p-4">
        <h1 className="text-lg font-bold text-white">
          {loadedCategory
            ? `${getCategoryLabel(loadedCategory)} - Today`
            : "Leaderboard"}
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          {loading
            ? `Fetching ${getCategoryLabel(category)} leaderboard...`
            : aiAnalyzing
              ? "AI analysis in progress..."
              : loadedCategory
                ? `${totalRetrieved} retrieved · ${filteredWallets.length} shown · sorted by PnL: ${sortedTime}`
                : "Select a category and click Retrieve"}
        </p>

        <div className="mt-3 flex gap-2">
          <select
            id="category-select"
            value={category}
            onChange={(e) =>
              onCategoryChange(e.target.value as LeaderboardCategoryFilter)
            }
            className="min-w-0 flex-1 cursor-pointer rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onRetrieve}
            disabled={loading}
            className="shrink-0 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "..." : "Retrieve"}
          </button>
        </div>

        <div className="my-3 border-t border-slate-800" />

        <h2 className="text-sm font-semibold text-white">Analysis</h2>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <input
            type="number"
            min={1}
            placeholder="Min rank"
            value={rankRange.minRank}
            onChange={(e) => updateRank("minRank", e.target.value)}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
          <input
            type="number"
            min={1}
            placeholder="Max rank"
            value={rankRange.maxRank}
            onChange={(e) => updateRank("maxRank", e.target.value)}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={onAiAnalysis}
          disabled={loading || aiAnalyzing || wallets.length === 0}
          className="mt-2 w-full rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {aiAnalyzing ? "AI Analysis..." : "AI Analysis"}
        </button>

        {error && (
          <p className="mt-2 rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-1.5 text-xs text-rose-400">
            {error}
          </p>
        )}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {loading && wallets.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">
            Loading leaderboard traders...
          </p>
        )}

        {!loading &&
          filteredWallets.map((wallet) => (
            <WalletCard
              key={wallet.id}
              wallet={wallet}
              selected={selectedWallet?.id === wallet.id}
              onSelect={onSelectWallet}
            />
          ))}

        {!loading && filteredWallets.length === 0 && wallets.length > 0 && (
          <p className="py-8 text-center text-sm text-slate-500">
            No wallets match the rank range.
          </p>
        )}

        {!loading && wallets.length === 0 && !error && (
          <p className="py-8 text-center text-sm text-slate-500">
            Select a category and click Retrieve to load wallets.
          </p>
        )}
      </div>
    </aside>
  );
}
