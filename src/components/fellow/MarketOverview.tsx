import { Link } from "@tanstack/react-router";

import { TokenIcon } from "@/components/markets/TokenIcon";
import { useMarkets } from "@/hooks/useMarkets";
import { useBlockNumber } from "@/hooks/useBlockNumber";
import { Card, Stat } from "./Card";

function formatUSD(value: number | null, digits = 1) {
  if (value == null) return "—";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(digits)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(digits)}K`;
  return `$${value.toFixed(2)}`;
}

function formatPrice(value: number | null) {
  if (value == null) return "—";
  if (value >= 1) return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  return `$${value.toPrecision(3)}`;
}

export function MarketOverview() {
  const { data: markets, isLoading } = useMarkets();
  const block = useBlockNumber();

  const total24hVolume = markets?.reduce((sum, m) => sum + (m.volume24h ?? 0), 0) ?? null;
  // Markets already arrive sorted by 24h volume (most active first).
  const trending = (markets ?? []).slice(0, 6);

  return (
    <Card title="Market Overview">
      <div className="grid grid-cols-3 gap-6">
        <Stat label="24h Volume" value={isLoading ? "…" : formatUSD(total24hVolume)} />
        <Stat label="Markets" value={isLoading ? "…" : String(markets?.length ?? 0)} />
        <Stat label="Block" value={block} />
      </div>
      <div className="mt-5 border-t border-border pt-4">
        <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Most Active
        </p>
        <div className="divide-y divide-border/60">
          {isLoading && trending.length === 0 && (
            <p className="py-2.5 font-mono text-xs text-muted-foreground">
              <span className="text-primary">▸</span> scanning…
            </p>
          )}
          {!isLoading && trending.length === 0 && (
            <p className="py-2.5 font-mono text-xs text-muted-foreground">No pools found on-chain.</p>
          )}
          {trending.map((t) => (
            <Link
              to="/markets/$symbol"
              params={{ symbol: t.symbol }}
              key={t.address}
              className="flex items-center justify-between py-2 transition hover:bg-primary/5"
            >
              <span className="flex items-center gap-2.5">
                <TokenIcon symbol={t.symbol} logo={t.logo} size={20} />
                <span className="font-mono text-xs font-medium text-foreground">{t.symbol}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{t.pair}</span>
              </span>
              <div className="flex items-center gap-6 font-mono text-xs">
                <span className="text-muted-foreground">{formatUSD(t.volume24h)}</span>
                <span className="w-20 text-right text-primary">{formatPrice(t.price)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Card>
  );
}
