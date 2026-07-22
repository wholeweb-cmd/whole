import { Card } from "./Card";
import { Plus } from "lucide-react";

const positions = [
  { pair: "ETH / USDG", range: "In range", value: "$42,180", fees: "$418.20", apr: "24.8%", active: true },
  { pair: "BTC / USDG", range: "In range", value: "$28,940", fees: "$212.44", apr: "19.2%", active: true },
  { pair: "SOL / USDG", range: "Out of range", value: "$11,220", fees: "$88.10", apr: "31.4%", active: false },
];

export function LiquidityPositions() {
  return (
    <Card
      title="Liquidity Positions"
      action={
        <button className="flex items-center gap-1.5 rounded-sm border border-border px-2 py-1 text-[11px] font-medium text-foreground hover:border-primary hover:text-primary">
          <Plus className="h-3 w-3" /> New Position
        </button>
      }
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {positions.map((p) => (
          <div
            key={p.pair}
            className="flex flex-col gap-4 border border-border bg-background p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">{p.pair}</span>
              <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${p.active ? "bg-primary" : "bg-[#ef4444]"}`}
                />
                {p.range}
              </span>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Value</p>
              <p className="mt-0.5 font-mono text-lg font-semibold tracking-tight text-foreground">
                {p.value}
              </p>
            </div>
            <div className="flex items-end justify-between border-t border-border pt-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Fees</p>
                <p className="mt-0.5 font-mono text-xs text-foreground">{p.fees}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">APR</p>
                <p className="mt-0.5 font-mono text-xs text-primary">{p.apr}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}