import type { ConnectedWallet } from "@privy-io/react-auth";
import { createPublicClient, custom } from "viem";

import { ERC20_ABI } from "@/lib/uniswap/abi/erc20";
import { robinhood } from "./client";

function walletClient(wallet: ConnectedWallet) {
  return wallet.getEthereumProvider().then((provider) =>
    createPublicClient({
      chain: robinhood,
      transport: custom(provider),
    }),
  );
}

export async function getConnectedNativeBalance(
  connection: ConnectedWallet,
  wallet: `0x${string}`,
) {
  const client = await walletClient(connection);
  return client.getBalance({ address: wallet });
}

export async function getConnectedTokenBalance(
  connection: ConnectedWallet,
  token: `0x${string}`,
  wallet: `0x${string}`,
  decimals?: number,
) {
  const client = await walletClient(connection);
  const [raw, resolvedDecimals] = await Promise.all([
    client.readContract({
      address: token,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [wallet],
    }),
    decimals == null
      ? client.readContract({
          address: token,
          abi: ERC20_ABI,
          functionName: "decimals",
        })
      : Promise.resolve(decimals),
  ]);

  return { raw: raw as bigint, decimals: Number(resolvedDecimals) };
}
