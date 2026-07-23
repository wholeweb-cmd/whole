import { Link } from "@tanstack/react-router";

import { TokenIcon } from "@/components/markets/TokenIcon";
import { useMarkets } from "@/hooks/useMarkets";
import { Card } from "./Card";

function formatUSD(value: number | null) {
  if (value == null) return "—";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function formatPrice(value: number | null) {
  if (value == null) return "—";
  if (value >= 1) return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  return `$${value.toPrecision(3)}`;
}

export function MarketTable() {
  const { data: markets, isLoading } = useMarkets();
  const top = (markets ?? []).slice(0, 8);

  return (
    <Card title="Top Markets">
      <table className="w-full font-mono text-sm">
        <thead className="text-[10px] uppercase tracking-wider text-muted-foreground">
          <tr className="border-b border-border">
            <th className="py-2 text-left font-medium">Token</th>
            <th className="text-right font-medium">Price</th>
            <th className="text-right font-medium">Vol 24h</th>
          </tr>
        </thead>

        <tbody>
          {isLoading && top.length === 0 && (
            <tr>
              <td colSpan={3} className="py-4 text-center text-xs text-muted-foreground">
                <span className="text-primary">▸</span> scanning on-chain pools…
              </td>
            </tr>
          )}

          {!isLoading && top.length === 0 && (
            <tr>
              <td colSpan={3} className="py-4 text-center text-xs text-muted-foreground">
                No markets found.
              </td>
            </tr>
          )}

          {top.map((market) => (
            <tr key={market.address} className="border-b border-border/60 hover:bg-primary/5">
              <td className="py-2">
                <Link
                  to="/markets/$symbol"
                  params={{ symbol: market.symbol }}
                  className="flex items-center gap-2.5 font-medium transition-colors hover:text-primary"
                >
                  <TokenIcon symbol={market.symbol} logo={market.logo} size={22} />
                  {market.symbol}
                </Link>
              </td>
              <td className="text-right tabular-nums">{formatPrice(market.price)}</td>
              <td className="text-right tabular-nums text-muted-foreground">
                {formatUSD(market.volume24h)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
