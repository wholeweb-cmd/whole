import { createFileRoute } from "@tanstack/react-router";

import { AddLiquidityCard } from "@/components/liquidity/AddLiquidityCard";

export const Route = createFileRoute("/liquidity")({
  head: () => ({ meta: [{ title: "Liquidity" }] }),
  component: LiquidityPage,
});

function LiquidityPage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5 p-5 md:p-7">
      <div className="flex flex-col gap-1">
        <h1 className="font-mono text-2xl font-semibold tracking-tight">Liquidity</h1>
      </div>

      <AddLiquidityCard />
    </div>
  );
}
