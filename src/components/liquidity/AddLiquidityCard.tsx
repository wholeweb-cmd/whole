import { useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { ChevronDown, Droplets, Info } from "lucide-react";

import { useSwapTokens } from "@/hooks/useSwapTokens";
import { useResolvedToken } from "@/hooks/useResolvedToken";
import { useMarkets } from "@/hooks/useMarkets";
import { useLiquidity } from "@/hooks/useLiquidity";
import { useLiquidityPositions } from "@/hooks/useLiquidityPositions";
import { useSwapBalance } from "@/hooks/useSwapBalance";
import { TokenSelector } from "@/components/swap/TokenSelector";
import { TokenIcon } from "@/components/markets/TokenIcon";
import type { SwapToken } from "@/lib/uniswap/route";

const FEE_LABELS: Record<number, string> = {
  100: "0.01%",
  500: "0.05%",
  3000: "0.30%",
  10000: "1.00%",
};

function usd(n: number | null | undefined) {
  if (n == null) return "—";
  if (n >= 1000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (n >= 1) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  return `$${n.toPrecision(3)}`;
}

/** A pool-deposit interface: pick a pool, deposit both sides in ratio, own a share, earn fees. */
export function AddLiquidityCard() {
  const { authenticated, login } = usePrivy();
  const { tokens } = useSwapTokens();
  const { data: markets } = useMarkets();
  const { refresh } = useLiquidityPositions();
  const { addLiquidity, step, error, reset } = useLiquidity();

  const [tokenKey, setTokenKey] = useState<string | null>(null);
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  // Base side: real ERC20s only (native ETH can't be held by the position
  // manager - WETH is used instead), and not USDG (that's the quote side).
  const baseTokens = useMemo(
    () => tokens.filter((t) => !t.isNative && t.symbol !== "USDG"),
    [tokens],
  );

  const selected = useMemo(
    () =>
      baseTokens.find((t) => t.address.toLowerCase() === tokenKey) ??
      baseTokens.find((t) => t.symbol === "WETH") ??
      baseTokens[0] ??
      null,
    [baseTokens, tokenKey],
  );

  // Resolve the token's real pool: fee tier + which asset it pools against.
  const resolved = useResolvedToken(selected);
  const quoteSymbol = resolved?.quoteSymbol ?? "USDG";
  const quote: SwapToken | null = useMemo(
    () =>
      tokens.find((t) => t.symbol === quoteSymbol && !t.isNative) ??
      tokens.find((t) => t.symbol === "USDG") ??
      null,
    [tokens, quoteSymbol],
  );
  const fee = resolved?.feeTier ?? null;
  const resolving = selected != null && fee == null;

  // Live pool economics from market data.
  const market = useMemo(
    () => markets?.find((m) => selected && m.address.toLowerCase() === selected.address.toLowerCase()),
    [markets, selected],
  );
  const tvl = market?.tvl ?? null;
  const volume24h = market?.volume24h ?? null;
  const feeRate = fee != null ? fee / 1_000_000 : 0;
  const aprPct =
    tvl && tvl > 0 && volume24h != null ? (volume24h * feeRate * 365 * 100) / tvl : null;

  const balanceA = useSwapBalance(selected);
  const balanceB = useSwapBalance(quote);

  const depositUSD =
    (selected?.price != null ? Number(amountA || 0) * selected.price : 0) +
    (quote?.price != null ? Number(amountB || 0) * quote.price : 0);
  const poolSharePct =
    tvl != null && depositUSD > 0 ? (depositUSD / (tvl + depositUSD)) * 100 : null;

  const loading = step === "approving" || step === "submitting";

  // Both sides are deposited at the pool's current price ratio.
  function onAmountA(v: string) {
    setAmountA(v);
    reset();
    const n = Number(v);
    if (n > 0 && selected?.price != null && quote?.price != null && quote.price > 0) {
      setAmountB(((n * selected.price) / quote.price).toFixed(6));
    } else if (!v) {
      setAmountB("");
    }
  }

  async function handleSubmit() {
    if (!authenticated) return login();
    if (!selected || !quote || fee == null) return;
    await addLiquidity({
      tokenASymbol: selected.symbol,
      tokenAAddress: selected.address,
      tokenBSymbol: quote.symbol,
      tokenBAddress: quote.address,
      amountA,
      amountB,
      fee,
      decimalsA: selected.decimals,
      decimalsB: quote.decimals,
    });
    refresh();
  }

  let label = "Add to Pool";
  if (!authenticated) label = "Connect Wallet";
  else if (!selected) label = "Select a pool";
  else if (resolving) label = "Finding pool…";
  else if (fee == null) label = "No pool for this token";
  else if (!amountA || !amountB) label = "Enter deposit amounts";
  else if (Number(amountA) > balanceA) label = `Insufficient ${selected.symbol}`;
  else if (Number(amountB) > balanceB) label = `Insufficient ${quote?.symbol}`;
  else if (step === "approving") label = "Approving…";
  else if (step === "submitting") label = "Depositing…";
  else if (step === "success") label = "Deposited ✓";
  else if (step === "error") label = "Try again";

  const disabled =
    !authenticated ||
    !selected ||
    !quote ||
    resolving ||
    fee == null ||
    !amountA ||
    !amountB ||
    Number(amountA) > balanceA ||
    Number(amountB) > balanceB ||
    loading ||
    step === "success";

  return (
    <div className="w-full border border-border bg-card font-mono">
      <div className="flex items-center justify-between border-b border-border bg-[#0b0d11] px-4 py-2">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-primary">
          <Droplets className="h-3 w-3" /> Provide Liquidity
        </span>
      </div>

      <div className="p-5">
        {/* Pool selector */}
        <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted-foreground">
          1 · Choose a pool
        </label>
        <button
          type="button"
          onClick={() => setPickerOpen((o) => !o)}
          className="flex w-full items-center justify-between border border-border bg-background px-3 py-3 transition hover:border-primary"
        >
          <span className="flex items-center gap-2">
            <span className="flex items-center">
              <TokenIcon symbol={selected?.symbol ?? "?"} logo={selected?.logo} size={26} />
              <span className="-ml-2">
                <TokenIcon symbol={quote?.symbol ?? "?"} logo={quote?.logo} size={26} />
              </span>
            </span>
            <span className="text-sm font-semibold">
              {selected?.symbol ?? "Select"} / {quote?.symbol ?? "—"}
            </span>
            {fee != null && (
              <span className="border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                {FEE_LABELS[fee] ?? `${fee}`}
              </span>
            )}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
        {pickerOpen && (
          <div className="mt-2">
            <TokenSelector
              tokens={baseTokens}
              onSelect={(t) => {
                setTokenKey(t.address.toLowerCase());
                setPickerOpen(false);
                setAmountA("");
                setAmountB("");
                reset();
              }}
            />
          </div>
        )}

        {/* Pool stats */}
        <div className="mt-3 grid grid-cols-3 gap-px overflow-hidden border border-border bg-border text-center">
          <div className="bg-background px-2 py-2.5">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Price</div>
            <div className="mt-0.5 text-xs tabular-nums">
              {selected?.price != null ? usd(selected.price) : "—"}
            </div>
          </div>
          <div className="bg-background px-2 py-2.5">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Pool TVL</div>
            <div className="mt-0.5 text-xs tabular-nums">{usd(tvl)}</div>
          </div>
          <div className="bg-background px-2 py-2.5">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Est. APR</div>
            <div className="mt-0.5 text-xs tabular-nums text-primary">
              {aprPct != null ? `${aprPct.toFixed(1)}%` : "—"}
            </div>
          </div>
        </div>

        {/* Deposit amounts */}
        <label className="mb-1.5 mt-4 block text-[10px] uppercase tracking-widest text-muted-foreground">
          2 · Deposit both tokens
        </label>
        <div className="space-y-2">
          <div className="border border-border bg-background p-3">
            <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{selected?.symbol ?? "Token"}</span>
              <button
                type="button"
                onClick={() => balanceA > 0 && onAmountA(String(balanceA))}
                className="uppercase tracking-widest hover:text-primary"
              >
                bal {balanceA.toFixed(4)}
              </button>
            </div>
            <input
              value={amountA}
              onChange={(e) => onAmountA(e.target.value)}
              placeholder="0.00"
              inputMode="decimal"
              className="w-full bg-transparent text-xl font-semibold tabular-nums outline-none"
            />
          </div>
          <div className="border border-border bg-background p-3">
            <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{quote?.symbol ?? "Quote"}</span>
              <span className="uppercase tracking-widest">bal {balanceB.toFixed(4)}</span>
            </div>
            <input
              value={amountB}
              onChange={(e) => {
                setAmountB(e.target.value);
                reset();
              }}
              placeholder="0.00"
              inputMode="decimal"
              className="w-full bg-transparent text-xl font-semibold tabular-nums outline-none"
            />
          </div>
        </div>

        {/* What you get */}
        <div className="mt-3 space-y-1.5 border border-border bg-background p-3 text-[11px]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Deposit value</span>
            <span className="tabular-nums">{depositUSD > 0 ? usd(depositUSD) : "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Your share of pool</span>
            <span className="tabular-nums text-primary">
              {poolSharePct != null ? `${poolSharePct < 0.01 ? "<0.01" : poolSharePct.toFixed(2)}%` : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">You earn</span>
            <span className="tabular-nums">
              {fee != null ? `${FEE_LABELS[fee] ?? fee} of every swap` : "—"}
            </span>
          </div>
        </div>

        <p className="mt-3 flex gap-1.5 text-[10px] leading-relaxed text-muted-foreground">
          <Info className="mt-px h-3 w-3 shrink-0" />
          Traders swap against this pool and pay a fee. You earn a cut proportional to your share,
          for as long as you stay in. Withdraw your tokens and claim fees anytime below.
        </p>

        {error && <p className="mt-3 text-xs text-red-400">{error.slice(0, 160)}</p>}

        <button
          type="button"
          disabled={disabled}
          onClick={handleSubmit}
          className={`mt-4 w-full py-3 text-sm font-semibold uppercase tracking-wide transition ${
            disabled
              ? "cursor-not-allowed bg-muted text-muted-foreground"
              : "bg-primary text-black hover:opacity-90"
          }`}
        >
          {label}
        </button>
      </div>
    </div>
  );
}
