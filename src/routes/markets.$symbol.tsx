import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketStats } from "@/components/market-detail/MarketStats";
import { PriceChart } from "@/components/chart/PriceChart";
import { TokenHeader } from "@/components/market-detail/TokenHeader";

export const Route = createFileRoute("/markets/$symbol")({
  component: MarketDetailPage,
});

function MarketDetailPage() {
  const { symbol } = Route.useParams();

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
      <Link
        to="/markets"
        className="inline-block font-mono text-[11px] text-muted-foreground transition hover:text-primary"
      >
        ← markets
      </Link>

      <TokenHeader symbol={symbol} />

      <MarketStats symbol={symbol} />

      <PriceChart symbol={symbol} />

      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          to="/swap"
          className="bg-primary p-3.5 text-center font-mono text-sm font-semibold uppercase text-black transition hover:opacity-90"
        >
          Swap
        </Link>
        <Link
          to="/liquidity"
          className="border border-border p-3.5 text-center font-mono text-sm uppercase transition hover:border-primary/50"
        >
          Add Liquidity
        </Link>
        <Link
          to="/liquidity"
          className="border border-border p-3.5 text-center font-mono text-sm uppercase transition hover:border-primary/50"
        >
          Remove Liquidity
        </Link>
      </div>
    </div>
  );
}
