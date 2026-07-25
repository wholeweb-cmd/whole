import { createFileRoute, Link } from "@tanstack/react-router";

import { MarketStats } from "@/components/market-detail/MarketStats";
import { TokenHeader } from "@/components/market-detail/TokenHeader";
import { DexScreenerChart } from "@/components/chart/DexScreenerChart";
import { ChartLoading } from "@/components/chart/ChartLoading";
import { ChartError } from "@/components/chart/ChartError";

import { useMarketDetail } from "@/hooks/useMarkets";

export const Route = createFileRoute("/markets/$symbol")({
  head: ({ params }) => ({
    meta: [{ title: params.symbol.toUpperCase() }],
  }),
  component: MarketDetailPage,
});

function MarketDetailPage() {
  const { symbol } = Route.useParams();

  // One query drives the whole page - the header, the stats and the chart all
  // read from this same cache entry instead of each opening their own fetch.
  const { data: market, isLoading, isError } = useMarketDetail(symbol);

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
      <Link
        to="/markets"
        className="inline-block font-mono text-[11px] text-muted-foreground transition hover:text-primary"
      >
        ← markets
      </Link>

      <TokenHeader symbol={symbol} market={market ?? null} />

      <MarketStats market={market ?? null} />

      {isLoading && <ChartLoading />}

      {!isLoading && isError && (
        <ChartError message="Couldn't load this market. Try again shortly." />
      )}

      {!isLoading && !isError && !market && (
        <ChartError message={`No market found for "${symbol}" on Robinhood Chain.`} />
      )}

      {market?.poolAddress ? (
        <DexScreenerChart poolAddress={market.poolAddress} />
      ) : (
        !isLoading &&
        market && <ChartError message="No indexed pool chart available for this token yet." />
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          to="/swap"
          className="glow-primary glow-primary-hover rounded-lg bg-primary p-4 text-center font-mono text-sm font-semibold uppercase text-primary-foreground hover:opacity-95"
        >
          Swap
        </Link>

        <Link
          to="/liquidity"
          className="surface-tile rounded-lg border border-border p-4 text-center font-mono text-sm uppercase transition hover:border-primary/50 hover:bg-primary/5"
        >
          Add Liquidity
        </Link>

        <Link
          to="/liquidity"
          className="surface-tile rounded-lg border border-border p-4 text-center font-mono text-sm uppercase transition hover:border-primary/50 hover:bg-primary/5"
        >
          Remove Liquidity
        </Link>
      </div>
    </div>
  );
}
