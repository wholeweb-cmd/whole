import { useQuery } from "@tanstack/react-query";

import { fetchChart, type ChartRange } from "@/functions/chart";

export function useChart(symbol: string, range: ChartRange, price?: number | null) {
  return useQuery({
    queryKey: ["chart", symbol, range],
    queryFn: () =>
      fetchChart({ data: { symbol, range, price: price ?? undefined } }),
    enabled: Boolean(symbol),
    // History barely moves within a minute; the server caches for 60s anyway.
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
