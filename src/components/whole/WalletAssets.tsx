import { usePrivy } from "@privy-io/react-auth";
import { Wallet } from "lucide-react";

import { TokenIcon } from "@/components/markets/TokenIcon";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import { formatPrice, formatUSD } from "@/lib/format";
import { Card } from "./Card";

export function WalletAssets() {
  const { authenticated, login } = usePrivy();
  const { data: portfolio, isLoading, isError } = usePortfolioData();

  const assets = [...(portfolio?.assets ?? [])]
    .filter((asset) => asset.amount > 0)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
    .slice(0, 4);
  const spendableValue = isError && !portfolio ? "—" : formatUSD(portfolio?.totalValue ?? 0);

  return (
    <Card title="Wallet Assets">
      {!authenticated ? (
        <div className="flex min-h-52 flex-col items-center justify-center text-center">
          <Wallet className="mb-3 h-6 w-6 text-primary" />
          <p className="text-sm font-medium text-foreground">See what your wallet can use</p>
          <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
            Connect to view live balances, values, and available assets.
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
          <div className="mb-4 flex items-end justify-between border-b border-border pb-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Spendable value
              </p>
              <p className="mt-1 font-mono text-3xl font-semibold tracking-tight text-foreground">
                {isLoading && !portfolio ? (
                  "…"
                ) : (
                  <span key={spendableValue} className="live-number">
                    {spendableValue}
                  </span>
                )}
              </p>
            </div>
            <p className="font-mono text-[10px] text-muted-foreground">
              {assets.length} held asset{assets.length === 1 ? "" : "s"}
            </p>
          </div>

          {isLoading && !portfolio && (
            <p className="py-6 text-center text-xs text-muted-foreground">
              Reading wallet balances…
            </p>
          )}

          {isError && !portfolio && (
            <p className="py-6 text-center text-xs text-muted-foreground">
              Balance is temporarily unavailable. It will refresh automatically.
            </p>
          )}

          {!isLoading && !isError && assets.length === 0 && (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No supported token balances found on this wallet.
            </p>
          )}

          <div className="divide-y divide-border">
            {assets.map((asset) => (
              <div key={asset.symbol} className="flex items-center gap-3 py-3">
                <TokenIcon symbol={asset.symbol} name={asset.name} logo={asset.logo} size={30} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-foreground">{asset.symbol}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {asset.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })} ·{" "}
                    {formatPrice(asset.price)}
                  </p>
                </div>
                <p className="font-mono text-xs font-semibold tabular-nums text-foreground">
                  {formatUSD(asset.value)}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
