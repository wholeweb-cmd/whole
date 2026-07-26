import { useQuery } from "@tanstack/react-query";
import { formatEther } from "viem";

import { publicClient } from "@/lib/web3/client";
import { BALANCE_QUERY_KEY, ZERO_BALANCE, type TokenBalance } from "./useERC20Balance";

const REFRESH_MS = 20_000;

/** Live native (ETH) balance for a wallet, in the same shape as ERC20 reads. */
export function useNativeBalance(address?: `0x${string}`): TokenBalance {
  const enabled = Boolean(address);

  const { data, isLoading, isError } = useQuery({
    queryKey: [BALANCE_QUERY_KEY, "native", address?.toLowerCase()],
    enabled,
    refetchInterval: REFRESH_MS,
    refetchIntervalInBackground: true,
    refetchOnReconnect: "always",
    refetchOnWindowFocus: "always",
    staleTime: 10_000,
    // The transport already has a five-second timeout. A failed read should
    // leave loading state immediately; the regular refresh will recover from
    // a temporary RPC issue without trapping the UI in a long retry cycle.
    retry: false,
    queryFn: () => publicClient.getBalance({ address: address as `0x${string}` }),
  });

  if (data == null) {
    return {
      ...ZERO_BALANCE,
      isLoading: enabled && isLoading,
      isError: enabled && isError,
    };
  }

  const exact = formatEther(data);

  return {
    raw: data,
    decimals: 18,
    exact,
    value: Number(exact),
    isLoading: false,
    isError: false,
  };
}
