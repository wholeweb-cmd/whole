import { useQuery } from "@tanstack/react-query";

import { resolvePool } from "@/functions/pool";
import type { SwapToken } from "@/lib/uniswap/route";

/**
 * Ensures a token has a usable pool fee for routing. Most tokens arrive from
 * market data without a discovered pool yet (feeTier null); this resolves the
 * real fee tier on demand from the factory so any token becomes swappable.
 */
export function useResolvedToken(token: SwapToken | null): SwapToken | null {
  const needsResolve = Boolean(
    token && !token.isNative && token.symbol !== "USDG" && token.feeTier == null,
  );

  const { data } = useQuery({
    queryKey: ["pool", token?.address],
    queryFn: () => resolvePool({ data: { address: token!.address } }),
    enabled: needsResolve,
    staleTime: 5 * 60_000,
  });

  if (!token) return null;
  if (!needsResolve || !data) return token;

  return { ...token, feeTier: data.feeTier, quoteSymbol: data.quoteSymbol };
}
