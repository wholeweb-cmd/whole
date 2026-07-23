import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";

import { getPositionsForOwner, type ParsedPosition } from "@/lib/uniswap/liquidity";

export interface LiquidityPosition extends ParsedPosition {
  inRange: boolean | null;
}

export function useLiquidityPositions() {
  const { address } = useAccount();
  const [positions, setPositions] = useState<LiquidityPosition[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!address) {
      setPositions([]);
      return;
    }

    setLoading(true);

    try {
      const results = await getPositionsForOwner(address as `0x${string}`);
      // In-range status needs the pool's current tick, not fetched yet.
      setPositions(results.map((p) => ({ ...p, inRange: null })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { positions, loading, refresh };
}
