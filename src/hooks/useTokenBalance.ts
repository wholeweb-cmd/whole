import { useAccount } from "wagmi";

import { getWrappedAddress, isNativeToken } from "@/lib/tokens/helpers";
import { useERC20Balance } from "./useERC20Balance";
import { useNativeBalance } from "./useNativeBalance";

/**
 * Real on-chain balance for the connected wallet, resolved by token symbol.
 * Native tokens (e.g. ETH) read the account's native balance; everything
 * else reads the ERC20 balanceOf its wrapped/token address.
 */
export function useTokenBalance(symbol: string) {
  const { address } = useAccount();
  const native = isNativeToken(symbol);

  const nativeBalance = useNativeBalance(
    native ? (address as `0x${string}` | undefined) : undefined,
  );

  const erc20Balance = useERC20Balance(
    !native ? getWrappedAddress(symbol) : undefined,
    !native ? (address as `0x${string}` | undefined) : undefined,
  );

  return Number(native ? nativeBalance : erc20Balance);
}
