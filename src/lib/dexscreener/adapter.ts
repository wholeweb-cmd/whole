import type { MarketData } from "@/lib/uniswap/market";
import type { DexPair } from "./api";

/**
 * DexScreener pair -> WHOLE market row.
 *
 * `decimals` is not carried by the DexScreener payload, so it is supplied by
 * the caller from the explorer's token list / the curated allow-list. It used
 * to be hardcoded to 18 here, which silently mis-scales every amount for the
 * 6-decimal stables on this chain (USDG, SYRUPUSDG).
 */
export function pairToMarket(pair: DexPair, decimals = 18): MarketData {
  const price = Number(pair.priceUsd);

  return {
    symbol: pair.baseToken.symbol,

    name: pair.baseToken.name,

    address: pair.baseToken.address.toLowerCase(),

    logo: pair.info?.imageUrl ?? null,

    pair: `${pair.baseToken.symbol}/${pair.quoteToken.symbol}`,

    price: Number.isFinite(price) && price > 0 ? price : null,

    tvl: pair.liquidity?.usd ?? null,

    volume24h: pair.volume?.h24 ?? null,

    change24h: pair.priceChange?.h24 ?? null,

    verified: true,

    decimals,

    feeTier: null,

    quoteSymbol: pair.quoteToken.symbol,

    poolAddress: pair.pairAddress,

    dexId: pair.dexId,
  };
}
