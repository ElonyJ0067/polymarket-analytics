export function truncateAddress(address: string, start = 6, end = 4): string {
  if (address.length <= start + end + 3) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

export function formatCurrency(value: number, showSign = false): string {
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString("en-US", {
    minimumFractionDigits: abs < 100 ? 2 : 0,
    maximumFractionDigits: 2,
  });

  if (showSign) {
    if (value > 0) return `+$${formatted}`;
    if (value < 0) return `-$${formatted}`;
  }

  return `$${formatted}`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
