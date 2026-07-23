import { useEffect, useState } from "react";
import { formatEther } from "viem";

import { publicClient } from "@/lib/web3/client";

export function useNativeBalance(address?: `0x${string}`) {
  const [balance, setBalance] = useState("0");

  useEffect(() => {
    if (!address) {
      setBalance("0");
      return;
    }

    async function load(addr: `0x${string}`) {
      try {
        const value = await publicClient.getBalance({
          address: addr,
        });

        setBalance(Number(formatEther(value)).toFixed(4));
      } catch (err) {
        console.error(err);
      }
    }

    load(address);
  }, [address]);

  return balance;
}
