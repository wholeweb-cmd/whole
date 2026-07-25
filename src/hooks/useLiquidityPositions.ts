import { useQuery } from "@tanstack/react-query";

import { getPositionsForOwner, type ParsedPosition } from "@/lib/uniswap/liquidity";
import { useWalletAddress } from "./useWalletAddress";

export const LIQUIDITY_POSITIONS_QUERY_KEY = "liquidity-positions";

export interface LiquidityPosition extends ParsedPosition {
  inRange: boolean | null;
}

export function useLiquidityPositions() {
  const { address, isLoading: walletLoading } = useWalletAddress();

  const query = useQuery({
    queryKey: [LIQUIDITY_POSITIONS_QUERY_KEY, address?.toLowerCase()],
    enabled: Boolean(address),
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
    queryFn: async (): Promise<LiquidityPosition[]> => {
      const results = await getPositionsForOwner(address as `0x${string}`);
      // In-range status needs the pool's current tick, not fetched yet.
      return results.map((position) => ({ ...position, inRange: null }));
    },
  });

  return {
    positions: query.data ?? [],
    loading: query.isLoading || (walletLoading && !address),
    error: query.error instanceof Error ? query.error.message : null,
    refresh: query.refetch,
  };
}
