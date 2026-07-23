import { Settings } from "lucide-react";

interface Props {
  slippage: number;
  onSlippageChange(value: number): void;
}

export function SwapSettings({ slippage, onSlippageChange }: Props) {
  return (
    <div className="mt-3 border border-border bg-background p-4 font-mono">
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
            className={`px-3 py-1.5 text-sm transition ${
              slippage === v
                ? "bg-primary text-black"
                : "border border-border hover:border-primary"
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
          className="w-20 border border-border bg-transparent px-2 tabular-nums outline-none focus:border-primary/60"
        />
      </div>
    </div>
  );
}
