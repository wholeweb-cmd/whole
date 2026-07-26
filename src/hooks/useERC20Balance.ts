import { useQuery } from "@tanstack/react-query";
import { useWallets } from "@privy-io/react-auth";
import { formatUnits } from "viem";

import { fetchWalletBalance } from "@/functions/balance";
import { getConnectedTokenBalance } from "@/lib/web3/connectedBalance";

/** Query key prefix, so a completed transaction can invalidate every balance. */
export const BALANCE_QUERY_KEY = "wallet-balance";

const REFRESH_MS = 20_000;

export interface TokenBalance {
  /** Base units exactly as the chain reports them. */
  raw: bigint;
  decimals: number;
  /**
   * Full-precision decimal string. This is what "MAX" must spend - a rounded
   * value can exceed the real balance and make the transaction revert.
   */
  exact: string;
  /** Numeric form, for comparisons and display only. */
  value: number;
  isLoading: boolean;
  /** True only when the latest read failed and no reliable value is available. */
  isError: boolean;
}

export const ZERO_BALANCE: TokenBalance = {
  raw: 0n,
  decimals: 18,
  exact: "0",
  value: 0,
  isLoading: false,
  isError: false,
};

/**
 * Live ERC20 balance for a wallet.
 *
 * `decimals` must describe the token being read. Leaving it out used to mean
 * "assume 18", which silently reported every 6-decimal token on this chain
 * (USDG, syrupUSDG) as 0.0000 - a real 1,000 USDG balance formatted as
 * 0.000000001. It is now resolved from the contract whenever the caller
 * doesn't supply it, so an unknown token can never be mis-scaled.
 */
export function useERC20Balance(
  token?: `0x${string}`,
  wallet?: `0x${string}`,
  decimals?: number,
): TokenBalance {
  const enabled = Boolean(token && wallet);
  const { wallets } = useWallets();
  const connection = wallets.find(
    (candidate) => candidate.address.toLowerCase() === wallet?.toLowerCase(),
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: [BALANCE_QUERY_KEY, "erc20", token?.toLowerCase(), wallet?.toLowerCase(), decimals],
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
          return await getConnectedTokenBalance(
            connection,
            token as `0x${string}`,
            wallet as `0x${string}`,
            decimals,
          );
        } catch {
          // Some injected wallets do not expose read calls. The server-side
          // explorer snapshot below is the reliable fallback for those wallets.
        }
      }

      const result = await fetchWalletBalance({
        data: {
          wallet: wallet as string,
          token: token as string,
          decimals: decimals ?? 18,
        },
      });

      return { raw: BigInt(result.raw), decimals: result.decimals };
    },
  });

  if (!data) {
    return {
      ...ZERO_BALANCE,
      isLoading: enabled && isLoading,
      isError: enabled && isError,
    };
  }

  const exact = formatUnits(data.raw, data.decimals);

  return {
    raw: data.raw,
    decimals: data.decimals,
    exact,
    value: Number(exact),
    isLoading: false,
    isError: false,
  };
}
