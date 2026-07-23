import { useEffect, useState } from "react";
import { formatUnits, parseUnits } from "viem";

import { quoteExactInputSingle, quoteExactInputPath } from "@/lib/uniswap/read";
import { buildRoute, encodePath, isSingleHop, type Route, type SwapToken } from "@/lib/uniswap/route";

interface Result {
  out: string;
  loading: boolean;
  route: Route | null;
  noRoute: boolean;
  /** "onchain" = exact quoter result, "price" = estimate from token USD prices. */
  source: "onchain" | "price" | null;
}

/** Output amount estimated from each token's real USD price. */
function priceEstimate(tokenIn: SwapToken, tokenOut: SwapToken, amount: string): string | null {
  const amt = Number(amount);
  if (!amt || amt <= 0) return null;
  if (tokenIn.price == null || tokenOut.price == null || tokenOut.price <= 0) return null;
  return String((amt * tokenIn.price) / tokenOut.price);
}

/**
 * Live quote for a swap between any two tokens. It always shows a real
 * price-based estimate immediately (derived from each token's USD price), then
 * refines it with the exact on-chain quoter result once that resolves.
 */
export function useSwapQuote(
  tokenIn: SwapToken | null,
  tokenOut: SwapToken | null,
  amount: string,
  wethFee: number | null,
): Result {
  const [onchain, setOnchain] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const route = tokenIn && tokenOut ? buildRoute(tokenIn, tokenOut, wethFee) : null;
  const noRoute = Boolean(tokenIn && tokenOut && tokenIn.address !== tokenOut.address && !route);
  const routeKey = route ? route.nodes.join(">") + route.fees.join(",") : "";

  const estimate = tokenIn && tokenOut ? priceEstimate(tokenIn, tokenOut, amount) : null;

  useEffect(() => {
    let cancelled = false;
    setOnchain(null);

    async function run() {
      if (!tokenIn || !tokenOut || !route || !amount || Number(amount) <= 0) return;

      try {
        setLoading(true);
        const amountIn = parseUnits(amount, tokenIn.decimals);

        let amountOut: bigint;
        if (isSingleHop(route)) {
          const res = await quoteExactInputSingle(
            route.nodes[0],
            route.nodes[1],
            amountIn,
            route.fees[0],
          );
          amountOut = res[0];
        } else {
          const res = await quoteExactInputPath(encodePath(route), amountIn);
          amountOut = res[0];
        }

        const formatted = formatUnits(amountOut, tokenOut.decimals);
        if (!cancelled && Number(formatted) > 0) setOnchain(formatted);
      } catch {
        // Fall back to the price-based estimate below.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenIn?.address, tokenOut?.address, amount, routeKey]);

  // Prefer the exact on-chain quote; otherwise show the real price estimate.
  const out = onchain ?? estimate ?? "0";
  const source: Result["source"] = onchain ? "onchain" : estimate ? "price" : null;

  return { out, loading: loading && !estimate, route, noRoute, source };
}
