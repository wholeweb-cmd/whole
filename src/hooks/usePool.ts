import { useQuery } from "@tanstack/react-query";

import { resolvePool } from "@/services/poolResolver";

export function usePool(tokenAddress?: string) {
  return useQuery({
    queryKey: ["pool", tokenAddress],

    enabled: Boolean(tokenAddress),

    queryFn: async () => {
      const pool = await resolvePool(tokenAddress!);

      if (!pool) {
        throw new Error("Pool not found");
      }

      return pool;
    },

    staleTime: 20_000,

    refetchInterval: 15_000,

    retry: 2,
  });
}
