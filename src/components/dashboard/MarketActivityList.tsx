"use client";

import { useState } from "react";
import { MarketActivity } from "@/types/dashboard";
import { formatCurrency } from "@/lib/utils";

interface MarketActivityListProps {
  markets: MarketActivity[];
}

export default function MarketActivityList({ markets }: MarketActivityListProps) {
  const [expanded, setExpanded] = useState(true);
  const [openMarkets, setOpenMarkets] = useState<Set<string>>(new Set());

  const toggleMarket = (id: string) => {
    setOpenMarkets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section className="flex h-full min-h-[280px] flex-col rounded-lg border border-slate-800 bg-slate-900/50">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-800/50"
      >
        <span className="text-sm font-medium text-slate-200">
          Activity ({markets.length})
        </span>
        <svg
          className={`h-4 w-4 text-slate-400 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {expanded && (
        <div className="flex-1 overflow-y-auto border-t border-slate-800">
          {markets.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-slate-500">
              No qualifying activity in the last week.
            </p>
          )}
          {markets.map((market) => {
            const isOpen = openMarkets.has(market.id);
            return (
              <div
                key={market.id}
                className="border-b border-slate-800/60 last:border-b-0"
              >
                <button
                  type="button"
                  onClick={() => toggleMarket(market.id)}
                  className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-slate-800/30"
                >
                  <div className="flex min-w-0 items-start gap-2">
                    <svg
                      className={`mt-0.5 h-4 w-4 shrink-0 text-slate-500 transition-transform ${
                        isOpen ? "rotate-90" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-slate-200">
                        {market.question}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {market.date}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-4 text-right text-xs">
                    <div>
                      <div className="text-slate-500">Term</div>
                      <div className="font-medium text-emerald-400">
                        {market.term}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Buy</div>
                      <div className="font-medium text-slate-200">
                        {formatCurrency(market.buyAmount)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Activities</div>
                      <div className="font-medium text-slate-200">
                        {market.activityCount}
                      </div>
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-800/40 bg-slate-950/50 px-4 py-3">
                    <p className="text-xs text-slate-500">
                      {market.activityCount} trade activities recorded for this
                      market.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
