import { useQuery } from "@tanstack/react-query";
import { formatUnits, parseUnits } from "viem";

import { discoverSwapRoutes } from "@/functions/pool";
import { quoteExactInputPath, quoteExactInputSingle } from "@/lib/uniswap/read";
import { encodePath, isSingleHop, type Route, type SwapToken } from "@/lib/uniswap/route";
import { publicClient } from "@/lib/web3/client";
import { deductServiceFee, SERVICE_FEE_RATE } from "@/lib/config/swapFee";

interface Result {
  /** Net output delivered to the user after the service fee. */
  out: string;
  /** Gross router quote before the service fee. */
  grossOut: string;
  serviceFee: string;
  loading: boolean;
  route: Route | null;
  noRoute: boolean;
  /** "onchain" = exact quoter result, "price" = temporary mid-market estimate. */
  source: "onchain" | "price" | null;
  /** Mid-market output implied by each token's USD price. */
  estimate: string | null;
  estimatedGas: bigint | null;
  networkFeeEth: number | null;
  networkFeeUsd: number | null;
  alternatives: number;
}

interface QuotedRoute {
  route: Route;
  amountOut: bigint;
  gasUnits: bigint;
  gasCostWei: bigint;
  netUsd: number | null;
}

const ROUTER_OVERHEAD_GAS = 35_000n;
const NATIVE_WRAP_GAS = 25_000n;
const NATIVE_UNWRAP_GAS = 35_000n;
const ERC20_FEE_SETTLEMENT_GAS = 25_000n;

/** Output amount estimated from each token's real USD price. */
function priceEstimate(tokenIn: SwapToken, tokenOut: SwapToken, amount: string): string | null {
  const value = Number(amount);
  if (!value || value <= 0) return null;
  if (tokenIn.price == null || tokenOut.price == null || tokenOut.price <= 0) return null;
  return String((value * tokenIn.price) / tokenOut.price);
}

function routeKey(route: Route) {
  return `${route.nodes.join(">")}|${route.fees.join(",")}`;
}

async function quoteRoute(route: Route, amountIn: bigint) {
  if (isSingleHop(route)) {
    const result = await quoteExactInputSingle(
      route.nodes[0],
      route.nodes[1],
      amountIn,
      route.fees[0],
    );
    return { amountOut: result[0], quotedGas: result[3] };
  }

  const result = await quoteExactInputPath(encodePath(route), amountIn);
  return { amountOut: result[0], quotedGas: result[3] };
}

/**
 * Discovers direct, WETH and USDG routes, quotes every viable candidate, then
 * ranks them by value after estimated network cost. This prevents a small
 * trade from taking a slightly better output through an unnecessarily costly
 * extra hop.
 */
export function useSwapQuote(
  tokenIn: SwapToken | null,
  tokenOut: SwapToken | null,
  amount: string,
  nativePrice: number | null,
): Result {
  const pairReady = Boolean(
    tokenIn && tokenOut && tokenIn.address.toLowerCase() !== tokenOut.address.toLowerCase(),
  );
  const amountReady = Number(amount) > 0;

  const routesQuery = useQuery({
    queryKey: ["swap-routes", tokenIn?.address, tokenOut?.address],
    queryFn: () =>
      discoverSwapRoutes({
        data: {
          tokenIn: tokenIn!.address,
          tokenOut: tokenOut!.address,
        },
      }),
    enabled: pairReady,
    staleTime: 5 * 60_000,
  });

  const routes = routesQuery.data ?? [];
  const candidatesKey = routes.map(routeKey).join(";");

  const quotesQuery = useQuery({
    queryKey: [
      "swap-route-quotes",
      tokenIn?.address,
      tokenOut?.address,
      amount,
      candidatesKey,
      nativePrice,
      tokenOut?.price,
    ],
    queryFn: async (): Promise<QuotedRoute[]> => {
      const amountIn = parseUnits(amount, tokenIn!.decimals);
      const gasPrice = await publicClient.getGasPrice().catch(() => 0n);
      const nativeOverhead =
        (tokenIn!.isNative ? NATIVE_WRAP_GAS : 0n) +
        (tokenOut!.isNative ? NATIVE_UNWRAP_GAS : ERC20_FEE_SETTLEMENT_GAS);

      const settled = await Promise.allSettled(
        routes.map(async (route): Promise<QuotedRoute> => {
          const quote = await quoteRoute(route, amountIn);
          if (quote.amountOut <= 0n) throw new Error("Empty quote");

          const gasUnits = quote.quotedGas + ROUTER_OVERHEAD_GAS + nativeOverhead;
          const gasCostWei = gasUnits * gasPrice;
          const output = Number(formatUnits(quote.amountOut, tokenOut!.decimals));
          const gasCostEth = Number(formatUnits(gasCostWei, 18));
          const netUsd =
            tokenOut!.price != null && nativePrice != null
              ? output * tokenOut!.price - gasCostEth * nativePrice
              : null;

          return { route, amountOut: quote.amountOut, gasUnits, gasCostWei, netUsd };
        }),
      );

      return settled
        .filter(
          (entry): entry is PromiseFulfilledResult<QuotedRoute> => entry.status === "fulfilled",
        )
        .map((entry) => entry.value)
        .sort((a, b) => {
          if (a.netUsd != null && b.netUsd != null && a.netUsd !== b.netUsd) {
            return b.netUsd - a.netUsd;
          }
          if (a.amountOut !== b.amountOut) return a.amountOut > b.amountOut ? -1 : 1;
          return a.route.fees.length - b.route.fees.length;
        });
    },
    enabled: pairReady && amountReady && routesQuery.isSuccess && routes.length > 0,
    staleTime: 8_000,
    retry: 1,
  });

  const best = quotesQuery.data?.[0] ?? null;
  const estimate = tokenIn && tokenOut ? priceEstimate(tokenIn, tokenOut, amount) : null;
  const grossOut = best ? formatUnits(best.amountOut, tokenOut!.decimals) : (estimate ?? "0");
  const feeBreakdown = best ? deductServiceFee(best.amountOut) : null;
  const estimatedNet = estimate == null ? null : String(Number(estimate) * (1 - SERVICE_FEE_RATE));
  const estimatedFee = estimate == null ? null : String(Number(estimate) * SERVICE_FEE_RATE);
  const out = feeBreakdown
    ? formatUnits(feeBreakdown.netAmount, tokenOut!.decimals)
    : (estimatedNet ?? "0");
  const serviceFee = feeBreakdown
    ? formatUnits(feeBreakdown.feeAmount, tokenOut!.decimals)
    : (estimatedFee ?? "0");
  const loading =
    pairReady &&
    (routesQuery.isLoading ||
      (amountReady && routesQuery.isSuccess && routes.length > 0 && quotesQuery.isLoading));
  const noRoute =
    pairReady &&
    !loading &&
    (routesQuery.isError ||
      (routesQuery.isSuccess &&
        (routes.length === 0 || (amountReady && quotesQuery.isSuccess && !best))));

  const networkFeeEth = best ? Number(formatUnits(best.gasCostWei, 18)) : null;
  const networkFeeUsd =
    networkFeeEth != null && nativePrice != null ? networkFeeEth * nativePrice : null;

  return {
    out,
    grossOut,
    serviceFee,
    loading,
    route: best?.route ?? null,
    noRoute,
    source: best ? "onchain" : estimate ? "price" : null,
    estimate,
    estimatedGas: best?.gasUnits ?? null,
    networkFeeEth,
    networkFeeUsd,
    alternatives: quotesQuery.data?.length ?? 0,
  };
}
