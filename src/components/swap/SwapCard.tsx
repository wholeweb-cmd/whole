import { useEffect, useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";

import { useSwapTokens } from "@/hooks/useSwapTokens";
import { useSwapQuote } from "@/hooks/useSwapQuote";
import { useSwapExecute } from "@/hooks/useSwapExecute";
import { useSwapBalances } from "@/hooks/useSwapBalances";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { useSwapPreviewStore } from "@/lib/store/swapPreviewStore";
import { SERVICE_FEE_PERCENT } from "@/lib/config/swapFee";
import { getToken } from "@/lib/tokens/index";
import { routeLabel, type SwapToken } from "@/lib/uniswap/route";

import { TokenInput } from "./TokenInput";
import { SwapButton } from "./SwapButton";
import { SwapSettings } from "./SwapSettings";

// A stable key for a token: "eth" for native, else the contract address. The
// live token object is always re-derived from the current list by this key, so
// prices/fees that arrive after selection update the form instead of going stale.
function keyOf(token: SwapToken) {
  return token.isNative ? "eth" : token.address.toLowerCase();
}

function findByKey(tokens: SwapToken[], key: string | null): SwapToken | null {
  if (!key) return null;
  return tokens.find((t) => keyOf(t) === key) ?? null;
}

export function SwapCard() {
  const { authenticated, login } = usePrivy();
  const { tokens } = useSwapTokens();

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

  const fromToken = fromSelection;
  const toToken = toSelection;
  const nativePrice = tokens.find((token) => token.isNative)?.price ?? null;

  const {
    out,
    grossOut,
    serviceFee,
    loading: quoting,
    route,
    noRoute,
    source,
    estimate,
    networkFeeEth,
    networkFeeUsd,
    alternatives,
  } = useSwapQuote(fromToken, toToken, fromAmount, nativePrice);

  const { execute, step, error, reset } = useSwapExecute();
  const swapBalances = useSwapBalances(tokens);
  const balance = swapBalances.getBalance(fromToken);

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

  // Publish the live route for the Route Preview card beside this form. Native
  // ETH routes as WETH under the hood, so the wrap/unwrap legs are spelled out
  // here rather than left implicit in the pool path.
  const { path, hopLabels } = useMemo(() => {
    if (!route || !fromToken || !toToken)
      return { path: [] as string[], hopLabels: [] as string[] };

    const nodes = route.nodes.map(symbolFor);
    const labels = route.fees.map((fee) => `${(fee / 10_000).toFixed(2)}% pool`);

    if (fromToken.isNative) {
      nodes.unshift("ETH");
      labels.unshift("wrap");
    }
    if (toToken.isNative) {
      nodes.push("ETH");
      labels.push("unwrap");
    }

    return { path: nodes, hopLabels: labels };
  }, [route, fromToken, toToken, symbolFor]);

  const publishPreview = useSwapPreviewStore((s) => s.publish);
  const clearPreview = useSwapPreviewStore((s) => s.clear);

  const pathKey = path.join(">");
  const hopKey = hopLabels.join("|");

  useEffect(() => {
    publishPreview({
      path,
      hopLabels,
      fromSymbol: fromToken?.symbol ?? null,
      toSymbol: toToken?.symbol ?? null,
      amountIn: fromAmount,
      amountOut: out,
      grossAmountOut: grossOut,
      serviceFee,
      midOut: estimate,
      quoteSource: source,
      slippage,
      status: !fromToken || !toToken ? "idle" : noRoute ? "noRoute" : quoting ? "quoting" : "ready",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pathKey,
    hopKey,
    fromToken?.symbol,
    toToken?.symbol,
    fromAmount,
    out,
    grossOut,
    serviceFee,
    estimate,
    source,
    slippage,
    noRoute,
    quoting,
  ]);

  useEffect(() => () => clearPreview(), [clearPreview]);

  const insufficient = Number(fromAmount || 0) > balance.value;
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
      grossAmountOut: grossOut,
      slippage,
      route,
    });
  }

  let label = "Swap";
  if (!authenticated) label = "Connect Wallet";
  else if (!fromToken || !toToken) label = "Select tokens";
  else if (quoting) label = "Finding best route…";
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
    quoting ||
    !route ||
    noRoute ||
    empty ||
    insufficient ||
    loading;

  const rate =
    Number(fromAmount) > 0 && Number(out) > 0
      ? (Number(out) / Number(fromAmount)).toLocaleString(undefined, { maximumFractionDigits: 6 })
      : null;

  return (
    <div className="surface-panel mx-auto w-full max-w-lg overflow-hidden rounded-xl border border-border">
      <div className="surface-head flex items-center justify-between border-b border-border px-5 py-3">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-primary">
          ▍ Swap
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {tokens.length > 0 ? `${tokens.length} tokens` : "loading…"}
        </span>
      </div>

      <div className="p-6">
        <TokenInput
          label="From"
          token={fromToken}
          tokens={tokens}
          amount={fromAmount}
          onAmountChange={setFromAmount}
          onChange={(t) => setFromKey(keyOf(t))}
          usdValue={fromUsd}
          showMax
          balance={balance}
          getBalance={swapBalances.getBalance}
          onRefreshBalance={() => void swapBalances.refresh()}
        />

        <div className="my-3 flex justify-center">
          <button
            type="button"
            onClick={reverse}
            aria-label="Reverse swap direction"
            className="glow-primary-hover grid h-10 w-10 place-items-center rounded-full border border-border bg-surface-raised text-primary hover:border-primary/60 hover:bg-primary/10"
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
          balance={swapBalances.getBalance(toToken)}
          getBalance={swapBalances.getBalance}
          onRefreshBalance={() => void swapBalances.refresh()}
        />

        <div className="surface-tile mt-4 space-y-2.5 rounded-lg border border-border bg-background/40 p-5 font-mono text-xs [&_span:last-child]:tabular-nums">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Rate {source === "price" ? "(est.)" : source === "onchain" ? "(live)" : ""}
            </span>
            <span>
              {rate && fromToken && toToken
                ? `1 ${fromToken.symbol} = ${rate} ${toToken.symbol}`
                : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Route</span>
            <span className="text-right text-primary">
              {route ? routeLabel(route, symbolFor) : "—"}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Network fee (est.)</span>
            <span className="text-right">
              {networkFeeEth == null
                ? "—"
                : `~${networkFeeEth.toFixed(6)} ETH${
                    networkFeeUsd == null ? "" : ` / $${networkFeeUsd.toFixed(4)}`
                  }`}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">
              Service fee ({SERVICE_FEE_PERCENT.toFixed(2)}%)
            </span>
            <span className="text-right">
              {Number(serviceFee) > 0 && toToken
                ? `${Number(serviceFee).toLocaleString(undefined, {
                    maximumSignificantDigits: 6,
                  })} ${toToken.symbol}`
                : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Route search</span>
            <span>{alternatives > 0 ? `Best of ${alternatives}` : "—"}</span>
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
