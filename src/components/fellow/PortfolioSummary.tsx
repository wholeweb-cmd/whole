import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";

import { usePortfolioData } from "@/hooks/usePortfolioData";
import { Card, Stat } from "./Card";

function Sparkline({ points }: { points: number[] }) {
  const w = 260;
  const h = 56;

  if (points.length < 2) {
    return (
      <div className="flex h-14 w-full items-center justify-center text-[10px] text-muted-foreground">
        Collecting live data…
      </div>
    );
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = w / (points.length - 1);
  const coords = points.map((p, i) => [i * step, h - ((p - min) / range) * h] as const);
  const line = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-14 w-full">
      <path d={area} fill="#B8FF00" fillOpacity="0.08" />
      <path d={line} fill="none" stroke="#B8FF00" strokeWidth="1.25" />
    </svg>
  );
}

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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="grid grid-cols-2 gap-6">
          <Stat
            label="Portfolio Value"
            value={isLoading ? "…" : `$${(portfolio?.totalValue ?? 0).toLocaleString()}`}
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
        <div className="flex flex-col justify-between border-l border-border pl-6">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Session Change
            </span>
            {changePct != null && (
              <span className="font-mono text-[11px] text-primary">
                {changePct >= 0 ? "▲" : "▼"} {Math.abs(changePct).toFixed(2)}%
              </span>
            )}
          </div>
          <Sparkline points={history} />
        </div>
      </div>
    </Card>
  );
}
