import { createServerFn } from "@tanstack/react-start";
import { readContract } from "viem/actions";
import { z } from "zod";

import { publicClient } from "@/lib/web3/client";
import { FACTORY_ABI } from "@/lib/uniswap/abi/factory";
import { UNISWAP } from "@/lib/uniswap/addresses";
import { getToken } from "@/lib/tokens/index";
import { candidateNodePaths, V3_FEE_TIERS, type Route } from "@/lib/uniswap/route";

// Pool discovery via factory event logs is incremental and hasn't necessarily
// reached an older token's pool yet, so the swap engine resolves a token's
// pool on demand: probe the factory for a token/USDG (then token/WETH) pool
// across the standard fee tiers and report which tier actually exists.

const ZERO = "0x0000000000000000000000000000000000000000";
const USDG_ADDRESS = (getToken("USDG")?.address ?? "").toLowerCase() as `0x${string}`;
const WETH_ADDRESS = (getToken("ETH")?.wrapped ?? "").toLowerCase() as `0x${string}`;

const inputSchema = z.object({ address: z.string() });
const routeInputSchema = z.object({
  tokenIn: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  tokenOut: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
});

const cache = new Map<string, { feeTier: number | null; quoteSymbol: string }>();
const routeCache = new Map<string, { routes: Route[]; expires: number }>();
const ROUTE_CACHE_MS = 5 * 60_000;
const MAX_ROUTE_CANDIDATES = 48;

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

async function firstFeeTierAgainst(
  token: `0x${string}`,
  quote: `0x${string}`,
): Promise<number | null> {
  const results = await Promise.all(V3_FEE_TIERS.map((fee) => getPool(token, quote, fee)));
  const idx = results.findIndex(Boolean);
  return idx === -1 ? null : V3_FEE_TIERS[idx];
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
      result =
        wethFee != null
          ? { feeTier: wethFee, quoteSymbol: "WETH" }
          : { feeTier: null, quoteSymbol: "USDG" };
    }

    cache.set(address, result);
    return result;
  });

function edgeKey(a: string, b: string) {
  return [a.toLowerCase(), b.toLowerCase()].sort().join(":");
}

function expandFees(feesByHop: number[][], index = 0, current: number[] = []): number[][] {
  if (index === feesByHop.length) return [current];
  return feesByHop[index].flatMap((fee) => expandFees(feesByHop, index + 1, [...current, fee]));
}

/**
 * Discover every useful V3 route between two tokens. Pool lookups are cached
 * server-side, so typing a new amount does not repeat factory reads.
 */
export const discoverSwapRoutes = createServerFn({ method: "GET" })
  .validator(routeInputSchema)
  .handler(async ({ data }): Promise<Route[]> => {
    const tokenIn = data.tokenIn.toLowerCase() as `0x${string}`;
    const tokenOut = data.tokenOut.toLowerCase() as `0x${string}`;
    const cacheKey = `${tokenIn}:${tokenOut}`;
    const cached = routeCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) return cached.routes;

    const paths = candidateNodePaths(tokenIn, tokenOut);
    const uniqueEdges = new Map<string, [`0x${string}`, `0x${string}`]>();

    for (const path of paths) {
      for (let index = 0; index < path.length - 1; index++) {
        const a = path[index];
        const b = path[index + 1];
        uniqueEdges.set(edgeKey(a, b), [a, b]);
      }
    }

    const feeEntries = await Promise.all(
      [...uniqueEdges.entries()].map(async ([key, [a, b]]) => {
        const exists = await Promise.all(V3_FEE_TIERS.map((fee) => getPool(a, b, fee)));
        return [key, V3_FEE_TIERS.filter((_, index) => exists[index])] as const;
      }),
    );
    const feesByEdge = new Map<string, readonly number[]>(feeEntries);

    const routes: Route[] = [];
    for (const nodes of paths) {
      const hopFees = nodes
        .slice(0, -1)
        .map((node, index) => [...(feesByEdge.get(edgeKey(node, nodes[index + 1])) ?? [])]);
      if (hopFees.some((fees) => fees.length === 0)) continue;

      for (const fees of expandFees(hopFees)) routes.push({ nodes, fees });
    }

    // Prefer fewer calls and lower pool fees if a pathological token has many
    // pools. The quoter still compares all normal direct and hub routes.
    const unique = new Map<string, Route>();
    for (const route of routes) {
      unique.set(`${route.nodes.join(">")}|${route.fees.join(",")}`, route);
    }
    const ranked = [...unique.values()]
      .sort((a, b) => a.fees.length - b.fees.length || sum(a.fees) - sum(b.fees))
      .slice(0, MAX_ROUTE_CANDIDATES);

    routeCache.set(cacheKey, { routes: ranked, expires: Date.now() + ROUTE_CACHE_MS });
    return ranked;
  });

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}
