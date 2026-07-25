import { Link } from "@tanstack/react-router";

import { TokenIcon } from "@/components/markets/TokenIcon";
import type { MarketData } from "@/lib/uniswap/market";
import { CHAIN } from "@/lib/config/chain";

interface Props {
  symbol: string;
  market: MarketData | null;
}

export function TokenHeader({ symbol, market }: Props) {
  return (
    <div className="surface-panel overflow-hidden rounded-xl border border-border">
      <div className="surface-head border-b border-border px-5 py-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        <span className="text-primary">▍</span> Token / {market?.pair ?? symbol}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-5 p-6">
        <div className="flex items-center gap-5">
          <TokenIcon
            symbol={market?.symbol ?? symbol}
            name={market?.name}
            logo={market?.logo}
            size={52}
          />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-2xl font-bold">{market?.symbol ?? symbol}</h1>

              {market && !market.verified && (
                <span
                  title="Discovered on-chain, not curated — verify the contract before trading."
                  className="rounded-full border border-yellow-500/40 bg-yellow-500/10 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-yellow-500"
                >
                  Unverified
                </span>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              {market?.name ?? <span className="opacity-50">loading…</span>}
            </p>

            {market?.address && (
              // The bare address used to be dead text; link it to the explorer
              // so a user can actually verify the contract they're trading.
              <a
                href={`${CHAIN.explorer}/token/${market.address}`}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-1 block break-all font-mono text-[11px] text-muted-foreground transition hover:text-primary"
              >
                {market.address} ↗
              </a>
            )}
          </div>
        </div>

        <div className="flex gap-2.5">
          <Link
            to="/swap"
            className="glow-primary glow-primary-hover rounded-lg bg-primary px-6 py-2.5 font-mono text-sm font-semibold text-primary-foreground hover:opacity-95"
          >
            Swap
          </Link>

          <Link
            to="/liquidity"
            className="surface-tile rounded-lg border border-border px-6 py-2.5 font-mono text-sm transition hover:border-primary/50 hover:bg-primary/5"
          >
            Add LP
          </Link>
        </div>
      </div>
    </div>
  );
}
