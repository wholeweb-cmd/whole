import { usePrivy, useWallets } from "@privy-io/react-auth";
import { isAddress, type Address } from "viem";
import { useAccount } from "wagmi";

/**
 * The single wallet address used by every read-only, wallet-specific view.
 *
 * Wagmi is the source of truth once it has selected an active wallet. Privy
 * can finish authentication before that active account has propagated,
 * however, so reads fall back to Privy's connected wallet and finally the
 * login wallet. Without this fallback, the header can show a connected wallet
 * while swap and portfolio balance queries remain disabled.
 */
export function useWalletAddress() {
  const { ready: privyReady, authenticated, user } = usePrivy();
  const { ready: walletsReady, wallets } = useWallets();
  const { address: wagmiAddress } = useAccount();

  const loginAddress = user?.wallet?.address;
  const connectedAddress =
    wallets.find(
      (wallet) =>
        loginAddress != null && wallet.address.toLowerCase() === loginAddress.toLowerCase(),
    )?.address ?? wallets[0]?.address;

  const candidate = wagmiAddress ?? connectedAddress ?? loginAddress;
  const address =
    privyReady && authenticated && candidate && isAddress(candidate)
      ? (candidate as Address)
      : undefined;

  return {
    address,
    authenticated,
    isLoading: !privyReady || (authenticated && !wagmiAddress && !walletsReady),
  };
}
