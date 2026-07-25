// ---------------------------------------------------------------------------
// The markets model.
//
// Token identity (name, ticker, decimals, logo) comes from the block
// explorer's token list; live trading numbers (price, liquidity, 24h volume
// and change) come from DexScreener, which indexes this chain's Uniswap
// pools directly.
//
// Both sources are batched and cached. A refresh of the full ~300-token
// universe costs ~10 HTTP requests rather than one per token, and repeat
// callers inside the TTL are served from memory - the markets list, the
// portfolio valuation and the assistant's context block all share it.
// ---------------------------------------------------------------------------

import {
  getAllPairsFor,
  getDexPair,
  getDexPairs,
  getQuoteSideMarket,
  getQuoteSidePriceUSD,
} from "@/lib/dexscreener/api";
import { pairToMarket } from "@/lib/dexscreener/adapter";

import { getToken } from "@/lib/tokens/index";
import { ensureTokenListWarmed, getAllCachedTokenMeta, getTokenMeta } from "./tokenMeta";

export interface MarketData {
  symbol: string;
  name: string;
  address: string;
  logo: string | null;
  pair: string;
  price: number | null;
  tvl: number | null;
  change24h: number | null;
  volume24h: number | null;
  verified: boolean;
  decimals: number;
  feeTier: number | null;
  quoteSymbol: string;
  /** DexScreener pool address, used to embed the pool's chart. */
  poolAddress: string | null;
  dexId: string | null;
}

const STABLE_SYMBOL = "USDG";

/** Resolve a curated symbol to the address that actually trades on-chain. */
function tradedAddress(symbol: string): string | null {
  const token = getToken(symbol);
  if (!token) return null;
  return (token.isNative ? (token.wrapped ?? token.address) : token.address).toLowerCase();
}

const STABLE_ADDRESS = tradedAddress(STABLE_SYMBOL);

// Quote-only tokens need an extra un-batchable request each to price, so only
// the most traded few get one. In practice that's WETH plus the occasional
// pool-base asset; the long tail keeps the explorer's quoted price.
const QUOTE_SIDE_LOOKUP_BUDGET = 6;

// --- markets list ----------------------------------------------------------

const MARKETS_TTL_MS = 30_000;

let marketsCache: { data: MarketData[]; expires: number } | null = null;
let marketsInFlight: Promise<MarketData[]> | null = null;

async function buildMarkets(): Promise<MarketData[]> {
  await ensureTokenListWarmed();

  // The explorer list is market-cap sorted and already filtered to tokens it
  // recognizes (has a logo and a quoted price), which keeps the obvious
  // impersonator tokens out of the universe.
  const metas = getAllCachedTokenMeta().filter((meta) => meta.recognized);
  if (metas.length === 0) return [];

  const decimalsByAddress = new Map(
    metas.map((meta) => [meta.address.toLowerCase(), meta.decimals]),
  );

  const pairs = await getDexPairs(metas.map((meta) => meta.address));

  const markets: MarketData[] = [];
  const quoteOnly: typeof metas = [];

  for (const meta of metas) {
    const address = meta.address.toLowerCase();
    const pair = pairs.get(address);

    if (pair) {
      markets.push(pairToMarket(pair, decimalsByAddress.get(address) ?? meta.decimals));
    } else if (meta.priceUSD != null) {
      // No pool quotes this token as the base side (WETH is the notable case
      // on this chain). It still belongs in the workspace, so it's filled in
      // from the quote side below or from the explorer's own price.
      quoteOnly.push(meta);
    }
  }

  // Recover real pool stats for the busiest quote-only tokens.
  const ranked = [...quoteOnly].sort((a, b) => (b.volume24h ?? 0) - (a.volume24h ?? 0));
  const looked = ranked.slice(0, QUOTE_SIDE_LOOKUP_BUDGET);

  const summaries = new Map(
    await Promise.all(
      looked.map(
        async (meta) =>
          [
            meta.address.toLowerCase(),
            await getQuoteSideMarket(meta.address, STABLE_ADDRESS ?? undefined).catch(() => null),
          ] as const,
      ),
    ),
  );

  for (const meta of quoteOnly) {
    const address = meta.address.toLowerCase();
    const summary = summaries.get(address) ?? null;

    markets.push({
      symbol: meta.symbol,
      name: meta.name,
      address,
      logo: meta.logo,
      pair: `${meta.symbol}/${summary?.counterSymbol || STABLE_SYMBOL}`,
      price: summary?.priceUSD ?? meta.priceUSD,
      tvl: summary?.liquidityUSD ?? null,
      // The pool's `priceChange` describes its base token, not this one, so
      // there is no honest 24h change to report here.
      change24h: null,
      volume24h: summary?.volume24h ?? meta.volume24h,
      verified: true,
      decimals: meta.decimals,
      feeTier: null,
      quoteSymbol: summary?.counterSymbol || STABLE_SYMBOL,
      poolAddress: summary?.poolAddress ?? null,
      dexId: null,
    });
  }

  return markets.sort((a, b) => (b.volume24h ?? 0) - (a.volume24h ?? 0));
}

/**
 * The full markets list.
 *
 * Serves cached data instantly and refreshes in the background once stale, so
 * the UI's 15s poll never waits on the upstream APIs. Only a cold cache
 * blocks.
 */
export async function getAllMarketData(): Promise<MarketData[]> {
  if (marketsCache && marketsCache.expires > Date.now()) return marketsCache.data;

  if (!marketsInFlight) {
    marketsInFlight = buildMarkets()
      .then((data) => {
        // Keep serving the last good snapshot if a refresh comes back empty
        // (upstream hiccup) rather than blanking the workspace.
        if (data.length > 0) {
          marketsCache = { data, expires: Date.now() + MARKETS_TTL_MS };
        }
        return marketsCache?.data ?? data;
      })
      .catch(() => marketsCache?.data ?? [])
      .finally(() => {
        marketsInFlight = null;
      });
  }

  // Stale data beats a slow response; only a cold start waits.
  if (marketsCache) return marketsCache.data;
  return marketsInFlight;
}

// --- single market ---------------------------------------------------------

/**
 * One market by ticker.
 *
 * Resolves against the whole discovered universe, not just the curated
 * allow-list - otherwise every token on the markets page except ETH/WETH/USDG
 * opened to an empty detail view.
 */
export async function getMarketData(symbol: string): Promise<MarketData | null> {
  const wanted = symbol.trim().toUpperCase();
  if (!wanted) return null;

  const markets = await getAllMarketData();

  // Prefer the deepest market when several tokens share a ticker.
  let match: MarketData | null = null;
  for (const market of markets) {
    if (market.symbol.toUpperCase() !== wanted) continue;
    if (!match || (market.tvl ?? 0) > (match.tvl ?? 0)) match = market;
  }
  if (match) return match;

  // Curated symbols (and raw 0x addresses) may not be in the explorer's
  // recognized list - resolve them directly.
  const address = wanted.startsWith("0X") ? symbol.toLowerCase() : tradedAddress(wanted);
  if (!address) return null;

  const meta = await getTokenMeta(address as `0x${string}`);
  const pair = await getDexPair(address);

  if (pair) return pairToMarket(pair, meta?.decimals ?? 18);

  const price = (await getQuoteSidePriceUSD(address)) ?? meta?.priceUSD ?? null;
  if (price == null) return null;

  const curated = getToken(wanted);

  return {
    symbol: curated?.symbol ?? meta?.symbol ?? wanted,
    name: curated?.name ?? meta?.name ?? wanted,
    address,
    logo: meta?.logo ?? null,
    pair: `${curated?.symbol ?? wanted}/${STABLE_SYMBOL}`,
    price,
    tvl: null,
    change24h: null,
    volume24h: meta?.volume24h ?? null,
    verified: Boolean(curated) || Boolean(meta?.recognized),
    decimals: curated?.decimals ?? meta?.decimals ?? 18,
    feeTier: curated?.feeTier ?? null,
    quoteSymbol: STABLE_SYMBOL,
    poolAddress: await deepestPoolAddress(address),
    dexId: null,
  };
}

/** Deepest pool touching this address, for charting a quote-only token. */
async function deepestPoolAddress(address: string): Promise<string | null> {
  const pairs = await getAllPairsFor(address);
  let best: { pairAddress: string; usd: number } | null = null;

  for (const pair of pairs) {
    const usd = pair.liquidity?.usd ?? 0;
    if (!best || usd > best.usd) best = { pairAddress: pair.pairAddress, usd };
  }

  return best?.pairAddress ?? null;
}

// --- pricing ---------------------------------------------------------------

const PRICE_TTL_MS = 30_000;
const priceCache = new Map<string, { value: number | null; expires: number }>();

/**
 * Spot USD price for a ticker.
 *
 * Used to value wallet balances and unclaimed LP fees, so it has to be right
 * for WETH - which trades only as the quote side of its pools and therefore
 * has to be priced by inverting a pool rather than read off one directly.
 */
export async function getTokenPriceUSD(symbol: string): Promise<number | null> {
  const wanted = symbol.trim().toUpperCase();

  const cached = priceCache.get(wanted);
  if (cached && cached.expires > Date.now()) return cached.value;

  const price = await resolvePrice(wanted);
  priceCache.set(wanted, { value: price, expires: Date.now() + PRICE_TTL_MS });
  return price;
}

async function resolvePrice(symbol: string): Promise<number | null> {
  const address = tradedAddress(symbol);

  if (address) {
    const pair = await getDexPair(address);
    if (pair) {
      const price = Number(pair.priceUsd);
      if (Number.isFinite(price) && price > 0) return price;
    }

    const inverted = await getQuoteSidePriceUSD(address);
    if (inverted != null) return inverted;

    const meta = await getTokenMeta(address as `0x${string}`);
    if (meta?.priceUSD != null) return meta.priceUSD;

    // A stable with no readable pool is still worth about a dollar; better
    // than dropping it out of the portfolio total entirely.
    return symbol === STABLE_SYMBOL ? 1 : null;
  }

  // Not a curated token - fall back to the discovered universe.
  const market = await getMarketData(symbol);
  return market?.price ?? null;
}
