import { useQuery } from "@tanstack/react-query";
import { formatEther } from "viem";

import { publicClient } from "@/lib/web3/client";
import { BALANCE_QUERY_KEY, ZERO_BALANCE, type TokenBalance } from "./useERC20Balance";

const REFRESH_MS = 20_000;

/** Live native (ETH) balance for a wallet, in the same shape as ERC20 reads. */
export function useNativeBalance(address?: `0x${string}`): TokenBalance {
  const enabled = Boolean(address);

  const { data, isLoading } = useQuery({
    queryKey: [BALANCE_QUERY_KEY, "native", address?.toLowerCase()],
    enabled,
    refetchInterval: REFRESH_MS,
    refetchIntervalInBackground: true,
    staleTime: 10_000,
    queryFn: () => publicClient.getBalance({ address: address as `0x${string}` }),
  });

  if (data == null) return { ...ZERO_BALANCE, isLoading: enabled && isLoading };

  const exact = formatEther(data);

  return { raw: data, decimals: 18, exact, value: Number(exact), isLoading: false };
}
