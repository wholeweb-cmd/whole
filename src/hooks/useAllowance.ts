import { useCallback, useEffect, useState } from "react";

import { getAllowance } from "@/lib/uniswap/read";

interface Params {
  token?: `0x${string}`;
  owner?: `0x${string}`;
  spender?: `0x${string}`;
}

export function useAllowance({ token, owner, spender }: Params) {
  const [allowance, setAllowance] = useState(0n);

  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!token || !owner || !spender) {
      setAllowance(0n);
      return;
    }

    try {
      setLoading(true);

      const value = await getAllowance(token, owner, spender);

      setAllowance(value);
    } finally {
      setLoading(false);
    }
  }, [token, owner, spender]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    allowance,
    loading,
    refresh,
  };
}
