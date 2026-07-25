import { Settings } from "lucide-react";

interface Props {
  slippage: number;
  onSlippageChange(value: number): void;
}

export function SwapSettings({ slippage, onSlippageChange }: Props) {
  return (
    <div className="surface-tile mt-4 rounded-lg border border-border bg-background/40 p-5 font-mono">
      <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
        <Settings className="h-3.5 w-3.5" />
        Slippage Tolerance
      </div>

      <div className="flex gap-2">
        {[0.1, 0.5, 1.0].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onSlippageChange(v)}
            className={`rounded-full px-4 py-1.5 text-sm transition ${
              slippage === v
                ? "glow-primary bg-primary text-primary-foreground"
                : "border border-border hover:border-primary hover:bg-primary/10"
            }`}
          >
            {v}%
          </button>
        ))}

        <input
          value={slippage}
          onChange={(e) => {
            const parsed = Number(e.target.value);
            onSlippageChange(Number.isFinite(parsed) ? parsed : 0);
          }}
          inputMode="decimal"
          className="w-20 rounded-full border border-border bg-transparent px-3 text-center tabular-nums outline-none transition focus:border-primary/60"
        />
      </div>
    </div>
  );
}
