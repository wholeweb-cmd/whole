import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { SwapCard } from "@/components/swap/SwapCard";
import { PriceChart } from "@/components/chart/PriceChart";

export const Route = createFileRoute("/swap")({
  head: () => ({ meta: [{ title: "Swap — Fellow" }] }),
  component: SwapPage,
});

function SwapPage() {
  // The chart tracks whatever the user is buying; simple session state keeps
  // it in view without over-coupling to the swap card internals.
  const [focusSymbol] = useState("WETH");

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
          <span className="text-muted-foreground">fellow@robinhood-chain</span>:~/swap $
        </p>
        <h1 className="font-mono text-xl font-semibold tracking-tight">Swap</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <PriceChart symbol={focusSymbol} />
        </div>
        <div className="lg:col-span-2">
          <SwapCard />
        </div>
      </div>
    </div>
  );
}
