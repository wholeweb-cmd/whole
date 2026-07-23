import { readContract } from "viem/actions";

import { publicClient } from "@/lib/web3/client";

import { ERC20_ABI } from "./abi/erc20";
import { QUOTER_V2_ABI } from "./abi/quoter";
import { UNISWAP } from "./addresses";

export async function getTokenBalance(token: `0x${string}`, wallet: `0x${string}`) {
  return readContract(publicClient, {
    address: token,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [wallet],
  });
}

export async function getAllowance(
  token: `0x${string}`,
  owner: `0x${string}`,
  spender: `0x${string}`,
) {
  return readContract(publicClient, {
    address: token,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [owner, spender],
  });
}

export async function quoteExactInputSingle(
  tokenIn: `0x${string}`,
  tokenOut: `0x${string}`,
  amountIn: bigint,
  fee: number,
) {
  return readContract(publicClient, {
    address: UNISWAP.quoter as `0x${string}`,
    abi: QUOTER_V2_ABI,
    functionName: "quoteExactInputSingle",
    args: [
      {
        tokenIn,
        tokenOut,
        amountIn,
        fee,
        sqrtPriceLimitX96: 0n,
      },
    ],
  });
}

/** Multi-hop quote against an encoded V3 path. Returns [amountOut, ...]. */
export async function quoteExactInputPath(path: `0x${string}`, amountIn: bigint) {
  return readContract(publicClient, {
    address: UNISWAP.quoter as `0x${string}`,
    abi: QUOTER_V2_ABI,
    functionName: "quoteExactInput",
    args: [path, amountIn],
  });
}
