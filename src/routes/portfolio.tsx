import { createFileRoute } from "@tanstack/react-router";

import { PortfolioCard } from "@/components/portfolio/PortfolioCard";
import { LiquidityPositions } from "@/components/fellow/LiquidityPositions";
import { RecentActivity } from "@/components/fellow/RecentActivity";

export const Route = createFileRoute("/portfolio")({
  head: () => ({ meta: [{ title: "Portfolio — Fellow" }] }),
  component: PortfolioPage,
});

function PortfolioPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
          <span className="text-muted-foreground">fellow@robinhood-chain</span>:~/portfolio $
        </p>
        <h1 className="font-mono text-xl font-semibold tracking-tight">Portfolio</h1>
      </div>

      <PortfolioCard />
      <LiquidityPositions />
      <RecentActivity />
    </div>
  );
}
