import { useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem";

import { publicClient } from "@/lib/web3/client";
import { ERC20_ABI } from "@/lib/uniswap/abi/erc20";

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

  const { data, isLoading, isError } = useQuery({
    queryKey: [BALANCE_QUERY_KEY, "erc20", token?.toLowerCase(), wallet?.toLowerCase(), decimals],
    enabled,
    refetchInterval: REFRESH_MS,
    refetchIntervalInBackground: true,
    refetchOnReconnect: "always",
    refetchOnWindowFocus: "always",
    staleTime: 10_000,
    // Fail fast after the transport timeout and let the scheduled refresh
    // recover. Multiple initial retries made balance loading look endless.
    retry: false,
    queryFn: async () => {
      const [raw, resolved] = await Promise.all([
        publicClient.readContract({
          address: token as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [wallet as `0x${string}`],
        }),
        decimals != null
          ? Promise.resolve(decimals)
          : publicClient.readContract({
              address: token as `0x${string}`,
              abi: ERC20_ABI,
              functionName: "decimals",
            }),
      ]);

      return { raw: raw as bigint, decimals: Number(resolved) };
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
