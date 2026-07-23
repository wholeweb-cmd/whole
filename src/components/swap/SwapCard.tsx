import { useEffect, useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";

import { useSwapTokens } from "@/hooks/useSwapTokens";
import { useSwapQuote } from "@/hooks/useSwapQuote";
import { useSwapExecute } from "@/hooks/useSwapExecute";
import { useSwapBalance } from "@/hooks/useSwapBalance";
import { useResolvedToken } from "@/hooks/useResolvedToken";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { getToken } from "@/lib/tokens/index";
import { routeLabel, type SwapToken } from "@/lib/uniswap/route";

import { TokenInput } from "./TokenInput";
import { SwapButton } from "./SwapButton";
import { SwapSettings } from "./SwapSettings";

// A stable key for a token: "eth" for native, else the contract address. The
// live token object is always re-derived from the current list by this key, so
// prices/fees that arrive after selection flow through instead of going stale.
function keyOf(token: SwapToken) {
  return token.isNative ? "eth" : token.address.toLowerCase();
}

function findByKey(tokens: SwapToken[], key: string | null): SwapToken | null {
  if (!key) return null;
  return tokens.find((t) => keyOf(t) === key) ?? null;
}

export function SwapCard() {
  const { authenticated, login } = usePrivy();
  const { tokens, wethFee } = useSwapTokens();

  const [fromKey, setFromKey] = useState<string | null>(null);
  const [toKey, setToKey] = useState<string | null>(null);
  const [fromAmount, setFromAmount] = useState("");

  const defaultSlippage = useSettingsStore((s) => s.defaultSlippage);
  const [slippage, setSlippage] = useState(defaultSlippage);

  // Seed default keys (ETH → USDG) once the token list loads.
  useEffect(() => {
    if (!fromKey && tokens.length) setFromKey("eth");
    if (!toKey && tokens.length) setToKey(getToken("USDG")?.address.toLowerCase() ?? null);
  }, [tokens, fromKey, toKey]);

  // Re-derive the live token by key every render so prices/fees that load after
  // selection are always reflected (never a stale, unpriced snapshot).
  const fromSelection = findByKey(tokens, fromKey);
  const toSelection = findByKey(tokens, toKey);

  // Most tokens arrive without a discovered pool fee - resolve it on demand so
  // any token pair becomes routable/swappable.
  const fromToken = useResolvedToken(fromSelection);
  const toToken = useResolvedToken(toSelection);

  const resolving =
    (fromSelection != null && fromToken?.feeTier == null && fromSelection.symbol !== "USDG") ||
    (toSelection != null && toToken?.feeTier == null && toSelection.symbol !== "USDG");

  const { out, loading: quoting, route, noRoute, source } = useSwapQuote(
    fromToken,
    toToken,
    fromAmount,
    wethFee,
  );

  const { execute, step, error, reset } = useSwapExecute();
  const balance = useSwapBalance(fromToken);

  useEffect(() => {
    if (step !== "idle") reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromToken?.address, toToken?.address, fromAmount]);

  function reverse() {
    setFromKey(toKey);
    setToKey(fromKey);
    setFromAmount("");
    reset();
  }

  const symbolFor = useMemo(() => {
    const map = new Map(tokens.map((t) => [t.address.toLowerCase(), t.symbol]));
    return (addr: string) => map.get(addr.toLowerCase()) ?? `${addr.slice(0, 6)}…`;
  }, [tokens]);

  const insufficient = Number(fromAmount || 0) > balance;
  const empty = Number(fromAmount || 0) <= 0;
  const loading = step === "approving" || step === "swapping";

  const fromUsd = fromToken?.price != null ? Number(fromAmount || 0) * fromToken.price : null;
  const toUsd = toToken?.price != null ? Number(out || 0) * toToken.price : null;

  async function handleSwap() {
    if (!fromToken || !toToken || !route) return;
    await execute({
      tokenIn: fromToken,
      tokenOut: toToken,
      amountIn: fromAmount,
      amountOut: out,
      slippage,
      route,
    });
  }

  let label = "Swap";
  if (!authenticated) label = "Connect Wallet";
  else if (!fromToken || !toToken) label = "Select tokens";
  else if (resolving) label = "Finding route…";
  else if (noRoute) label = "No route found";
  else if (empty) label = "Enter amount";
  else if (insufficient) label = "Insufficient balance";
  else if (step === "approving") label = `Approving ${fromToken.symbol}…`;
  else if (step === "swapping") label = "Swapping…";
  else if (step === "success") label = "Swapped ✓";
  else if (step === "error") label = "Try again";

  const disabled =
    !authenticated ||
    !fromToken ||
    !toToken ||
    resolving ||
    noRoute ||
    empty ||
    insufficient ||
    loading;

  const rate =
    Number(fromAmount) > 0 && Number(out) > 0
      ? (Number(out) / Number(fromAmount)).toLocaleString(undefined, { maximumFractionDigits: 6 })
      : null;

  return (
    <div className="mx-auto w-full max-w-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border bg-[#0b0d11] px-4 py-2">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-primary">
          ▍ Swap
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {tokens.length > 0 ? `${tokens.length} tokens` : "loading…"}
        </span>
      </div>

      <div className="p-5">
        <TokenInput
          label="From"
          token={fromToken}
          tokens={tokens}
          amount={fromAmount}
          onAmountChange={setFromAmount}
          onChange={(t) => setFromKey(keyOf(t))}
          usdValue={fromUsd}
          showMax
        />

        <div className="my-2 flex justify-center">
          <button
            type="button"
            onClick={reverse}
            className="border border-border bg-background p-2 text-primary transition hover:border-primary"
          >
            ↕
          </button>
        </div>

        <TokenInput
          label="To"
          token={toToken}
          tokens={tokens}
          amount={quoting ? "…" : out === "0" ? "" : out}
          onAmountChange={() => {}}
          onChange={(t) => setToKey(keyOf(t))}
          usdValue={toUsd}
          readonly
        />

        <div className="mt-3 space-y-2 border border-border bg-background p-4 font-mono text-xs [&_span:last-child]:tabular-nums">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Rate {source === "price" ? "(est.)" : source === "onchain" ? "(live)" : ""}
            </span>
            <span>
              {rate && fromToken && toToken ? `1 ${fromToken.symbol} = ${rate} ${toToken.symbol}` : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Route</span>
            <span className="text-primary">{route ? routeLabel(route, symbolFor) : "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Min received ({slippage}%)</span>
            <span>
              {Number(out) > 0 && toToken
                ? `${(Number(out) * (1 - slippage / 100)).toFixed(4)} ${toToken.symbol}`
                : "—"}
            </span>
          </div>
        </div>

        <SwapSettings slippage={slippage} onSlippageChange={setSlippage} />

        {error && <p className="mt-3 font-mono text-xs text-red-400">{error.slice(0, 160)}</p>}

        <SwapButton
          disabled={disabled}
          loading={loading}
          label={label}
          onClick={authenticated ? handleSwap : login}
        />
      </div>
    </div>
  );
}
