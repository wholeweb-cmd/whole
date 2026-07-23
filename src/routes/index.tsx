import { createFileRoute } from "@tanstack/react-router";

import { PortfolioSummary } from "@/components/fellow/PortfolioSummary";
import { MarketOverview } from "@/components/fellow/MarketOverview";
import { LiquidityPositions } from "@/components/fellow/LiquidityPositions";
import { RecentActivity } from "@/components/fellow/RecentActivity";
import { MarketTable } from "@/components/fellow/MarketTable";
import { PriceChart } from "@/components/chart/PriceChart";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fellow — DeFi Operating System" },
      {
        name: "description",
        content:
          "Fellow is the premium DeFi terminal for Robinhood Chain. Trade, manage liquidity, and monitor your on-chain portfolio in one workspace.",
      },
      { property: "og:title", content: "Fellow — DeFi Operating System" },
      {
        property: "og:description",
        content: "The premium DeFi terminal for Robinhood Chain.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Workspace,
});

function Workspace() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
          <span className="text-muted-foreground">fellow@robinhood-chain</span>:~ $
        </p>
        <h1 className="font-mono text-xl font-semibold tracking-tight text-foreground">Dashboard</h1>
      </div>

      <PortfolioSummary />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PriceChart symbol="WETH" />
        </div>
        <MarketOverview />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecentActivity />
        <LiquidityPositions />
      </div>

      <MarketTable />
    </div>
  );
}
