import { useEffect, useState } from "react";
import { getLatestBlock, getGasPrice, getChainId } from "@/services/marketService";
import { formatUnits } from "viem";

export function useNetworkStatus() {
  const [status, setStatus] = useState({
    block: "0",
    gas: "0",
    chainId: 0,
  });

  useEffect(() => {
    async function load() {
      try {
        const [block, gas, chainId] = await Promise.all([
          getLatestBlock(),
          getGasPrice(),
          getChainId(),
        ]);

        setStatus({
          block: block.toString(),
          gas: Number(formatUnits(gas, 9)).toFixed(3),
          chainId,
        });
      } catch (err) {
        console.error(err);
      }
    }

    load();

    const timer = setInterval(load, 5000);

    return () => clearInterval(timer);
  }, []);

  return status;
}
