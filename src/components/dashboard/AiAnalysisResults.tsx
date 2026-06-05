"use client";

import type { AiAnalysisResult } from "@/types/dashboard";

interface AiAnalysisResultsProps {
  result: AiAnalysisResult;
}

export default function AiAnalysisResults({ result }: AiAnalysisResultsProps) {
  const analyzedTime = new Date(result.analyzedAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });

  const rankLabel =
    result.rankRange.min != null || result.rankRange.max != null
      ? `Ranks ${result.rankRange.min ?? "—"}–${result.rankRange.max ?? "—"}`
      : "All ranks";

  return (
    <section className="rounded-lg border border-emerald-800/40 bg-emerald-950/20">
      <div className="border-b border-emerald-800/30 px-4 py-3">
        <h3 className="text-sm font-semibold text-emerald-300">AI Analysis</h3>
        <p className="mt-1 text-xs text-slate-400">
          {rankLabel} · {result.walletCount} wallets · {result.positionCount}{" "}
          positions · {analyzedTime}
        </p>
      </div>

      <div className="max-h-[480px] overflow-y-auto">
        {result.events.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">
            No open positions found for wallets in this rank range.
          </p>
        ) : (
          result.events.map((item, index) => (
            <div
              key={`${item.event}-${index}`}
              className="border-b border-slate-800/60 px-4 py-3 last:border-b-0"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-100">
                    {index + 1}. {item.event}
                  </p>
                  {item.insight && (
                    <p className="mt-1 text-xs text-slate-400">{item.insight}</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-bold text-emerald-400">
                    {item.count}
                  </p>
                  <p className="text-[11px] text-slate-500">positions</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {item.frequency} · {item.walletCount} wallet
                {item.walletCount === 1 ? "" : "s"}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
