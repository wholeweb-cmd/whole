import { ArrowRightLeft, Droplets, Minus, Coins } from "lucide-react";

import { Card } from "./Card";
import { useActivityStore, type ActivityType } from "@/lib/store/activityStore";

const ICONS: Record<ActivityType, typeof ArrowRightLeft> = {
  Swap: ArrowRightLeft,
  "Add Liquidity": Droplets,
  "Remove Liquidity": Minus,
  "Claim Fees": Coins,
};

function timeAgo(timestamp: number) {
  const seconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

export function RecentActivity() {
  const entries = useActivityStore((s) => s.entries);

  return (
    <Card title="Recent Activity">
      {entries.length === 0 ? (
        <p className="py-3 text-xs text-muted-foreground">
          No activity yet this session. Swap or add liquidity to see it show up here.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {entries.map((a) => {
            const Icon = ICONS[a.type];
            return (
              <div key={a.id} className="flex items-center gap-4 py-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-sm border border-border bg-background text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-xs font-medium text-foreground">{a.type}</span>
                  <span className="truncate text-[11px] text-muted-foreground">{a.detail}</span>
                </div>
                <div className="hidden flex-col items-end sm:flex">
                  <span
                    className={`font-mono text-xs ${
                      a.status === "success"
                        ? "text-primary"
                        : a.status === "error"
                          ? "text-red-400"
                          : "text-muted-foreground"
                    }`}
                  >
                    {a.status}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{timeAgo(a.timestamp)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
