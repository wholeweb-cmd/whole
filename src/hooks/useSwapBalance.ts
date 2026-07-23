import { useAccount } from "wagmi";

import type { SwapToken } from "@/lib/uniswap/route";
import { useERC20Balance } from "./useERC20Balance";
import { useNativeBalance } from "./useNativeBalance";

/** Live wallet balance for any swap token, by address (native or ERC20). */
export function useSwapBalance(token: SwapToken | null) {
  const { address } = useAccount();

  const nativeBalance = useNativeBalance(
    token?.isNative ? (address as `0x${string}` | undefined) : undefined,
  );

  const erc20Balance = useERC20Balance(
    token && !token.isNative ? token.address : undefined,
    token && !token.isNative ? (address as `0x${string}` | undefined) : undefined,
  );

  if (!token) return 0;
  return Number(token.isNative ? nativeBalance : erc20Balance);
}
