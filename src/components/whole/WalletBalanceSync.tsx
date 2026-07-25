import { useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWatchBlockNumber } from "wagmi";

import { BALANCE_QUERY_KEY } from "@/hooks/useERC20Balance";
import { PORTFOLIO_QUERY_KEY } from "@/hooks/usePortfolioData";
import { useWalletAddress } from "@/hooks/useWalletAddress";

const BLOCK_POLL_MS = 4_000;
const PORTFOLIO_REFRESH_MS = 12_000;

/**
 * Keeps wallet data synchronized with confirmed chain state across routes.
 * A single watcher at the app root avoids every balance component opening its
 * own block poll while still updating all active balance queries together.
 */
export function WalletBalanceSync() {
  const queryClient = useQueryClient();
  const { address } = useWalletAddress();
  const lastPortfolioRefresh = useRef(0);

  useWatchBlockNumber({
    enabled: Boolean(address),
    pollingInterval: BLOCK_POLL_MS,
    onBlockNumber: () => {
      void queryClient.invalidateQueries({ queryKey: [BALANCE_QUERY_KEY] });

      const now = Date.now();
      if (now - lastPortfolioRefresh.current >= PORTFOLIO_REFRESH_MS) {
        lastPortfolioRefresh.current = now;
        void queryClient.invalidateQueries({ queryKey: [PORTFOLIO_QUERY_KEY] });
      }
    },
  });

  return null;
}
