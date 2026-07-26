import { useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWatchBlockNumber } from "wagmi";

import { BALANCE_QUERY_KEY } from "@/hooks/useERC20Balance";
import { PORTFOLIO_QUERY_KEY } from "@/hooks/usePortfolioData";
import { useWalletAddress } from "@/hooks/useWalletAddress";

const BLOCK_POLL_MS = 4_000;
const BALANCE_REFRESH_MS = 12_000;
const PORTFOLIO_REFRESH_MS = 12_000;

/**
 * Keeps wallet data synchronized with confirmed chain state across routes.
 * A single watcher at the app root avoids every balance component opening its
 * own block poll while still updating all active balance queries together.
 */
export function WalletBalanceSync() {
  const queryClient = useQueryClient();
  const { address } = useWalletAddress();
  const lastBalanceRefresh = useRef(0);
  const lastPortfolioRefresh = useRef(0);

  useWatchBlockNumber({
    enabled: Boolean(address),
    pollingInterval: BLOCK_POLL_MS,
    onBlockNumber: () => {
      const now = Date.now();

      // Never cancel a balance request just because another block arrived.
      // The old 4-second invalidation loop could repeatedly abort a slower
      // 5-second RPC read, so the Swap balance never got a chance to resolve.
      if (
        now - lastBalanceRefresh.current >= BALANCE_REFRESH_MS &&
        queryClient.isFetching({ queryKey: [BALANCE_QUERY_KEY] }) === 0
      ) {
        lastBalanceRefresh.current = now;
        void queryClient.refetchQueries(
          { queryKey: [BALANCE_QUERY_KEY], type: "active" },
          { cancelRefetch: false },
        );
      }

      if (
        now - lastPortfolioRefresh.current >= PORTFOLIO_REFRESH_MS &&
        queryClient.isFetching({ queryKey: [PORTFOLIO_QUERY_KEY] }) === 0
      ) {
        lastPortfolioRefresh.current = now;
        void queryClient.refetchQueries(
          { queryKey: [PORTFOLIO_QUERY_KEY], type: "active" },
          { cancelRefetch: false },
        );
      }
    },
  });

  return null;
}
