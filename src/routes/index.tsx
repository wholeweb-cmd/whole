import { createFileRoute } from "@tanstack/react-router";

import { WalletAssets } from "@/components/whole/WalletAssets";
import { ProtocolOverview } from "@/components/whole/ProtocolOverview";
import { FeeEarnings } from "@/components/whole/FeeEarnings";
import { TrendingMarkets } from "@/components/whole/TrendingMarkets";
import { LiquidityOverview } from "@/components/whole/LiquidityOverview";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard" },
      {
        name: "description",
        content:
          "WHOLE is the premium DeFi platform for Robinhood Chain. Trade, manage liquidity, and monitor your on-chain portfolio in one workspace.",
      },
      { property: "og:title", content: "WHOLE — DeFi Operating System" },
      {
        property: "og:description",
        content: "The premium DeFi platform for Robinhood Chain.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Workspace,
});

function Workspace() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 p-5 md:p-7">
      <div className="flex flex-col gap-1">
        <h1 className="font-mono text-2xl font-semibold tracking-tight text-foreground">
          Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <WalletAssets />
        <ProtocolOverview />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <FeeEarnings />
        <TrendingMarkets />
      </div>

      <LiquidityOverview />
    </div>
  );
}
