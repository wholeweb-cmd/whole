import { createFileRoute } from "@tanstack/react-router";

import { SwapCard } from "@/components/swap/SwapCard";

export const Route = createFileRoute("/swap")({
  head: () => ({ meta: [{ title: "Swap" }] }),
  component: SwapPage,
});

function SwapPage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5 p-5 md:p-7">
      <div className="flex flex-col gap-1">
        <h1 className="font-mono text-2xl font-semibold tracking-tight">Swap</h1>
      </div>

      <SwapCard />
    </div>
  );
}
