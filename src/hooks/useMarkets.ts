import { useQuery } from "@tanstack/react-query";

import { fetchMarket, fetchMarkets } from "@/functions/market";

const REFRESH_MS = 15_000;

export function useMarkets() {
  return useQuery({
    queryKey: ["markets"],
    queryFn: () => fetchMarkets(),
    refetchInterval: REFRESH_MS,
  });
}

export function useMarketDetail(symbol: string) {
  return useQuery({
    queryKey: ["market", symbol],
    queryFn: () => fetchMarket({ data: { symbol } }),
    refetchInterval: REFRESH_MS,
    enabled: Boolean(symbol),
  });
}
