import { useEffect, useState } from "react";

import { getQuote } from "@/lib/uniswap/quote";

interface Params {
  tokenIn?: `0x${string}`;
  tokenOut?: `0x${string}`;
  amount: string;
  decimalsIn: number;
  decimalsOut: number;
  fee?: number;
}

export function useQuote({
  tokenIn,
  tokenOut,
  amount,
  decimalsIn,
  decimalsOut,
  fee = 3000,
}: Params) {
  const [quote, setQuote] = useState("0");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadQuote() {
      if (!tokenIn || !tokenOut) {
        setQuote("0");
        return;
      }

      if (!amount || Number(amount) <= 0) {
        setQuote("0");
        return;
      }

      try {
        setLoading(true);

        const result = await getQuote(tokenIn, tokenOut, amount, decimalsIn, decimalsOut, fee);

        setQuote(result);
      } catch (err) {
        console.error(err);
        setQuote("0");
      } finally {
        setLoading(false);
      }
    }

    loadQuote();
  }, [tokenIn, tokenOut, amount, decimalsIn, decimalsOut, fee]);

  return {
    quote,
    loading,
  };
}
