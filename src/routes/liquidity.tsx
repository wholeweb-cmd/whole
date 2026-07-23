import { createFileRoute } from "@tanstack/react-router";

import { AddLiquidityCard } from "@/components/liquidity/AddLiquidityCard";
import { LiquidityPositions } from "@/components/fellow/LiquidityPositions";

export const Route = createFileRoute("/liquidity")({
  head: () => ({ meta: [{ title: "Liquidity — Fellow" }] }),
  component: LiquidityPage,
});

function LiquidityPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
          <span className="text-muted-foreground">fellow@robinhood-chain</span>:~/liquidity $
        </p>
        <h1 className="font-mono text-xl font-semibold tracking-tight">Liquidity</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <AddLiquidityCard />
        </div>
        <div className="lg:col-span-3">
          <LiquidityPositions />
        </div>
      </div>
    </div>
  );
}
