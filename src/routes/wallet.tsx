import { createFileRoute } from "@tanstack/react-router";

import { PortfolioCard } from "@/components/portfolio/PortfolioCard";

export const Route = createFileRoute("/wallet")({
  head: () => ({ meta: [{ title: "Wallet" }] }),
  component: WalletPage,
});

function WalletPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 p-5 md:p-7">
      <div className="flex flex-col gap-1">
        <h1 className="font-mono text-2xl font-semibold tracking-tight">Wallet</h1>
      </div>

      <PortfolioCard />
    </div>
  );
}
