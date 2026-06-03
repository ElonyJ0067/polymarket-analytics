"use client";

import { Wallet } from "@/types/dashboard";
import { formatCurrency, truncateAddress } from "@/lib/utils";

interface WalletCardProps {
  wallet: Wallet;
  selected: boolean;
  onSelect: (wallet: Wallet) => void;
}

interface MetricRowProps {
  label: string;
  value: string;
  valueClassName?: string;
}

function MetricRow({ label, value, valueClassName = "text-slate-200" }: MetricRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-0.5">
      <span className="shrink-0 text-[11px] text-slate-500">{label}</span>
      <span className={`truncate text-right text-[11px] font-medium ${valueClassName}`}>
        {value}
      </span>
    </div>
  );
}

export default function WalletCard({
  wallet,
  selected,
  onSelect,
}: WalletCardProps) {
  const copyAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(wallet.address);
  };

  const pnlPositive = wallet.pnl >= 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(wallet)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(wallet);
        }
      }}
      className={`w-full cursor-pointer rounded-lg border p-3 text-left transition-colors ${
        selected
          ? "border-blue-500 bg-slate-800/80"
          : "border-slate-700 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/60"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-slate-300">
              #{wallet.rank}
            </span>
            <span className="truncate text-sm font-medium text-white">
              {wallet.username}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="truncate font-mono text-[11px] text-slate-400">
              {truncateAddress(wallet.address, 8, 6)}
            </span>
            <button
              type="button"
              onClick={copyAddress}
              className="shrink-0 text-slate-500 hover:text-slate-300"
              aria-label="Copy address"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
          </div>
        </div>

      </div>

      <div className="mt-2.5 space-y-0.5 border-t border-slate-700/60 pt-2">
        <MetricRow
          label="Volume"
          value={
            wallet.volume !== undefined
              ? formatCurrency(wallet.volume)
              : "—"
          }
        />
        <MetricRow
          label="PnL"
          value={formatCurrency(wallet.pnl, true)}
          valueClassName={`font-semibold ${
            pnlPositive ? "text-emerald-400" : "text-rose-400"
          }`}
        />
      </div>
    </div>
  );
}
