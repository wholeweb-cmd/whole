import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";

import { usePortfolioData } from "@/hooks/usePortfolioData";
import { Card, Stat } from "./Card";

export function PortfolioSummary() {
  const { authenticated } = usePrivy();
  const { data: portfolio, isLoading } = usePortfolioData();
  const [history, setHistory] = useState<number[]>([]);

  // No historical indexer exists, so this samples the wallet's live total
  // value on every poll instead of faking a chart.
  useEffect(() => {
    if (portfolio?.totalValue == null) return;
    setHistory((prev) => [...prev, portfolio.totalValue].slice(-30));
  }, [portfolio?.totalValue]);

  if (!authenticated) {
    return (
      <Card title="Portfolio Summary">
        <p className="py-6 text-center text-sm text-muted-foreground">
          Connect your wallet to see your portfolio.
        </p>
      </Card>
    );
  }

  const first = history[0];
  const last = history[history.length - 1];
  const changePct = first ? ((last - first) / first) * 100 : null;

  return (
    <Card title="Portfolio Summary">
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <Stat
          label="Portfolio Value"
          value={isLoading ? "…" : `$${(portfolio?.totalValue ?? 0).toLocaleString()}`}
          delta={changePct != null ? `${Math.abs(changePct).toFixed(2)}% session` : undefined}
          positive={(changePct ?? 0) >= 0}
        />

        <Stat
          label="Claimable Fees"
          value={isLoading ? "…" : `$${(portfolio?.claimableFeesUSD ?? 0).toLocaleString()}`}
        />

        <Stat
          label="Open Positions"
          value={isLoading ? "…" : String(portfolio?.positions.length ?? 0)}
        />

        <Stat
          label="Tracked Assets"
          value={isLoading ? "…" : String(portfolio?.assets.length ?? 0)}
        />
      </div>
    </Card>
  );
}
