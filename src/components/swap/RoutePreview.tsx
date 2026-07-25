import { Fragment, useMemo } from "react";
import { ArrowDownToLine, Activity, Clock, Fuel, ReceiptText, Waypoints } from "lucide-react";

import { Card } from "@/components/whole/Card";
import { TokenIcon } from "@/components/markets/TokenIcon";
import { useGasPrice } from "@/hooks/useGasPrice";
import { useBlockTime } from "@/hooks/useBlockTime";
import { useSwapTokens } from "@/hooks/useSwapTokens";
import { useSwapPreviewStore } from "@/lib/store/swapPreviewStore";
import { UNISWAP } from "@/lib/uniswap/addresses";
import { CHAIN } from "@/lib/config/chain";
import { SERVICE_FEE_PERCENT } from "@/lib/config/swapFee";

// Gas for the router calls in useSwapExecute. The exact cost is only known
// when the wallet simulates the signed transaction, so these are the typical
// figures for a Uniswap V3 router and the row is labelled an estimate.
const BASE_GAS = 150_000;
const EXTRA_HOP_GAS = 60_000;
const NATIVE_LEG_GAS = 30_000;

function feeToneOf(impact: number | null) {
  if (impact == null) return "text-muted-foreground";
  if (impact >= 3) return "text-red-400";
  if (impact >= 1) return "text-yellow-400";
  return "text-primary";
}

function DetailRow({
  icon: Icon,
  label,
  value,
  tone = "text-foreground",
  hint,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  tone?: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className="flex flex-col items-end">
        <span className={`tabular-nums ${tone}`}>{value}</span>
        {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
      </span>
    </div>
  );
}

export function RoutePreview() {
  const {
    path,
    hopLabels,
    toSymbol,
    amountIn,
    amountOut,
    grossAmountOut,
    serviceFee,
    midOut,
    quoteSource,
    slippage,
    status,
  } = useSwapPreviewStore();

  const gasPrice = useGasPrice();
  const blockTime = useBlockTime();
  const { tokens } = useSwapTokens();

  const tokenFor = useMemo(() => {
    const map = new Map(tokens.map((token) => [token.symbol.toUpperCase(), token]));
    return (symbol: string) => map.get(symbol.toUpperCase()) ?? null;
  }, [tokens]);

  const ethPrice = tokens.find((t) => t.isNative)?.price ?? null;

  // The quoter's output against the price-implied mid-market output. Only
  // meaningful once the exact on-chain quote has landed.
  const impact = useMemo(() => {
    if (quoteSource !== "onchain") return null;
    const mid = Number(midOut);
    const actual = Number(grossAmountOut);
    if (!(mid > 0) || !(actual > 0)) return null;
    return (1 - actual / mid) * 100;
  }, [quoteSource, midOut, grossAmountOut]);

  const hops = Math.max(path.length - 1, 0);
  const nativeLegs = hopLabels.filter((l) => l === "wrap" || l === "unwrap").length;
  const poolHops = Math.max(hops - nativeLegs, 0);

  const gasUnits =
    poolHops > 0 ? BASE_GAS + (poolHops - 1) * EXTRA_HOP_GAS + nativeLegs * NATIVE_LEG_GAS : 0;
  const feeEth = gasUnits * Number(gasPrice || 0) * 1e-9;
  const feeUsd = ethPrice != null ? feeEth * ethPrice : null;

  const minReceived =
    Number(amountOut) > 0 && toSymbol
      ? `${(Number(amountOut) * (1 - slippage / 100)).toFixed(4)} ${toSymbol}`
      : "—";

  const routed = path.length >= 2;

  return (
    <Card
      title="Route Preview"
      action={
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {status === "noRoute" ? (
            <span className="text-red-400">no route</span>
          ) : status === "resolving" ? (
            "resolving…"
          ) : status === "quoting" ? (
            "quoting…"
          ) : routed ? (
            `${hops} hop${hops === 1 ? "" : "s"}`
          ) : (
            "idle"
          )}
        </span>
      }
    >
      <div className="font-mono">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Swap Route
        </p>

        {!routed ? (
          <p className="surface-tile rounded-lg border border-border bg-background/40 px-3 py-8 text-center text-xs text-muted-foreground">
            {status === "noRoute"
              ? "No route between these tokens."
              : "Select a token pair to preview its route."}
          </p>
        ) : (
          <div className="flex flex-col">
            {path.map((symbol, index) => (
              <Fragment key={`${symbol}-${index}`}>
                <div className="surface-tile flex items-center gap-3 rounded-lg border border-border bg-background/40 px-4 py-3 transition-colors hover:border-border-strong">
                  <TokenIcon
                    symbol={symbol}
                    name={tokenFor(symbol)?.name}
                    logo={tokenFor(symbol)?.logo}
                    size={22}
                  />
                  <span className="truncate text-xs font-medium text-foreground">{symbol}</span>
                  {index === 0 && (
                    <span className="ml-auto text-[10px] uppercase tracking-widest text-muted-foreground">
                      in
                    </span>
                  )}
                  {index === path.length - 1 && (
                    <span className="ml-auto text-[10px] uppercase tracking-widest text-primary">
                      out
                    </span>
                  )}
                </div>

                {index < path.length - 1 && (
                  <div className="flex items-center gap-2 py-1.5 pl-5">
                    <span className="text-primary">↓</span>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {hopLabels[index] ?? "pool"}
                    </span>
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        )}

        <div className="mt-4 divide-y divide-border border-t border-border text-xs">
          <DetailRow
            icon={Clock}
            label="Estimated Time"
            value={blockTime == null ? "—" : `~${Math.max(1, Math.round(blockTime))}s`}
            hint={blockTime == null ? undefined : "1 block confirmation"}
          />

          <DetailRow
            icon={Activity}
            label="Price Impact"
            value={
              impact == null ? "—" : `${impact >= 0 ? "" : "+"}${Math.abs(impact).toFixed(2)}%`
            }
            tone={feeToneOf(impact)}
            hint={impact == null ? "needs an on-chain quote" : "vs. mid-market price"}
          />

          <DetailRow
            icon={Fuel}
            label="Network Fee"
            value={gasUnits === 0 ? "—" : `~${feeEth.toFixed(6)} ETH`}
            hint={
              gasUnits === 0
                ? undefined
                : feeUsd != null
                  ? `≈ $${feeUsd.toFixed(4)} · ${gasPrice} gwei`
                  : `${gasPrice} gwei`
            }
          />

          <DetailRow
            icon={ReceiptText}
            label={`Service Fee (${SERVICE_FEE_PERCENT.toFixed(2)}%)`}
            value={
              Number(serviceFee) > 0 && toSymbol
                ? `${Number(serviceFee).toLocaleString(undefined, {
                    maximumSignificantDigits: 6,
                  })} ${toSymbol}`
                : "—"
            }
            hint="supports product development"
          />

          <DetailRow
            icon={ArrowDownToLine}
            label="Minimum Received"
            value={minReceived}
            hint={Number(amountOut) > 0 ? `at ${slippage}% slippage` : undefined}
          />

          <DetailRow
            icon={Waypoints}
            label="Router"
            value="WHOLE Router V2"
            tone="text-primary"
            hint={`${UNISWAP.swapRouter.slice(0, 6)}…${UNISWAP.swapRouter.slice(-4)}`}
          />
        </div>

        <p className="mt-3 border-t border-border pt-3 text-[10px] leading-relaxed text-muted-foreground">
          The output shown is net of the disclosed service fee. Network fees and impact are
          estimates from the live quote; the wallet confirms the transaction at signing.{" "}
          <a
            href={`${CHAIN.explorer}/address/${UNISWAP.swapRouter}`}
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-primary"
          >
            View router ▸
          </a>
        </p>

        {amountIn && Number(amountIn) > 0 && quoteSource === "price" && (
          <p className="mt-2 text-[10px] text-muted-foreground">
            Showing a price-based estimate while the on-chain quote resolves.
          </p>
        )}
      </div>
    </Card>
  );
}
