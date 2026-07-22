import { Card } from "./Card";
import { ArrowUpRight, ArrowDownLeft, Repeat, Droplets } from "lucide-react";

const activity = [
  { type: "Swap", icon: Repeat, detail: "120 USDG → 0.034 ETH", time: "2m ago", amount: "$120.00" },
  { type: "Add Liquidity", icon: Droplets, detail: "ETH / USDG Pool", time: "18m ago", amount: "$4,200.00" },
  { type: "Claim Fees", icon: ArrowDownLeft, detail: "SOL / USDG Position", time: "1h ago", amount: "$88.10" },
  { type: "Send", icon: ArrowUpRight, detail: "To 0x9a...42fb", time: "3h ago", amount: "$1,000.00" },
  { type: "Swap", icon: Repeat, detail: "0.5 BTC → 32,240 USDG", time: "1d ago", amount: "$32,240.00" },
];

export function RecentActivity() {
  return (
    <Card
      title="Recent Activity"
      action={
        <button className="text-[11px] font-medium text-muted-foreground hover:text-foreground">
          View all
        </button>
      }
    >
      <div className="divide-y divide-border">
        {activity.map((a, i) => {
          const Icon = a.icon;
          return (
            <div key={i} className="flex items-center gap-4 py-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-sm border border-border bg-background text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-xs font-medium text-foreground">{a.type}</span>
                <span className="truncate text-[11px] text-muted-foreground">{a.detail}</span>
              </div>
              <div className="hidden flex-col items-end sm:flex">
                <span className="font-mono text-xs text-foreground">{a.amount}</span>
                <span className="text-[11px] text-muted-foreground">{a.time}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}