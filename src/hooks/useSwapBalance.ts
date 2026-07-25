import type { SwapToken } from "@/lib/uniswap/route";
import { useERC20Balance, ZERO_BALANCE, type TokenBalance } from "./useERC20Balance";
import { useNativeBalance } from "./useNativeBalance";
import { useWalletAddress } from "./useWalletAddress";

/**
 * Live wallet balance for any swap token, native or ERC20.
 *
 * The token's own `decimals` is passed through rather than left to default -
 * every 6-decimal token on this chain (USDG, syrupUSDG) otherwise reads as
 * zero, which looks exactly like an undetected balance.
 */
export function useSwapBalance(token: SwapToken | null): TokenBalance {
  const { address: wallet, isLoading: walletLoading } = useWalletAddress();

  const native = useNativeBalance(token?.isNative ? wallet : undefined);

  const erc20 = useERC20Balance(
    token && !token.isNative ? token.address : undefined,
    token && !token.isNative ? wallet : undefined,
    token?.decimals,
  );

  if (!token) return ZERO_BALANCE;
  const balance = token.isNative ? native : erc20;

  return walletLoading && !wallet ? { ...balance, isLoading: true } : balance;
}
