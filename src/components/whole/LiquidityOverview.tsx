import { Link } from "@tanstack/react-router";

import { TokenIcon } from "@/components/markets/TokenIcon";
import { useMarkets } from "@/hooks/useMarkets";
import { formatUSD } from "@/lib/format";
import { Card } from "./Card";

const ROWS = 6;

// The upstream pool data carries no fee tier, so the fee take can't be read
// off a pool directly. Uniswap v3's 0.30% tier is the default on this chain,
// which makes the APR below an estimate - labelled as one in the footnote.
const ASSUMED_FEE_RATE = 0.003;

function estimateApr(volume24h: number | null, tvl: number | null) {
  if (!volume24h || !tvl || tvl <= 0) return null;
  return ((volume24h * ASSUMED_FEE_RATE * 365) / tvl) * 100;
}

function formatApr(value: number | null) {
  if (value == null) return "—";
  return `${value.toFixed(1)}%`;
}

export function LiquidityOverview() {
  const { data: markets, isLoading } = useMarkets();

  const seen = new Set<string>();
  const pools = (markets ?? [])
    .filter((market) => {
      if (!market.poolAddress || !market.tvl) return false;
      const key = market.poolAddress.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => (b.tvl ?? 0) - (a.tvl ?? 0))
    .slice(0, ROWS);

  return (
    <Card
      title="Liquidity Overview"
      action={
        <Link
          to="/liquidity"
          className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition hover:text-primary"
        >
          Manage ▸
        </Link>
      }
    >
      <table className="w-full font-mono text-xs">
        <thead className="text-[10px] uppercase tracking-wider text-muted-foreground">
          <tr className="border-b border-border">
            <th className="py-2 text-left font-medium">Pool</th>
            <th className="py-2 text-right font-medium">TVL</th>
            <th className="py-2 text-right font-medium">APR</th>
            <th className="py-2 text-right font-medium">Volume</th>
          </tr>
        </thead>

        <tbody>
          {isLoading && pools.length === 0 && (
            <tr>
              <td colSpan={4} className="py-4 text-center text-muted-foreground">
                <span className="text-primary">▸</span> scanning on-chain pools…
              </td>
            </tr>
          )}

          {!isLoading && pools.length === 0 && (
            <tr>
              <td colSpan={4} className="py-4 text-center text-muted-foreground">
                No pools found on-chain.
              </td>
            </tr>
          )}

          {pools.map((pool) => (
            <tr
              key={pool.poolAddress}
              className="group border-b border-border/60 transition hover:bg-primary/5"
            >
              <td className="py-2">
                <Link
                  to="/markets/$symbol"
                  params={{ symbol: pool.symbol }}
                  className="flex items-center gap-2.5"
                >
                  <TokenIcon symbol={pool.symbol} name={pool.name} logo={pool.logo} size={22} />
                  <span className="truncate font-medium transition-colors group-hover:text-primary">
                    {pool.symbol} / {pool.quoteSymbol}
                  </span>
                </Link>
              </td>

              <td className="py-2 text-right tabular-nums">{formatUSD(pool.tvl)}</td>

              <td className="py-2 text-right tabular-nums text-primary">
                {formatApr(estimateApr(pool.volume24h, pool.tvl))}
              </td>

              <td className="py-2 text-right tabular-nums text-muted-foreground">
                {formatUSD(pool.volume24h)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {pools.length > 0 && (
        <p className="mt-3 border-t border-border pt-3 font-mono text-[10px] text-muted-foreground">
          APR estimated from 24h fees at the 0.30% tier.
        </p>
      )}
    </Card>
  );
}
