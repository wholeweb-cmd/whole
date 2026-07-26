import { useMemo } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Link } from "@tanstack/react-router";
import { Coins } from "lucide-react";

import { TokenIcon } from "@/components/markets/TokenIcon";
import { useClaimFees } from "@/hooks/useClaimFees";
import { useLiquidityPositions, type LiquidityPosition } from "@/hooks/useLiquidityPositions";
import { useMarkets } from "@/hooks/useMarkets";
import { formatUSD } from "@/lib/format";
import { Card } from "./Card";

function amount(value: string) {
  const number = Number(value);
  if (!Number.isFinite(number) || number === 0) return "0";
  if (number < 0.0001) return "<0.0001";
  return number.toLocaleString(undefined, { maximumFractionDigits: 5 });
}

export function FeeEarnings() {
  const { authenticated, login } = usePrivy();
  const { positions, loading, error, refresh } = useLiquidityPositions();
  const { claimFees, activeTokenId, loading: claiming, error: claimError } = useClaimFees();
  const { data: markets } = useMarkets();

  const priceByAddress = useMemo(
    () =>
      new Map(
        (markets ?? []).map((market) => [market.address.toLowerCase(), market.price] as const),
      ),
    [markets],
  );

  function feeValue(position: LiquidityPosition) {
    const price0 = priceByAddress.get(position.token0.toLowerCase());
    const price1 = priceByAddress.get(position.token1.toLowerCase());
    const hasPrice = price0 != null || price1 != null;
    const value =
      Number(position.tokensOwed0) * (price0 ?? 0) + Number(position.tokensOwed1) * (price1 ?? 0);
    return hasPrice ? value : null;
  }

  const earningPositions = positions
    .filter((position) => Number(position.tokensOwed0) > 0 || Number(position.tokensOwed1) > 0)
    .sort((a, b) => (feeValue(b) ?? 0) - (feeValue(a) ?? 0));
  const total = positions.reduce((sum, position) => sum + (feeValue(position) ?? 0), 0);
  const totalLabel = formatUSD(total);

  return (
    <Card
      title="Liquidity Earnings"
      action={
        authenticated ? (
          <span className="font-mono text-[10px] uppercase tracking-widest text-primary">live</span>
        ) : undefined
      }
    >
      {!authenticated ? (
        <div className="flex min-h-52 flex-col items-center justify-center text-center">
          <Coins className="mb-3 h-6 w-6 text-primary" />
          <p className="text-sm font-medium text-foreground">Track fees as they accrue</p>
          <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
            Connect the wallet that owns your active liquidity positions.
          </p>
          <button
            type="button"
            onClick={login}
            className="glow-primary mt-4 rounded-lg bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="surface-tile rounded-lg border border-primary/30 bg-primary/5 p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Ready to claim
              </p>
              <p className="mt-1 font-mono text-2xl font-semibold text-primary">
                {loading && positions.length === 0 ? (
                  <span className="balance-skeleton inline-block h-6 w-20 rounded-md" />
                ) : (
                  <span key={totalLabel} className="live-number">
                    {totalLabel}
                  </span>
                )}
              </p>
            </div>
            <div className="surface-tile rounded-lg border border-border bg-background/40 p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Active positions
              </p>
              <p className="mt-1 font-mono text-2xl font-semibold text-foreground">
                {loading && positions.length === 0 ? "…" : positions.length}
              </p>
            </div>
          </div>

          {(error || claimError) && (
            <p className="py-3 text-xs text-red-400">{error || claimError}</p>
          )}

          {!loading && positions.length === 0 && (
            <div className="py-6 text-center">
              <p className="text-xs font-medium text-foreground">No active liquidity yet</p>
              <Link
                to="/liquidity"
                className="mt-2 inline-block font-mono text-[10px] uppercase tracking-widest text-primary hover:underline"
              >
                Open a position
              </Link>
            </div>
          )}

          {positions.length > 0 && earningPositions.length === 0 && (
            <p className="py-6 text-center text-xs text-muted-foreground">
              Your positions are active. No fees are claimable yet.
            </p>
          )}

          <div className="divide-y divide-border">
            {earningPositions.slice(0, 3).map((position) => (
              <div key={position.tokenId.toString()} className="flex items-center gap-3 py-3">
                <span className="flex items-center">
                  <TokenIcon
                    symbol={position.token0Symbol}
                    name={position.token0Name}
                    logo={position.token0Logo}
                    size={28}
                  />
                  <span className="-ml-2">
                    <TokenIcon
                      symbol={position.token1Symbol}
                      name={position.token1Name}
                      logo={position.token1Logo}
                      size={28}
                    />
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-foreground">
                    {position.token0Symbol}/{position.token1Symbol}
                  </p>
                  <p className="truncate font-mono text-[10px] text-muted-foreground">
                    {amount(position.tokensOwed0)} {position.token0Symbol} +{" "}
                    {amount(position.tokensOwed1)} {position.token1Symbol}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <p className="font-mono text-xs font-semibold text-primary">
                    {formatUSD(feeValue(position))}
                  </p>
                  <button
                    type="button"
                    disabled={claiming}
                    onClick={async () => {
                      const claimed = await claimFees(
                        position.tokenId,
                        `${position.token0Symbol}/${position.token1Symbol}`,
                      );
                      if (claimed) await refresh();
                    }}
                    className="rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-widest text-primary transition hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {claiming && activeTokenId === position.tokenId ? "Claiming…" : "Claim"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
