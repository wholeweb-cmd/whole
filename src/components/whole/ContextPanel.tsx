import { usePrivy } from "@privy-io/react-auth";
import { Wallet, Bell, Copy, Clock, Fuel } from "lucide-react";

import { Card } from "./Card";
import { useNativeBalance } from "@/hooks/useNativeBalance";
import { useWalletAddress } from "@/hooks/useWalletAddress";
import { useGasPrice } from "@/hooks/useGasPrice";
import { useActivityStore } from "@/lib/store/activityStore";

function timeAgo(timestamp: number) {
  const seconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h`;
}

export function ContextPanel() {
  const { authenticated } = usePrivy();
  const { address, isLoading: walletLoading } = useWalletAddress();
  const balance = useNativeBalance(address);

  const gasPrice = useGasPrice();
  const entries = useActivityStore((s) => s.entries);

  const pending = entries.filter((e) => e.status === "pending");
  const latest = entries[0];

  const addressLabel = address ?? "";
  const short =
    addressLabel.length > 10
      ? `${addressLabel.slice(0, 6)}...${addressLabel.slice(-4)}`
      : addressLabel;

  const gasNumber = Number(gasPrice);

  return (
    <aside className="hidden w-80 shrink-0 flex-col gap-5 overflow-y-auto border-l border-border bg-background p-5 xl:flex">
      <Card title="Wallet Summary">
        {authenticated ? (
          <>
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface-raised">
                <Wallet className="h-4 w-4 text-primary" />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="text-xs font-medium text-foreground">WHOLE Wallet</span>
                <span className="flex items-center gap-1.5 truncate font-mono text-[11px] text-muted-foreground">
                  {short} <Copy className="h-2.5 w-2.5" />
                </span>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] text-muted-foreground">Native Balance</span>
                <span className="font-mono text-sm font-semibold text-foreground">
                  {walletLoading || balance.isLoading ? "…" : balance.value.toFixed(4)} ETH
                </span>
              </div>
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">Connect your wallet to see your balance.</p>
        )}
      </Card>

      <Card
        title="Pending Transactions"
        action={<span className="font-mono text-[10px] text-primary">{pending.length} active</span>}
      >
        {pending.length === 0 ? (
          <p className="text-xs text-muted-foreground">No pending transactions.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {pending.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-border bg-surface-raised">
                  <Clock className="h-3 w-3 text-primary" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-xs font-medium text-foreground">
                    {p.type}: {p.detail}
                  </span>
                  {p.hash && (
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {p.hash.slice(0, 6)}...{p.hash.slice(-4)}
                    </span>
                  )}
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {timeAgo(p.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Gas Price">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface-raised">
              <Fuel className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-lg font-semibold tracking-tight text-foreground">
                {gasPrice}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                gwei
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 font-mono text-[10px] text-muted-foreground">
            <span>Slow · {(gasNumber * 0.9).toFixed(3)}</span>
            <span className="text-foreground">Std · {gasNumber.toFixed(3)}</span>
            <span>Fast · {(gasNumber * 1.2).toFixed(3)}</span>
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-3">
        <Card title="Latest Notification">
          {latest ? (
            <div className="flex gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-surface-raised">
                <Bell className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="text-xs font-medium text-foreground">
                  {latest.type}{" "}
                  {latest.status === "success"
                    ? "completed"
                    : latest.status === "error"
                      ? "failed"
                      : "pending"}
                </span>
                <span className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                  {latest.detail}
                </span>
                <span className="mt-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  {timeAgo(latest.timestamp)} ago
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No notifications yet.</p>
          )}
        </Card>
        <a
          href="https://x.com/wholedex"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open WHOLE on X"
          title="WHOLE on X"
          className="ml-5 inline-grid h-9 w-9 place-items-center rounded-lg border border-foreground/15 bg-foreground text-background shadow-sm transition-colors hover:border-primary hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
        >
          <span aria-hidden="true" className="font-sans text-base font-bold leading-none">
            𝕏
          </span>
        </a>
      </div>
    </aside>
  );
}
