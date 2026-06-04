"use client";

import { useState } from "react";
import { OpenPosition } from "@/types/dashboard";
import { formatCurrency, formatPercent } from "@/lib/utils";

interface OpenPositionListProps {
  positions: OpenPosition[];
}

export default function OpenPositionList({ positions }: OpenPositionListProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <section className="flex h-full min-h-[280px] flex-col rounded-lg border border-slate-800 bg-slate-900/50">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-800/50"
      >
        <span className="text-sm font-medium text-slate-200">
          Open Positions ({positions.length})
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
          {positions.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">
              No open positions for this address.
            </p>
          ) : (
            positions.map((position) => {
              const pnlPositive = position.cashPnl >= 0;
              return (
                <div
                  key={position.id}
                  className="border-b border-slate-800/60 px-4 py-3 last:border-b-0"
                >
                  <p className="truncate text-sm text-slate-200">
                    {position.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {position.outcome}
                    {position.endDate ? ` · ${position.endDate}` : ""}
                  </p>

                  <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Size</span>
                      <span className="text-slate-200">
                        {position.size.toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Avg</span>
                      <span className="text-slate-200">
                        {(position.avgPrice * 100).toFixed(1)}¢
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Price</span>
                      <span className="text-slate-200">
                        {(position.curPrice * 100).toFixed(1)}¢
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Value</span>
                      <span className="text-slate-200">
                        {formatCurrency(position.currentValue)}
                      </span>
                    </div>
                    <div className="col-span-2 flex justify-between gap-2">
                      <span className="text-slate-500">PnL</span>
                      <span
                        className={
                          pnlPositive ? "text-emerald-400" : "text-rose-400"
                        }
                      >
                        {formatCurrency(position.cashPnl, true)} (
                        {formatPercent(position.percentPnl)})
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </section>
  );
}
