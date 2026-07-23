import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { TokenSelector } from "./TokenSelector";
import { TokenIcon } from "@/components/markets/TokenIcon";
import { useSwapBalance } from "@/hooks/useSwapBalance";
import type { SwapToken } from "@/lib/uniswap/route";

interface Props {
  label: string;
  token: SwapToken | null;
  tokens: SwapToken[];
  amount: string;
  onAmountChange(value: string): void;
  onChange(token: SwapToken): void;
  readonly?: boolean;
  showMax?: boolean;
  usdValue?: number | null;
}

export function TokenInput({
  label,
  token,
  tokens,
  amount,
  onAmountChange,
  onChange,
  readonly = false,
  showMax = false,
  usdValue,
}: Props) {
  const [open, setOpen] = useState(false);
  const balance = useSwapBalance(token);

  return (
    <div className="border border-border bg-background p-4 font-mono">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">bal {balance.toFixed(4)}</span>
          {showMax && !readonly && balance > 0 && (
            <button
              type="button"
              onClick={() => onAmountChange(String(balance))}
              className="border border-border px-2 py-0.5 text-[10px] font-semibold text-primary transition hover:border-primary"
            >
              MAX
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <input
          value={amount}
          readOnly={readonly}
          onChange={(e) => onAmountChange(e.target.value)}
          placeholder="0.00"
          inputMode="decimal"
          className="w-full bg-transparent text-3xl font-semibold tabular-nums outline-none"
        />

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex shrink-0 items-center gap-2 border border-border px-3 py-2 transition hover:border-primary"
        >
          <TokenIcon symbol={token?.symbol ?? "?"} logo={token?.logo} size={22} />
          <span className="font-semibold">{token?.symbol ?? "Select"}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {usdValue != null && usdValue > 0 && (
        <div className="mt-1 text-[11px] tabular-nums text-muted-foreground">
          ≈ ${usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </div>
      )}

      {open && (
        <div className="mt-3">
          <TokenSelector
            tokens={tokens}
            onSelect={(t) => {
              onChange(t);
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
