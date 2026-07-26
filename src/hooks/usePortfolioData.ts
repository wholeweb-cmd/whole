import { useQuery } from "@tanstack/react-query";

import { fetchPortfolio } from "@/functions/portfolio";
import { useWalletAddress } from "./useWalletAddress";

export const PORTFOLIO_QUERY_KEY = "portfolio";
const PORTFOLIO_TIMEOUT_MS = 8_000;

async function fetchPortfolioBounded(address: string) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      fetchPortfolio({ data: { address } }),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error("Wallet data timed out")),
          PORTFOLIO_TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export function usePortfolioData() {
  const { address, isLoading: walletLoading } = useWalletAddress();

  const query = useQuery({
    queryKey: [PORTFOLIO_QUERY_KEY, address?.toLowerCase()],
    queryFn: () => fetchPortfolioBounded(address as string),
    enabled: Boolean(address),
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
    retry: false,
  });

  return {
    ...query,
    isLoading: query.isLoading || (walletLoading && !address),
  };
}
