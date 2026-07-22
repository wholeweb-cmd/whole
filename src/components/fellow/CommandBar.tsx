import { useState } from "react";
import { Command, CornerDownLeft, ArrowRight } from "lucide-react";

const suggestions = [
  "Swap 100 USDG to ETH",
  "Add liquidity to ETH/USDG",
  "Claim all fees",
  "Find highest APR pools",
];

export function CommandBar() {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3">
        {focused && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setValue(s);
                }}
                className="flex items-center gap-2 rounded-sm border border-border bg-card px-2.5 py-1.5 text-[11px] text-muted-foreground hover:border-primary hover:text-foreground"
              >
                <ArrowRight className="h-3 w-3 text-primary" />
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3 border border-border bg-card px-4 py-3">
          <Command className="h-4 w-4 text-primary" />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 120)}
            placeholder="Ask Fellow..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="hidden rounded-sm border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
            ⌘K
          </kbd>
          <button
            disabled={!value}
            className="flex items-center gap-1.5 rounded-sm bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground disabled:opacity-40"
          >
            Run <CornerDownLeft className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}