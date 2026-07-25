import { useEffect, useState } from "react";

import { publicClient } from "@/lib/web3/client";

// Averaged over a window rather than read off one pair of blocks, which swings
// by a second or two either way.
const WINDOW = 10n;

/**
 * Measured seconds per block on Robinhood Chain - the basis for the swap
 * page's confirmation-time estimate. `null` until the first sample lands.
 */
export function useBlockTime() {
  const [seconds, setSeconds] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const latest = await publicClient.getBlock();
        if (latest.number == null || latest.number <= WINDOW) return;

        const earlier = await publicClient.getBlock({ blockNumber: latest.number - WINDOW });
        const delta = Number(latest.timestamp - earlier.timestamp) / Number(WINDOW);

        if (!cancelled && delta > 0) setSeconds(delta);
      } catch (err) {
        console.error(err);
      }
    }

    load();
    const timer = setInterval(load, 30_000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return seconds;
}
