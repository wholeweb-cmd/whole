import { usePrivy } from "@privy-io/react-auth";

import { Card } from "./Card";
import { useLiquidityPositions } from "@/hooks/useLiquidityPositions";
import { useLiquidity } from "@/hooks/useLiquidity";
import { useClaimFees } from "@/hooks/useClaimFees";

export function LiquidityPositions() {
  const { authenticated } = usePrivy();
  const { positions, loading, refresh } = useLiquidityPositions();
  const { removeLiquidity, step, error } = useLiquidity();
  const { claimFees, step: claimStep, error: claimError } = useClaimFees();

  async function handleRemove(tokenId: bigint, liquidity: bigint, label: string) {
    await removeLiquidity(tokenId, liquidity, label);
    refresh();
  }

  async function handleClaim(tokenId: bigint, label: string) {
    await claimFees(tokenId, label);
    refresh();
  }

  const removing = step === "approving" || step === "submitting";
  const claiming = claimStep === "claiming";

  return (
    <Card title="Liquidity Positions">
      {!authenticated && (
        <p className="text-sm text-muted-foreground">Connect your wallet to see your positions.</p>
      )}

      {authenticated && loading && (
        <p className="text-sm text-muted-foreground">Loading positions...</p>
      )}

      {authenticated && !loading && positions.length === 0 && (
        <p className="text-sm text-muted-foreground">No liquidity positions yet.</p>
      )}

      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
      {claimError && <p className="mb-3 text-sm text-red-400">{claimError}</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {positions.map((p) => {
          const label = `${p.token0Symbol}/${p.token1Symbol}`;
          const hasFees = Number(p.tokensOwed0) > 0 || Number(p.tokensOwed1) > 0;

          return (
            <div
              key={p.tokenId.toString()}
              className="flex flex-col gap-4 border border-border bg-background p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">{label}</span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {(p.fee / 10000).toFixed(2)}%
                </span>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Liquidity
                </p>
                <p className="mt-0.5 font-mono text-lg font-semibold tracking-tight text-foreground">
                  {p.liquidity.toString()}
                </p>
              </div>

              <div className="flex items-end justify-between border-t border-border pt-3">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Owed
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-foreground">
                    {Number(p.tokensOwed0).toFixed(4)} {p.token0Symbol} /{" "}
                    {Number(p.tokensOwed1).toFixed(4)} {p.token1Symbol}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={!hasFees || claiming}
                    onClick={() => handleClaim(p.tokenId, label)}
                    className="rounded-md border border-border px-2 py-1 text-[11px] font-medium text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Claim
                  </button>

                  <button
                    type="button"
                    disabled={removing}
                    onClick={() => handleRemove(p.tokenId, p.liquidity, label)}
                    className="rounded-md border border-border px-2 py-1 text-[11px] font-medium text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
