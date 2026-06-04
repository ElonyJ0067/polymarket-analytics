"use client";

import { useCallback, useEffect, useState } from "react";
import { Wallet, WalletActivity, AiAnalysisResult } from "@/types/dashboard";
import DailyPnLGrid from "./DailyPnLGrid";
import ActivityPositionSplit from "./ActivityPositionSplit";
import AiAnalysisResults from "./AiAnalysisResults";

interface ActivityPanelProps {
  selectedWallet: Wallet | null;
  aiAnalysis: AiAnalysisResult | null;
  aiAnalyzing: boolean;
}

interface ActivityData extends WalletActivity {
  activityCount: number;
  positionCount: number;
  lastFetch: string;
}

export default function ActivityPanel({
  selectedWallet,
  aiAnalysis,
  aiAnalyzing,
}: ActivityPanelProps) {
  const [address, setAddress] = useState("");
  const [tracking, setTracking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [trackedAddress, setTrackedAddress] = useState<string | null>(null);

  useEffect(() => {
    if (selectedWallet) {
      setAddress(selectedWallet.address);
    }
  }, [selectedWallet]);

  const fetchActivity = useCallback(async (walletAddress: string) => {
    const trimmed = walletAddress.trim();
    if (!trimmed) {
      setError("Enter a wallet address");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/activity?user=${encodeURIComponent(trimmed)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to fetch activity");
      }

      setActivity(data);
      setTrackedAddress(trimmed);
      setTracking(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch activity");
      setActivity(null);
      setTrackedAddress(null);
      setTracking(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTrack = () => {
    fetchActivity(address);
  };

  const handleStop = () => {
    setTracking(false);
    setActivity(null);
    setTrackedAddress(null);
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleTrack();
    }
  };

  const lastFetchTime = activity?.lastFetch
    ? new Date(activity.lastFetch).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  return (
    <main className="flex h-screen flex-1 flex-col overflow-hidden bg-slate-950">
      <div className="border-b border-slate-800 p-6">
        <h2 className="text-2xl font-bold text-white">Activity</h2>
        <p className="mt-1 text-sm text-slate-500">
          Enter any wallet address and click Track to load activity and daily PnL.
        </p>

        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="0x..."
            disabled={loading}
            className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-4 py-2.5 font-mono text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleTrack}
            disabled={loading || !address.trim()}
            className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Loading..." : "Track"}
          </button>
          <button
            type="button"
            onClick={handleStop}
            disabled={loading}
            className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Stop
          </button>
        </div>

        {error && (
          <p className="mt-2 rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-1.5 text-xs text-rose-400">
            {error}
          </p>
        )}

        {tracking && trackedAddress && activity && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Connected
            </span>
            <span className="font-mono">{trackedAddress}</span>
            {lastFetchTime && <span>Last fetch: {lastFetchTime}</span>}
            <span>{activity.activityCount} activities</span>
            <span>{activity.positionCount} positions</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {aiAnalyzing && (
          <div className="mb-4 flex items-center justify-center rounded-lg border border-emerald-800/40 bg-emerald-950/20 px-4 py-8">
            <p className="text-sm text-emerald-300">
              Running AI analysis on positions for ranked wallets...
            </p>
          </div>
        )}

        {aiAnalysis && !aiAnalyzing && (
          <div className="mb-4">
            <AiAnalysisResults result={aiAnalysis} />
          </div>
        )}

        {loading && (
          <div className="flex h-full items-center justify-center">
            <p className="text-slate-500">Fetching activity data...</p>
          </div>
        )}

        {!loading && !activity && !aiAnalysis && !aiAnalyzing && (
          <div className="flex h-full items-center justify-center">
            <p className="text-slate-500">
              Enter a wallet address and click Track to view activity, or run AI
              Analysis from the sidebar.
            </p>
          </div>
        )}

        {!loading && activity && (
          <div className="space-y-4">
            <DailyPnLGrid
              days={activity.dailyPnL}
              totalPnL14d={activity.totalPnL14d}
              totalPnL={activity.totalPnL}
            />
            <ActivityPositionSplit
              markets={activity.markets}
              positions={activity.positions}
            />
          </div>
        )}
      </div>
    </main>
  );
}
