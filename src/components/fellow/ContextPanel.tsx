import { Card } from "./Card";
import { Wallet, Bell, Copy, Clock, Fuel } from "lucide-react";

const pending = [
  { label: "Swap 500 USDG → ETH", hash: "0x9f...42a1", time: "12s" },
  { label: "Add Liquidity ETH/USDG", hash: "0x1c...88ef", time: "48s" },
];

export function ContextPanel() {
  return (
    <aside className="hidden w-80 shrink-0 flex-col gap-4 border-l border-border bg-background p-4 xl:flex">
      <Card title="Wallet Summary">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-sm border border-border">
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="text-xs font-medium text-foreground">Fellow Wallet</span>
            <span className="flex items-center gap-1.5 truncate font-mono text-[11px] text-muted-foreground">
              0x7a3f...b21e <Copy className="h-2.5 w-2.5" />
            </span>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] text-muted-foreground">Total Balance</span>
            <span className="font-mono text-sm font-semibold text-foreground">$248,192.44</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] text-muted-foreground">Spot</span>
            <span className="font-mono text-xs text-foreground">$164,860.20</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] text-muted-foreground">Liquidity</span>
            <span className="font-mono text-xs text-foreground">$83,332.24</span>
          </div>
        </div>
      </Card>
      <Card title="Current Network">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="text-xs font-medium text-foreground">Robinhood Chain</span>
          </div>
          <span className="font-mono text-[11px] text-muted-foreground">Mainnet</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Block</p>
            <p className="mt-1 font-mono text-xs text-foreground">18,204,331</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Latency</p>
            <p className="mt-1 font-mono text-xs text-foreground">124 ms</p>
          </div>
        </div>
      </Card>
      <Card
        title="Pending Transactions"
        action={<span className="font-mono text-[10px] text-primary">{pending.length} active</span>}
      >
        <div className="flex flex-col gap-3">
          {pending.map((p) => (
            <div key={p.hash} className="flex items-center gap-3">
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-sm border border-border">
                <Clock className="h-3 w-3 text-primary" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-xs font-medium text-foreground">{p.label}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{p.hash}</span>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">{p.time}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card title="Gas Price">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-sm border border-border">
              <Fuel className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-lg font-semibold tracking-tight text-foreground">
                0.42
              </span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                gwei
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 font-mono text-[10px] text-muted-foreground">
            <span>Slow · 0.38</span>
            <span className="text-foreground">Std · 0.42</span>
            <span>Fast · 0.51</span>
          </div>
        </div>
      </Card>
      <Card title="Latest Notification">
        <div className="flex gap-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-sm border border-border">
            <Bell className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="text-xs font-medium text-foreground">Position back in range</span>
            <span className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
              ETH / USDG re-entered active range. Fees now accruing.
            </span>
            <span className="mt-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              4 min ago
            </span>
          </div>
        </div>
      </Card>
    </aside>
  );
}