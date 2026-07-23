import { useEffect, useState } from "react";
import { formatUnits } from "viem";

import { publicClient } from "@/lib/web3/client";

const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [
      {
        name: "owner",
        type: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },
] as const;

export function useERC20Balance(token?: `0x${string}`, wallet?: `0x${string}`, decimals = 18) {
  const [balance, setBalance] = useState("0");

  useEffect(() => {
    if (!token || !wallet) {
      setBalance("0");
      return;
    }

    async function load(tokenAddress: `0x${string}`, walletAddress: `0x${string}`) {
      try {
        const value = await publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [walletAddress],
        });

        setBalance(Number(formatUnits(value, decimals)).toFixed(4));
      } catch (err) {
        console.error(err);
      }
    }
    load(token, wallet);
  }, [token, wallet, decimals]);

  return balance;
}
