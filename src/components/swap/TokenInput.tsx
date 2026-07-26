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

function formatBalance(value: number, raw: bigint) {
  if (raw === 0n) return "0.0000";
  if (value > 0 && value < 0.0001) return "<0.0001";
  return value.toLocaleString(undefined, { maximumFractionDigits: 4 });
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
  const balanceText = balance.isError ? "—" : formatBalance(balance.value, balance.raw);

  return (
    <div className="surface-tile rounded-lg border border-border bg-background/40 p-5 font-mono transition-colors focus-within:border-border-strong">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">
            bal{" "}
            {balance.isLoading ? (
              <span className="balance-skeleton inline-block h-2.5 w-12 rounded-sm align-middle" />
            ) : (
              <span key={balanceText} className="live-number">
                {balanceText}
              </span>
            )}
          </span>
          {showMax && !readonly && balance.raw > 0n && (
            <button
              type="button"
              // The exact string, not the rounded display value - rounding up
              // would ask the router to spend more than the wallet holds.
              onClick={() => onAmountChange(balance.exact)}
              className="rounded-full border border-border px-2.5 py-1 text-[10px] font-semibold text-primary transition hover:border-primary hover:bg-primary/10"
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
          className="surface-tile flex shrink-0 items-center gap-2 rounded-full border border-border bg-surface-raised px-3.5 py-2 transition hover:border-primary/60"
        >
          <TokenIcon
            symbol={token?.symbol ?? "?"}
            name={token?.name}
            logo={token?.logo}
            size={22}
          />
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
