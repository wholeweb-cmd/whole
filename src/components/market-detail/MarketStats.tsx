import type { MarketData } from "@/lib/uniswap/market";

interface Props {
  market: MarketData | null;
}

// `0` is a meaningful value here (a pool really can have no volume), so these
// guard on null rather than falsiness - the previous `if (!value)` rendered a
// genuine zero as an em dash.
function formatUSD(value: number | null | undefined) {
  if (value == null) return "—";

  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;

  return `$${value.toFixed(2)}`;
}

function formatPrice(value: number | null | undefined) {
  if (value == null) return "—";

  if (value >= 1) return `$${value.toLocaleString(undefined, { maximumFractionDigits: 6 })}`;

  return `$${value.toPrecision(6)}`;
}

function formatChange(value: number | null | undefined) {
  if (value == null) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function MarketStats({ market }: Props) {
  const change = market?.change24h;

  const stats: { label: string; value: string; tone?: string }[] = [
    { label: "Price", value: formatPrice(market?.price) },
    {
      label: "24H Change",
      value: formatChange(change),
      tone: change == null ? undefined : change >= 0 ? "text-primary" : "text-red-400",
    },
    { label: "24H Volume", value: formatUSD(market?.volume24h) },
    { label: "Liquidity", value: formatUSD(market?.tvl) },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((item) => (
        <div
          key={item.label}
          className="surface-panel rounded-xl border border-border p-5 transition-colors hover:border-border-strong"
        >
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {item.label}
          </p>

          <h2 className={`mt-2 font-mono text-2xl font-bold tabular-nums ${item.tone ?? ""}`}>
            {item.value}
          </h2>
        </div>
      ))}
    </div>
  );
}
