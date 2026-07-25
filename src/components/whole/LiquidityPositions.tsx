import { useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { CheckCircle2, Coins, RefreshCw } from "lucide-react";

import { TokenIcon } from "@/components/markets/TokenIcon";
import { useClaimFees } from "@/hooks/useClaimFees";
import { useLiquidity } from "@/hooks/useLiquidity";
import { useLiquidityPositions, type LiquidityPosition } from "@/hooks/useLiquidityPositions";
import { useMarkets } from "@/hooks/useMarkets";
import { formatUSD } from "@/lib/format";
import { Card } from "./Card";

function formatTokenAmount(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount === 0) return "0";
  if (amount < 0.0001) return "<0.0001";
  return amount.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

export function LiquidityPositions() {
  const { authenticated, login } = usePrivy();
  const { positions, loading, error: positionsError, refresh } = useLiquidityPositions();
  const { data: markets } = useMarkets();
  const { removeLiquidity, step, error } = useLiquidity();
  const { claimFees, activeTokenId, loading: claiming, error: claimError } = useClaimFees();
  const [claimingAll, setClaimingAll] = useState(false);

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
    let value = 0;
    let priced = false;

    if (price0 != null) {
      value += Number(position.tokensOwed0) * price0;
      priced = true;
    }
    if (price1 != null) {
      value += Number(position.tokensOwed1) * price1;
      priced = true;
    }

    return priced ? value : null;
  }

  const claimable = positions.filter(
    (position) => Number(position.tokensOwed0) > 0 || Number(position.tokensOwed1) > 0,
  );
  const totalClaimableUSD = positions.reduce((total, position) => {
    const value = feeValue(position);
    return total + (value ?? 0);
  }, 0);

  async function handleRemove(position: LiquidityPosition) {
    const label = `${position.token0Symbol}/${position.token1Symbol}`;
    await removeLiquidity(position.tokenId, position.liquidity, label);
    await refresh();
  }

  async function handleClaim(position: LiquidityPosition) {
    const label = `${position.token0Symbol}/${position.token1Symbol}`;
    const claimed = await claimFees(position.tokenId, label);
    if (claimed) await refresh();
  }

  async function handleClaimAll() {
    if (claimable.length === 0 || claimingAll) return;
    setClaimingAll(true);

    try {
      for (const position of claimable) {
        const label = `${position.token0Symbol}/${position.token1Symbol}`;
        const claimed = await claimFees(position.tokenId, label);
        if (!claimed) break;
      }
      await refresh();
    } finally {
      setClaimingAll(false);
    }
  }

  const removing = step === "approving" || step === "submitting";

  return (
    <Card
      title="Your Liquidity"
      action={
        authenticated ? (
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            aria-label="Refresh liquidity positions"
            className="text-muted-foreground transition hover:text-primary disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        ) : undefined
      }
    >
      {!authenticated ? (
        <div className="flex min-h-48 flex-col items-center justify-center text-center">
          <Coins className="mb-3 h-6 w-6 text-primary" />
          <p className="text-sm font-medium text-foreground">Track and claim your LP fees</p>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
            Connect the wallet that owns your liquidity-position NFTs.
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
            <div className="surface-tile rounded-lg border border-border bg-background/40 p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Active positions
              </p>
              <p className="mt-1 font-mono text-2xl font-semibold text-foreground">
                {loading && positions.length === 0 ? "…" : positions.length}
              </p>
            </div>
            <div className="surface-tile rounded-lg border border-primary/30 bg-primary/5 p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Claimable fees
              </p>
              <p className="mt-1 font-mono text-2xl font-semibold text-primary">
                {loading && positions.length === 0 ? "…" : formatUSD(totalClaimableUSD)}
              </p>
            </div>
          </div>

          {claimable.length > 0 && (
            <button
              type="button"
              disabled={claiming || claimingAll}
              onClick={() => void handleClaimAll()}
              className="glow-primary glow-primary-hover mb-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-xs font-semibold uppercase tracking-wide text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Coins className="h-3.5 w-3.5" />
              {claimingAll ? "Claiming fees…" : `Claim all fees · ${formatUSD(totalClaimableUSD)}`}
            </button>
          )}

          {(positionsError || error || claimError) && (
            <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-400">
              {positionsError || error || claimError}
            </p>
          )}

          {loading && positions.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Reading your positions and accrued fees…
            </p>
          )}

          {!loading && positions.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-foreground">No active positions</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add liquidity on the left to start earning trading fees.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {positions.map((position) => {
              const label = `${position.token0Symbol}/${position.token1Symbol}`;
              const hasFees = Number(position.tokensOwed0) > 0 || Number(position.tokensOwed1) > 0;
              const thisPositionClaiming = claiming && activeTokenId === position.tokenId;
              const usdValue = feeValue(position);

              return (
                <article
                  key={position.tokenId.toString()}
                  className="surface-tile overflow-hidden rounded-lg border border-border bg-background/40 transition-colors hover:border-border-strong"
                >
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
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
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{label}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">
                          Position #{position.tokenId.toString()} ·{" "}
                          {(position.fee / 10_000).toFixed(2)}% fee tier
                        </p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-primary">
                      <CheckCircle2 className="h-2.5 w-2.5" /> Active
                    </span>
                  </div>

                  <div className="p-4">
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <div className="flex items-center justify-between">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          Fees ready to claim
                        </p>
                        <p className="font-mono text-xs font-semibold text-primary">
                          {usdValue != null ? formatUSD(usdValue) : "Value unavailable"}
                        </p>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-xs">
                        <p className="truncate">
                          {formatTokenAmount(position.tokensOwed0)} {position.token0Symbol}
                        </p>
                        <p className="truncate text-right">
                          {formatTokenAmount(position.tokensOwed1)} {position.token1Symbol}
                        </p>
                      </div>
                      {!position.feePreviewLive && (
                        <p className="mt-2 text-[10px] text-amber-400">
                          Live preview unavailable. Claim will verify the amount on-chain.
                        </p>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="font-mono text-[10px] text-muted-foreground">
                        Liquidity {position.liquidity.toString()}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={removing || claiming || claimingAll}
                          onClick={() => void handleRemove(position)}
                          className="rounded-md border border-border px-3 py-2 text-[11px] font-medium text-muted-foreground transition hover:border-red-500/50 hover:bg-red-500/5 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {removing ? "Withdrawing…" : "Withdraw all"}
                        </button>
                        <button
                          type="button"
                          disabled={
                            (!hasFees && position.feePreviewLive) || claiming || claimingAll
                          }
                          onClick={() => void handleClaim(position)}
                          className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-[11px] font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:border-border disabled:bg-transparent disabled:text-muted-foreground disabled:opacity-60"
                        >
                          {thisPositionClaiming
                            ? "Claiming…"
                            : hasFees
                              ? "Claim fees"
                              : position.feePreviewLive
                                ? "No fees yet"
                                : "Check & claim"}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
}
