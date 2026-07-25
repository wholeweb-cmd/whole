// Shared number formatting for the workspace's market surfaces, so every card
// renders the same value the same way.

export function formatUSD(value: number | null | undefined) {
  if (value == null) return "—";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

export function formatPrice(value: number | null | undefined) {
  if (value == null) return "—";
  if (value >= 1) return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  return `$${value.toPrecision(3)}`;
}

export function formatChange(value: number | null | undefined) {
  if (value == null) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

/** Neon green for gains, danger red for losses, muted when unknown. */
export function changeColor(value: number | null | undefined) {
  if (value == null) return "text-muted-foreground";
  return value >= 0 ? "text-primary" : "text-red-400";
}
