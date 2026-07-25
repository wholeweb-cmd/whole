import { Link } from "@tanstack/react-router";

import { TokenIcon } from "@/components/markets/TokenIcon";
import { useMarkets } from "@/hooks/useMarkets";
import { changeColor, formatChange, formatPrice, formatUSD } from "@/lib/format";
import { Card } from "./Card";

const ROWS = 6;

export function TrendingMarkets() {
  const { data: markets, isLoading } = useMarkets();

  // Markets already arrive sorted by 24h volume (most active first).
  const trending = (markets ?? []).filter((m) => m.price != null).slice(0, ROWS);

  return (
    <Card
      title="Trending Markets"
      action={
        <Link
          to="/markets"
          className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition hover:text-primary"
        >
          All ▸
        </Link>
      }
    >
      <table className="w-full font-mono text-xs">
        <thead className="text-[10px] uppercase tracking-wider text-muted-foreground">
          <tr className="border-b border-border">
            <th className="py-2 text-left font-medium">Token</th>
            <th className="py-2 text-right font-medium">Price</th>
            <th className="py-2 text-right font-medium">24H</th>
            <th className="py-2 text-right font-medium">Volume</th>
          </tr>
        </thead>

        <tbody>
          {isLoading && trending.length === 0 && (
            <tr>
              <td colSpan={4} className="py-4 text-center text-muted-foreground">
                <span className="text-primary">▸</span> scanning on-chain pools…
              </td>
            </tr>
          )}

          {!isLoading && trending.length === 0 && (
            <tr>
              <td colSpan={4} className="py-4 text-center text-muted-foreground">
                No markets found.
              </td>
            </tr>
          )}

          {trending.map((market, index) => (
            <tr
              key={`${market.address}:${market.poolAddress ?? ""}`}
              className="group border-b border-border/60 transition hover:bg-primary/5"
            >
              <td className="py-2">
                <Link
                  to="/markets/$symbol"
                  params={{ symbol: market.symbol }}
                  className="flex items-center gap-2.5"
                >
                  <span className="w-3 shrink-0 text-[10px] text-muted-foreground">
                    {index + 1}
                  </span>
                  <TokenIcon
                    symbol={market.symbol}
                    name={market.name}
                    logo={market.logo}
                    size={22}
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-medium transition-colors group-hover:text-primary">
                      {market.symbol}
                    </span>
                    <span className="block truncate text-[10px] text-muted-foreground">
                      {market.pair}
                    </span>
                  </span>
                </Link>
              </td>

              <td className="py-2 text-right tabular-nums">{formatPrice(market.price)}</td>

              <td className={`py-2 text-right tabular-nums ${changeColor(market.change24h)}`}>
                {formatChange(market.change24h)}
              </td>

              <td className="py-2 text-right tabular-nums text-muted-foreground">
                {formatUSD(market.volume24h)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
