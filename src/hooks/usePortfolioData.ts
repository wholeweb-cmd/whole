import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";

import { fetchPortfolio } from "@/functions/portfolio";

export function usePortfolioData() {
  const { address } = useAccount();

  return useQuery({
    queryKey: ["portfolio", address],
    queryFn: () => fetchPortfolio({ data: { address: address as string } }),
    enabled: Boolean(address),
    refetchInterval: 15_000,
  });
}
