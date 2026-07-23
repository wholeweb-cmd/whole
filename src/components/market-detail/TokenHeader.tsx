import { Link } from "@tanstack/react-router";

import { TokenIcon } from "@/components/markets/TokenIcon";
import { useMarketDetail } from "@/hooks/useMarkets";

interface Props {
  symbol: string;
}

export function TokenHeader({ symbol }: Props) {
  const { data: market } = useMarketDetail(symbol);

  return (
    <div className="border border-border bg-card">
      <div className="border-b border-border bg-[#0b0d11] px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        <span className="text-primary">▍</span> Token / {market?.pair ?? symbol}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <TokenIcon symbol={market?.symbol ?? symbol} logo={market?.logo} size={52} />

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-2xl font-bold">{market?.symbol ?? symbol}</h1>

              {market && !market.verified && (
                <span
                  title="Discovered on-chain, not curated — verify the contract before trading."
                  className="border border-yellow-500/40 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wide text-yellow-500"
                >
                  Unverified
                </span>
              )}
            </div>

            <p className="text-sm text-muted-foreground">{market?.name}</p>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground/70">{market?.address}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            to="/swap"
            className="bg-primary px-5 py-2 font-mono text-sm font-semibold text-black transition hover:opacity-90"
          >
            Swap
          </Link>

          <Link
            to="/liquidity"
            className="border border-border px-5 py-2 font-mono text-sm transition hover:border-primary/50"
          >
            Add LP
          </Link>
        </div>
      </div>
    </div>
  );
}
