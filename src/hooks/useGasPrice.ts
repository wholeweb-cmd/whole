import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { publicClient } from "@/lib/web3/client";

export function useGasPrice() {
  const [gas, setGas] = useState("0");

  useEffect(() => {
    async function load() {
      try {
        const gasPrice = await publicClient.getGasPrice();

        setGas(Number(formatUnits(gasPrice, 9)).toFixed(3));
      } catch (err) {
        console.error(err);
      }
    }

    load();

    const timer = setInterval(load, 5000);

    return () => clearInterval(timer);
  }, []);

  return gas;
}
