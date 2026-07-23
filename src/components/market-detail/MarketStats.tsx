import { useMarketDetail } from "@/hooks/useMarkets";

interface Props {
  symbol: string;
}

function formatUSD(value: number | null | undefined) {
  if (value == null) return "—";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

function formatPrice(value: number | null | undefined) {
  if (value == null) return "—";
  if (value >= 1) return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  return `$${value.toPrecision(4)}`;
}

export function MarketStats({ symbol }: Props) {
  const { data: market, isLoading } = useMarketDetail(symbol);

  const stats = [
    { label: "Price", value: formatPrice(market?.price) },
    { label: "24h Volume", value: formatUSD(market?.volume24h) },
    { label: "TVL", value: formatUSD(market?.tvl) },
    { label: "Pair", value: market?.pair ?? `${symbol}/USDG` },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((item) => (
        <div key={item.label} className="border border-border bg-card p-4 font-mono">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{item.label}</p>
          <h2 className="mt-2 text-xl font-bold tabular-nums">{isLoading ? "…" : item.value}</h2>
        </div>
      ))}
    </div>
  );
}
