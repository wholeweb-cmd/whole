import { usePrivy } from "@privy-io/react-auth";

import { usePortfolioData } from "@/hooks/usePortfolioData";
import { TokenIcon } from "@/components/markets/TokenIcon";

function fmtUSD(v: number | null | undefined) {
  if (v == null) return "—";
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function PortfolioCard() {
  const { authenticated, login } = usePrivy();
  const { data: portfolio, isLoading } = usePortfolioData();

  if (!authenticated) {
    return (
      <div className="border border-border bg-card">
        <div className="border-b border-border bg-[#0b0d11] px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-primary">
          ▍ Portfolio
        </div>
        <div className="p-6 text-center font-mono">
          <p className="text-sm text-muted-foreground">Wallet not connected</p>
          <button
            onClick={login}
            className="mt-4 bg-primary px-4 py-2 text-sm font-semibold uppercase text-black transition hover:opacity-90"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  const held = (portfolio?.assets ?? []).filter((a) => a.amount > 0);

  return (
    <div className="border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border bg-[#0b0d11] px-4 py-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-primary">
          ▍ Portfolio Value
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          claimable fees {fmtUSD(portfolio?.claimableFeesUSD)}
        </span>
      </div>

      <div className="p-5 font-mono">
        <div className="text-4xl font-bold tabular-nums">
          {isLoading && !portfolio ? "…" : fmtUSD(portfolio?.totalValue ?? 0)}
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <div className="mb-2 grid grid-cols-[1fr_auto_auto] gap-4 text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>Asset</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Value</span>
          </div>

          {held.length === 0 && (
            <p className="py-3 text-xs text-muted-foreground">
              No token balances yet on this wallet.
            </p>
          )}

          <div className="divide-y divide-border/60">
            {held.map((token) => (
              <div
                key={token.symbol}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-4 py-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <TokenIcon symbol={token.symbol} size={24} />
                  <div>
                    <div className="text-sm font-medium">{token.symbol}</div>
                    <div className="text-[10px] text-muted-foreground">{token.name}</div>
                  </div>
                </div>
                <div className="text-right text-xs tabular-nums text-muted-foreground">
                  {token.amount.toFixed(4)}
                </div>
                <div className="w-20 text-right text-sm tabular-nums">{fmtUSD(token.value)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
