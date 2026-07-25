import type { PoolInfo } from "@/types/pool";

const API = "https://api.dexscreener.com/latest";

export async function resolvePool(tokenAddress: string): Promise<PoolInfo | null> {
  const response = await fetch(`${API}/dex/tokens/${tokenAddress}`);

  if (!response.ok) {
    return null;
  }

  const json = await response.json();

  const pairs = json.pairs ?? [];

  if (!pairs.length) {
    return null;
  }

  const best = [...pairs].sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0];

  return {
    poolAddress: best.pairAddress,

    dexId: best.dexId,

    chainId: best.chainId,

    priceUsd: Number(best.priceUsd ?? 0),

    liquidity: Number(best.liquidity?.usd ?? 0),

    volume24h: Number(best.volume?.h24 ?? 0),

    fdv: Number(best.fdv ?? 0),

    marketCap: Number(best.marketCap ?? 0),

    baseToken: {
      address: best.baseToken.address,

      symbol: best.baseToken.symbol,

      name: best.baseToken.name,
    },

    quoteToken: {
      address: best.quoteToken.address,

      symbol: best.quoteToken.symbol,

      name: best.quoteToken.name,
    },
  };
}
