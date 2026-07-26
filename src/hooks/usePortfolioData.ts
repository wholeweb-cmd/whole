import { useQuery } from "@tanstack/react-query";

import { fetchPortfolio } from "@/functions/portfolio";
import { useWalletAddress } from "./useWalletAddress";

export const PORTFOLIO_QUERY_KEY = "portfolio";

export function usePortfolioData() {
  const { address, isLoading: walletLoading } = useWalletAddress();

  const query = useQuery({
    queryKey: [PORTFOLIO_QUERY_KEY, address?.toLowerCase()],
    queryFn: () => fetchPortfolio({ data: { address: address as string } }),
    enabled: Boolean(address),
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
  });

  return {
    ...query,
    isLoading: query.isLoading || (walletLoading && !address),
  };
}
