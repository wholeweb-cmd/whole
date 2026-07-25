import type { ReactNode } from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
  ArrowRightLeft,
  Blocks,
  Coins,
  Droplets,
  Minus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { useMarkets } from "@/hooks/useMarkets";
import { useBlockNumber } from "@/hooks/useBlockNumber";
import { changeColor, formatChange, formatUSD } from "@/lib/format";
import { useActivityStore, type ActivityType } from "@/lib/store/activityStore";
import { Card } from "./Card";

const ICONS: Record<ActivityType, typeof ArrowRightLeft> = {
  Swap: ArrowRightLeft,
  "Add Liquidity": Droplets,
  "Remove Liquidity": Minus,
  "Claim Fees": Coins,
};

function timeAgo(timestamp: number) {
  const seconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

function Row({
  icon: Icon,
  title,
  detail,
  meta,
}: {
  icon: typeof ArrowRightLeft;
  title: string;
  detail: string;
  meta?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 py-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-surface-raised text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-xs font-medium text-foreground">{title}</span>
        <span className="truncate text-[11px] text-muted-foreground">{detail}</span>
      </div>
      {meta && <div className="hidden shrink-0 flex-col items-end sm:flex">{meta}</div>}
    </div>
  );
}

/**
 * What the chain is doing right now, for visitors with no wallet connected.
 *
 * There is no indexer on this chain to replay individual protocol events, so
 * every line here is a live reading off the markets feed and the node rather
 * than a synthetic transaction log.
 */
function ProtocolActivity() {
  const { data: markets, isLoading } = useMarkets();
  const block = useBlockNumber();

  const rows = markets ?? [];
  const priced = rows.filter((m) => m.change24h != null);

  const mostActive = rows[0] ?? null;
  const deepest = rows.reduce<(typeof rows)[number] | null>(
    (best, m) => (!best || (m.tvl ?? 0) > (best.tvl ?? 0) ? m : best),
    null,
  );
  const gainer = priced.reduce<(typeof rows)[number] | null>(
    (best, m) => (!best || (m.change24h ?? 0) > (best.change24h ?? 0) ? m : best),
    null,
  );
  const loser = priced.reduce<(typeof rows)[number] | null>(
    (worst, m) => (!worst || (m.change24h ?? 0) < (worst.change24h ?? 0) ? m : worst),
    null,
  );

  return (
    <Card
      title="Protocol Activity"
      action={
        <span className="font-mono text-[10px] uppercase tracking-widest text-primary">live</span>
      }
    >
      <div className="divide-y divide-border">
        <Row
          icon={Blocks}
          title="Block sealed"
          detail={block === "0" ? "Connecting to Robinhood Chain…" : `#${block} · Robinhood Chain`}
        />

        {isLoading && rows.length === 0 && (
          <p className="py-3 font-mono text-xs text-muted-foreground">
            <span className="text-primary">▸</span> scanning on-chain pools…
          </p>
        )}

        {mostActive && (
          <Row
            icon={ArrowRightLeft}
            title="Most active market"
            detail={`${mostActive.pair} · ${formatUSD(mostActive.volume24h)} traded in 24h`}
          />
        )}

        {deepest && (
          <Row
            icon={Droplets}
            title="Deepest pool"
            detail={`${deepest.symbol} / ${deepest.quoteSymbol} · ${formatUSD(deepest.tvl)} TVL`}
          />
        )}

        {gainer && (
          <Row
            icon={TrendingUp}
            title="Top gainer (24h)"
            detail={gainer.pair}
            meta={
              <span className={`font-mono text-xs ${changeColor(gainer.change24h)}`}>
                {formatChange(gainer.change24h)}
              </span>
            }
          />
        )}

        {loser && loser.symbol !== gainer?.symbol && (
          <Row
            icon={TrendingDown}
            title="Top loser (24h)"
            detail={loser.pair}
            meta={
              <span className={`font-mono text-xs ${changeColor(loser.change24h)}`}>
                {formatChange(loser.change24h)}
              </span>
            }
          />
        )}
      </div>

      <p className="mt-3 border-t border-border pt-3 font-mono text-[10px] text-muted-foreground">
        Connect a wallet to see your own activity here.
      </p>
    </Card>
  );
}

export function RecentActivity() {
  const { authenticated } = usePrivy();
  const entries = useActivityStore((s) => s.entries);

  if (!authenticated) return <ProtocolActivity />;

  return (
    <Card title="Recent Activity">
      {entries.length === 0 ? (
        <p className="py-3 text-xs text-muted-foreground">
          No activity yet this session. Swap or add liquidity to see it show up here.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {entries.map((a) => (
            <Row
              key={a.id}
              icon={ICONS[a.type]}
              title={a.type}
              detail={a.detail}
              meta={
                <>
                  <span
                    className={`font-mono text-xs ${
                      a.status === "success"
                        ? "text-primary"
                        : a.status === "error"
                          ? "text-red-400"
                          : "text-muted-foreground"
                    }`}
                  >
                    {a.status}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{timeAgo(a.timestamp)}</span>
                </>
              }
            />
          ))}
        </div>
      )}
    </Card>
  );
}
