import { useEffect, useState } from "react";
import { publicClient } from "@/lib/web3/client";

export function useBlockNumber() {
  const [block, setBlock] = useState<bigint>(0n);

  useEffect(() => {
    async function load() {
      try {
        const latest = await publicClient.getBlockNumber();
        setBlock(latest);
      } catch (err) {
        console.error(err);
      }
    }

    load();

    const timer = setInterval(load, 5000);

    return () => clearInterval(timer);
  }, []);

  return block.toString();
}
