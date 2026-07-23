import { parseUnits, formatUnits } from "viem";

import { quoteExactInputSingle } from "./read";

export async function getQuote(
  tokenIn: `0x${string}`,
  tokenOut: `0x${string}`,
  amount: string,
  decimalsIn: number,
  decimalsOut: number,
  fee: number = 3000,
) {
  if (!amount || Number(amount) <= 0) {
    return "0";
  }

  const amountIn = parseUnits(amount, decimalsIn);

  const result = await quoteExactInputSingle(tokenIn, tokenOut, amountIn, fee);

  return formatUnits(result[0], decimalsOut);
}
