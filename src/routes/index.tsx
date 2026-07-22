import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/fellow/Header";
import { Sidebar } from "@/components/fellow/Sidebar";
import { ContextPanel } from "@/components/fellow/ContextPanel";
import { CommandBar } from "@/components/fellow/CommandBar";
import { PortfolioSummary } from "@/components/fellow/PortfolioSummary";
import { MarketOverview } from "@/components/fellow/MarketOverview";
import { LiquidityPositions } from "@/components/fellow/LiquidityPositions";
import { RecentActivity } from "@/components/fellow/RecentActivity";

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
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <Header />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pb-36">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 p-4 md:p-6">
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Home
              </p>
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                Workspace
              </h1>
            </div>
            <PortfolioSummary />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <MarketOverview />
              <RecentActivity />
            </div>
            <LiquidityPositions />
          </div>
        </main>
        <ContextPanel />
      </div>
      <CommandBar />
    </div>
  );
}
