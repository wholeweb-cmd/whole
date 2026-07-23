import { useEffect, useState } from "react";

import { publicClient } from "@/lib/web3/client";

export function useChainStatus() {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        await publicClient.getChainId();

        setOnline(true);
      } catch {
        setOnline(false);
      }
    }

    check();

    const timer = setInterval(check, 15000);

    return () => clearInterval(timer);
  }, []);

  return online;
}
