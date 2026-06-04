"use client";

import { DailyPnL } from "@/types/dashboard";
import { formatCurrency } from "@/lib/utils";

interface DailyPnLGridProps {
  days: DailyPnL[];
  totalPnL14d: number;
  totalPnL: number;
}

export default function DailyPnLGrid({
  days,
  totalPnL14d,
  totalPnL,
}: DailyPnLGridProps) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Daily PnL
        </h3>
        <div className="flex items-center gap-3 text-sm">
          <span className="font-semibold text-emerald-400">
            {formatCurrency(totalPnL14d, true)}
          </span>
          <span className="text-slate-500">
            14d ·{" "}
            <span className="text-rose-400">
              {formatCurrency(totalPnL, true)} total
            </span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          const positive = day.pnl >= 0;
          return (
            <div
              key={`${day.day}-${index}`}
              className={`rounded-md border px-2 py-2 text-center ${
                positive
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : "border-rose-500/30 bg-rose-500/10"
              }`}
            >
              <div className="text-xs font-medium text-slate-400">
                {day.day}
              </div>
              <div
                className={`mt-0.5 text-xs font-semibold ${
                  positive ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {formatCurrency(day.pnl, true)}
              </div>
              <div className="mt-0.5 text-[10px] text-slate-500">
                {formatCurrency(day.volume)}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
