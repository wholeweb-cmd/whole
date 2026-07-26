import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { BALANCE_QUERY_KEY } from "@/hooks/useERC20Balance";
import { PORTFOLIO_QUERY_KEY } from "@/hooks/usePortfolioData";
import { useWalletAddress } from "@/hooks/useWalletAddress";

const REFRESH_MS = 15_000;

/**
 * Keeps wallet data synchronized with confirmed chain state across routes.
 * A single watcher at the app root avoids every balance component opening its
 * own block poll while still updating all active balance queries together.
 */
export function WalletBalanceSync() {
  const queryClient = useQueryClient();
  const { address } = useWalletAddress();

  useEffect(() => {
    if (!address) return;

    const refresh = () => {
      if (queryClient.isFetching({ queryKey: [BALANCE_QUERY_KEY] }) === 0) {
        void queryClient.refetchQueries(
          { queryKey: [BALANCE_QUERY_KEY], type: "active" },
          { cancelRefetch: false },
        );
      }

      if (queryClient.isFetching({ queryKey: [PORTFOLIO_QUERY_KEY] }) === 0) {
        void queryClient.refetchQueries(
          { queryKey: [PORTFOLIO_QUERY_KEY], type: "active" },
          { cancelRefetch: false },
        );
      }
    };

    const interval = window.setInterval(refresh, REFRESH_MS);
    return () => window.clearInterval(interval);
  }, [address, queryClient]);

  return null;
}
