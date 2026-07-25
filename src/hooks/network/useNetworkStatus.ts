import { useEffect, useState } from "react";
import { formatUnits } from "viem";

import { publicClient } from "@/lib/web3/client";
import { CHAIN } from "@/lib/config/chain";

const POLL_MS = 12_000;
// A public RPC that is timing out won't recover within one poll interval, so
// back off instead of re-issuing the same failing pair of calls every tick.
const MAX_BACKOFF_MS = 120_000;

export interface NetworkStatus {
  block: string;
  /** Gas price in gwei, or null while unknown. */
  gas: string | null;
  chainId: number;
  online: boolean;
}

/**
 * Live chain heartbeat for the workspace header.
 *
 * The chain's public RPC is intermittently unreachable (it's DNS-blocked on
 * some networks and rate-limits elsewhere), so a failed poll degrades to
 * `online: false` and backs off exponentially. Polling also pauses while the
 * tab is hidden rather than burning RPC quota in a background tab.
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    block: "—",
    gas: null,
    // The chain id is fixed configuration - polling eth_chainId every tick
    // just spent a third of this hook's RPC budget re-reading a constant.
    chainId: CHAIN.id,
    online: false,
  });

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;

    async function load() {
      try {
        const [block, gas] = await Promise.all([
          publicClient.getBlockNumber(),
          publicClient.getGasPrice(),
        ]);

        if (cancelled) return;

        failures = 0;
        setStatus({
          block: block.toString(),
          gas: Number(formatUnits(gas, 9)).toFixed(3),
          chainId: CHAIN.id,
          online: true,
        });
      } catch {
        if (cancelled) return;
        failures += 1;
        setStatus((prev) => ({ ...prev, online: false }));
      }
    }

    function schedule() {
      const delay = Math.min(POLL_MS * 2 ** failures, MAX_BACKOFF_MS);
      timer = setTimeout(tick, delay);
    }

    async function tick() {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        schedule();
        return;
      }
      await load();
      if (!cancelled) schedule();
    }

    void tick();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  return status;
}
