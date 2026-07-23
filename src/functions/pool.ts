import { createServerFn } from "@tanstack/react-start";
import { readContract } from "viem/actions";
import { z } from "zod";

import { publicClient } from "@/lib/web3/client";
import { FACTORY_ABI } from "@/lib/uniswap/abi/factory";
import { UNISWAP } from "@/lib/uniswap/addresses";
import { getToken } from "@/lib/tokens/index";

// Pool discovery via factory event logs is incremental and hasn't necessarily
// reached an older token's pool yet, so the swap engine resolves a token's
// pool on demand: probe the factory for a token/USDG (then token/WETH) pool
// across the standard fee tiers and report which tier actually exists.

const ZERO = "0x0000000000000000000000000000000000000000";
const FEE_TIERS = [100, 500, 3000, 10000];

const USDG_ADDRESS = (getToken("USDG")?.address ?? "").toLowerCase() as `0x${string}`;
const WETH_ADDRESS = (getToken("ETH")?.wrapped ?? "").toLowerCase() as `0x${string}`;

const inputSchema = z.object({ address: z.string() });

const cache = new Map<string, { feeTier: number | null; quoteSymbol: string }>();

async function getPool(a: `0x${string}`, b: `0x${string}`, fee: number): Promise<boolean> {
  try {
    const pool = (await readContract(publicClient, {
      address: UNISWAP.factory as `0x${string}`,
      abi: FACTORY_ABI,
      functionName: "getPool",
      args: [a, b, fee],
    })) as string;
    return Boolean(pool) && pool.toLowerCase() !== ZERO;
  } catch {
    return false;
  }
}

async function firstFeeTierAgainst(token: `0x${string}`, quote: `0x${string}`): Promise<number | null> {
  const results = await Promise.all(FEE_TIERS.map((fee) => getPool(token, quote, fee)));
  const idx = results.findIndex(Boolean);
  return idx === -1 ? null : FEE_TIERS[idx];
}

export const resolvePool = createServerFn({ method: "GET" })
  .validator(inputSchema)
  .handler(async ({ data }): Promise<{ feeTier: number | null; quoteSymbol: string }> => {
    const address = data.address.toLowerCase() as `0x${string}`;

    if (address === USDG_ADDRESS) return { feeTier: null, quoteSymbol: "USDG" };
    const cached = cache.get(address);
    if (cached) return cached;

    // Prefer a direct USDG pool; fall back to a WETH pool (routed via USDG).
    let result: { feeTier: number | null; quoteSymbol: string };

    const usdgFee = await firstFeeTierAgainst(address, USDG_ADDRESS);
    if (usdgFee != null) {
      result = { feeTier: usdgFee, quoteSymbol: "USDG" };
    } else {
      const wethFee = await firstFeeTierAgainst(address, WETH_ADDRESS);
      result = wethFee != null ? { feeTier: wethFee, quoteSymbol: "WETH" } : { feeTier: null, quoteSymbol: "USDG" };
    }

    cache.set(address, result);
    return result;
  });
