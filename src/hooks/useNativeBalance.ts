import { useQuery } from "@tanstack/react-query";
import { useWallets } from "@privy-io/react-auth";
import { formatEther } from "viem";

import { fetchWalletBalance } from "@/functions/balance";
import { getConnectedNativeBalance } from "@/lib/web3/connectedBalance";
import { BALANCE_QUERY_KEY, ZERO_BALANCE, type TokenBalance } from "./useERC20Balance";

const REFRESH_MS = 20_000;

/** Live native (ETH) balance for a wallet, in the same shape as ERC20 reads. */
export function useNativeBalance(address?: `0x${string}`): TokenBalance {
  const enabled = Boolean(address);
  const { wallets } = useWallets();
  const connection = wallets.find(
    (candidate) => candidate.address.toLowerCase() === address?.toLowerCase(),
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: [BALANCE_QUERY_KEY, "native", address?.toLowerCase()],
    enabled,
    refetchInterval: REFRESH_MS,
    refetchIntervalInBackground: true,
    refetchOnReconnect: "always",
    refetchOnWindowFocus: "always",
    staleTime: 10_000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 5_000),
    queryFn: async () => {
      if (connection) {
        try {
          return await getConnectedNativeBalance(connection, address as `0x${string}`);
        } catch {
          // Fall through to the same-origin explorer read below.
        }
      }

      const result = await fetchWalletBalance({
        data: { wallet: address as string, decimals: 18 },
      });
      return BigInt(result.raw);
    },
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
