import { readContract } from "viem/actions";
import { decodeEventLog, formatUnits, parseUnits } from "viem";

import { publicClient } from "@/lib/web3/client";
import { CHAIN } from "@/lib/config/chain";
import { getWrappedAddress } from "@/lib/tokens/helpers";
import { getToken, TOKENS } from "@/lib/tokens/index";

import { ERC20_ABI } from "./abi/erc20";
import { FACTORY_ABI } from "./abi/factory";
import { UNISWAP } from "./addresses";
import { quoteExactInputSingle } from "./read";
import {
  ensureTokenListWarmed,
  getAllCachedTokenMeta,
  getCachedTokenMeta,
  getTokenMeta,
} from "./tokenMeta";

// USDG is the chain's stablecoin - used as the USD pricing base. WETH is the
// secondary pricing base for tokens that only pool against the native asset
// (the common case for freshly-launched/meme tokens). All on-chain, no
// external price feed or indexer.
const STABLE_SYMBOL = "USDG";
const STABLE_ADDRESS = getWrappedAddress(STABLE_SYMBOL).toLowerCase() as `0x${string}`;
const WETH_ADDRESS = getWrappedAddress("ETH").toLowerCase() as `0x${string}`;

// ---------------------------------------------------------------------------
// Pool discovery
//
// There is no subgraph for Robinhood Chain, so "every market" is discovered
// from the factory's PoolCreated event log rather than a hardcoded token
// list - this is what actually surfaces meme coins and anything else someone
// has created a pool for. Robinhood Chain is already 17M+ blocks in, so
// scanning that via raw eth_getLogs (chunked by block range) is impractical
// and hammers a rate-limited public RPC. Instead this reads the same events
// pre-indexed through the block explorer's REST API, which supports cheap
// cursor pagination with no block-range guessing.
//
// Each scan cycle does two things in one paginated walk, newest page first:
//  1. Picks up anything created since the last scan (usually just page 1).
//  2. Continues backfilling older history from where the previous cycle left
//     off, bounded per call so one request doesn't run indefinitely - full
//     history is reached gradually across several scan cycles.
// ---------------------------------------------------------------------------

interface RawPool {
  pool: `0x${string}`;
  token0: `0x${string}`;
  token1: `0x${string}`;
  fee: number;
}

interface LogsPage {
  items: Array<{ topics: (string | null)[]; data: string }>;
  next_page_params: Record<string, string | number> | null;
}

const LOGS_ENDPOINT = `${CHAIN.explorer}/api/v2/addresses/${UNISWAP.factory}/logs`;
// Pages per scan cycle - keeps one invocation fast while still making steady
// progress backfilling a chain with a long history.
const PAGE_BUDGET = 10;
const POOL_RESCAN_INTERVAL_MS = 30_000;

const poolsByAddress = new Map<`0x${string}`, RawPool>();
let backfillCursor: Record<string, string | number> | undefined;
let backfillComplete = false;
let lastScanAt = 0;
let scanInFlight: Promise<void> | null = null;

async function fetchLogsPage(cursor?: Record<string, string | number>): Promise<LogsPage | null> {
  const url = new URL(LOGS_ENDPOINT);
  if (cursor) {
    for (const [key, value] of Object.entries(cursor)) {
      url.searchParams.set(key, String(value));
    }
  }

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return null;
    return (await res.json()) as LogsPage;
  } catch {
    return null;
  }
}

function parsePoolCreated(item: LogsPage["items"][number]): RawPool | null {
  try {
    const { args } = decodeEventLog({
      abi: FACTORY_ABI,
      eventName: "PoolCreated",
      topics: item.topics as [`0x${string}`, ...`0x${string}`[]],
      data: item.data as `0x${string}`,
    });

    if (!args.token0 || !args.token1 || !args.pool) return null;

    return {
      pool: args.pool.toLowerCase() as `0x${string}`,
      token0: args.token0.toLowerCase() as `0x${string}`,
      token1: args.token1.toLowerCase() as `0x${string}`,
      fee: Number(args.fee ?? 0),
    };
  } catch {
    return null;
  }
}

function ingest(page: LogsPage): void {
  for (const item of page.items) {
    const parsed = parsePoolCreated(item);
    if (parsed) poolsByAddress.set(parsed.pool, parsed);
  }
}

async function scanNewPools(): Promise<void> {
  // Pools are deduped by address, so it's always safe (and cheap) to just
  // re-check the newest page every cycle rather than tracking exactly what
  // "new since last time" means - anything already known is a harmless
  // no-op overwrite.
  const freshPage = await fetchLogsPage(undefined);
  if (freshPage) ingest(freshPage);

  if (backfillComplete) return;

  // Continue backfilling older history from wherever the last cycle left
  // off, bounded per call so one scan can't run indefinitely.
  for (let pages = 0; pages < PAGE_BUDGET; pages++) {
    const page = await fetchLogsPage(backfillCursor);
    if (!page) break;

    ingest(page);

    if (!page.next_page_params) {
      backfillComplete = true;
      break;
    }
    backfillCursor = page.next_page_params;
  }
}

// Same idea as CALL_TIME_BUDGET_MS below - a cold-start backfill can take
// many pages to finish, so don't block the response on it. Whatever's been
// ingested by the time the budget runs out is returned now; the scan keeps
// running in the background and the rest shows up on a later poll.
const SCAN_WAIT_BUDGET_MS = 6_000;

async function ensurePoolsScanned(): Promise<RawPool[]> {
  const now = Date.now();

  if (now - lastScanAt > POOL_RESCAN_INTERVAL_MS && !scanInFlight) {
    lastScanAt = now;
    scanInFlight = scanNewPools().finally(() => {
      scanInFlight = null;
    });
  }

  if (scanInFlight) {
    await Promise.race([
      scanInFlight,
      new Promise((resolve) => setTimeout(resolve, SCAN_WAIT_BUDGET_MS)),
    ]);
  }

  return [...poolsByAddress.values()];
}

// ---------------------------------------------------------------------------
// Token identity
//
// Resolved from three sources, best first:
//   1. The curated allow-list (src/lib/tokens/index.ts) - trusted, verified.
//   2. The block explorer's token API (via tokenMeta.ts) - real name, ticker,
//      decimals, logo, USD price, and 24h volume, and works even when the RPC
//      doesn't. This is what turns a bare pool address into a real listing.
//   3. On-chain ERC-20 reads - last-resort fallback if the explorer has no
//      record of the token (rare).
// ---------------------------------------------------------------------------

interface ResolvedToken {
  symbol: string;
  name: string;
  decimals: number;
  logo: string | null;
  priceUSD: number | null;
  volume24h: number | null;
  // Curated allow-list, or recognized as a real priced token by the
  // explorer (has a logo and a market price) - surfaced so the UI can flag
  // everything else as unvetted.
  verified: boolean;
}

const onchainMetaCache = new Map<string, { symbol: string; name: string; decimals: number }>();

function curatedToken(address: `0x${string}`) {
  const lower = address.toLowerCase();
  // Native ETH's own pseudo-address never appears on a pool side (pools
  // always hold WETH), so matching on `address` only is sufficient here.
  return TOKENS.find((t) => !t.isNative && t.address.toLowerCase() === lower) ?? null;
}

async function onchainMeta(address: `0x${string}`) {
  const lower = address.toLowerCase();
  const cached = onchainMetaCache.get(lower);
  if (cached) return cached;

  let meta: { symbol: string; name: string; decimals: number };
  try {
    const [symbol, name, decimals] = await Promise.all([
      readContract(publicClient, { address, abi: ERC20_ABI, functionName: "symbol" }),
      readContract(publicClient, { address, abi: ERC20_ABI, functionName: "name" }),
      readContract(publicClient, { address, abi: ERC20_ABI, functionName: "decimals" }),
    ]);
    meta = { symbol: String(symbol), name: String(name), decimals: Number(decimals) };
  } catch {
    const short = `${address.slice(0, 6)}…${address.slice(-4)}`;
    meta = { symbol: short, name: short, decimals: 18 };
  }

  onchainMetaCache.set(lower, meta);
  return meta;
}

async function resolveToken(address: `0x${string}`): Promise<ResolvedToken> {
  const curated = curatedToken(address);
  const explorer = await getTokenMeta(address);

  if (curated) {
    return {
      symbol: curated.symbol,
      name: curated.name,
      decimals: curated.decimals,
      logo: explorer?.logo ?? null,
      priceUSD: explorer?.priceUSD ?? null,
      volume24h: explorer?.volume24h ?? null,
      verified: true,
    };
  }

  if (explorer) {
    return {
      symbol: explorer.symbol,
      name: explorer.name,
      decimals: explorer.decimals,
      logo: explorer.logo,
      priceUSD: explorer.priceUSD,
      volume24h: explorer.volume24h,
      verified: explorer.recognized,
    };
  }

  const chain = await onchainMeta(address);
  return { ...chain, logo: null, priceUSD: null, volume24h: null, verified: false };
}

// ---------------------------------------------------------------------------
// Grouping + pricing
// ---------------------------------------------------------------------------

interface PoolGroup {
  baseAddress: `0x${string}`;
  // null = neither side is USDG or WETH, so there's no on-chain route to a
  // USD price - the market is still listed, just without price/TVL.
  quoteAddress: `0x${string}` | null;
  otherAddress: `0x${string}`;
  pool: `0x${string}`;
  fee: number;
}

function quotePreference(quote: `0x${string}` | null): number {
  if (quote === STABLE_ADDRESS) return 2;
  if (quote === WETH_ADDRESS) return 1;
  return 0;
}

/** One group per distinct base token, keeping whichever pool has the most direct USD route. */
function classifyPools(pools: RawPool[]): PoolGroup[] {
  const groups = new Map<string, PoolGroup>();

  for (const p of pools) {
    let base: `0x${string}`;
    let quote: `0x${string}` | null;

    if (p.token0 === STABLE_ADDRESS || p.token1 === STABLE_ADDRESS) {
      quote = STABLE_ADDRESS;
      base = p.token0 === STABLE_ADDRESS ? p.token1 : p.token0;
    } else if (p.token0 === WETH_ADDRESS || p.token1 === WETH_ADDRESS) {
      quote = WETH_ADDRESS;
      base = p.token0 === WETH_ADDRESS ? p.token1 : p.token0;
    } else {
      // Neither side has a USD route - park it under the lexicographically
      // smaller address so the same pool isn't emitted as two markets.
      base = p.token0 < p.token1 ? p.token0 : p.token1;
      quote = null;
    }

    const other = base === p.token0 ? p.token1 : p.token0;
    const existing = groups.get(base);

    if (!existing || quotePreference(quote) > quotePreference(existing.quoteAddress)) {
      groups.set(base, { baseAddress: base, quoteAddress: quote, otherAddress: other, pool: p.pool, fee: p.fee });
    }
  }

  return [...groups.values()];
}

export interface MarketData {
  symbol: string;
  name: string;
  address: string;
  logo: string | null;
  pair: string;
  price: number | null;
  tvl: number | null;
  // Sourced from the explorer's indexer when available (24h change still has
  // no source, so it stays null rather than being fabricated).
  change24h: number | null;
  volume24h: number | null;
  // False for anything not on the curated allow-list and not recognized by
  // the explorer as a real priced token - callers should treat as unvetted.
  verified: boolean;
  // Routing metadata for the swap engine: the token's own decimals, the fee
  // tier of its best pool, and which asset it pools against (USDG or WETH).
  // feeTier is null when no pool has been discovered yet (not yet swappable).
  decimals: number;
  feeTier: number | null;
  quoteSymbol: string;
}

async function computeMarket(group: PoolGroup, wethPriceUSD: number | null): Promise<MarketData> {
  const base = await resolveToken(group.baseAddress);

  const quoteIsStable = group.quoteAddress === STABLE_ADDRESS;
  const quoteSymbol = group.quoteAddress
    ? quoteIsStable
      ? STABLE_SYMBOL
      : "WETH"
    : (await resolveToken(group.otherAddress)).symbol;

  // Price: prefer the explorer's spot USD price (no RPC needed), fall back to
  // an on-chain quote against the pool's USDG/WETH side.
  let price = base.priceUSD;

  if (price == null && group.quoteAddress) {
    const quoteDecimals = quoteIsStable ? (getToken(STABLE_SYMBOL)?.decimals ?? 18) : 18;
    try {
      const oneUnit = parseUnits("1", base.decimals);
      const result = await quoteExactInputSingle(
        group.baseAddress,
        group.quoteAddress,
        oneUnit,
        group.fee,
      );
      const quoteAmount = Number(formatUnits(result[0], quoteDecimals));
      price = quoteIsStable ? quoteAmount : wethPriceUSD != null ? quoteAmount * wethPriceUSD : null;
    } catch {
      price = null;
    }
  }

  // TVL from the pool's real on-chain token balances (needs RPC; null if
  // unreachable). Only attempted when we have a USD-routed quote side.
  let tvl: number | null = null;

  if (group.quoteAddress) {
    const quoteDecimals = quoteIsStable ? (getToken(STABLE_SYMBOL)?.decimals ?? 18) : 18;
    try {
      const [baseBalance, quoteBalance] = await Promise.all([
        readContract(publicClient, {
          address: group.baseAddress,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [group.pool],
        }),
        readContract(publicClient, {
          address: group.quoteAddress,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [group.pool],
        }),
      ]);

      const baseSideUSD = price != null ? Number(formatUnits(baseBalance, base.decimals)) * price : 0;
      const quoteAmount = Number(formatUnits(quoteBalance, quoteDecimals));
      const quoteSideUSD = quoteIsStable
        ? quoteAmount
        : wethPriceUSD != null
          ? quoteAmount * wethPriceUSD
          : 0;

      tvl = baseSideUSD + quoteSideUSD;
    } catch {
      tvl = null;
    }
  }

  return {
    symbol: base.symbol,
    name: base.name,
    address: group.baseAddress,
    logo: base.logo,
    pair: `${base.symbol}/${quoteSymbol}`,
    price,
    tvl,
    change24h: null,
    volume24h: base.volume24h,
    verified: base.verified,
    decimals: base.decimals,
    feeTier: group.fee,
    quoteSymbol,
  };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index++;
      results[current] = await fn(items[current]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

// Pricing/TVL is cached per token (not as one all-or-nothing list) so a
// large token universe doesn't make every request as slow as the slowest
// token. Each call only (re)prices a bounded number of stale/never-priced
// tokens; everything else is served from cache - a token discovered but not
// yet priced still appears in the list (never dropped), just without
// price/TVL until a later call catches up to it.
interface CachedMarket {
  data: MarketData;
  computedAt: number;
}

const marketCache = new Map<`0x${string}`, CachedMarket>();
const MARKET_TTL_MS = 60_000;
// Bounds how many tokens get (re)priced per call - keeps response time
// predictable regardless of how many pools exist in total.
const PRICE_BUDGET_PER_CALL = 40;
const PRICE_CONCURRENCY = 8;

function isStale(address: `0x${string}`, now: number): boolean {
  const cached = marketCache.get(address);
  return !cached || now - cached.computedAt > MARKET_TTL_MS;
}

// Hard wall-clock budget for one call, independent of how slow the RPC is -
// if pricing can't keep up, the page still responds promptly with whatever
// is cached, and pricing keeps running in the background to fill the cache
// in for the next poll rather than blocking this one.
const CALL_TIME_BUDGET_MS = 6_000;

/**
 * Every tradeable market on Robinhood Chain, merged from two sources:
 *   - the explorer's token list (all real, priced tokens on the chain, with
 *     names/logos/prices/volume) - this is what makes the listing rich and
 *     is the source of the recognized/verified markets, and
 *   - Uniswap pools discovered from the factory (adds the on-chain pair, fee
 *     and TVL, and surfaces brand-new tokens not yet in the token list).
 */
export async function getAllMarketData(): Promise<MarketData[]> {
  await ensureTokenListWarmed();

  const pools = await ensurePoolsScanned();
  const groups = classifyPools(pools);
  const now = Date.now();

  const poolByBase = new Map<`0x${string}`, PoolGroup>();
  for (const g of groups) poolByBase.set(g.baseAddress, g);

  // Candidate universe: every recognized token from the explorer's list,
  // plus every token that has a discovered pool (covers fresh tokens the
  // list hasn't picked up yet). USDG is the unit of account, not a market.
  const candidates = new Set<`0x${string}`>();
  for (const meta of getAllCachedTokenMeta()) {
    if (meta.recognized && meta.address !== STABLE_ADDRESS) candidates.add(meta.address);
  }
  for (const base of poolByBase.keys()) {
    if (base !== STABLE_ADDRESS) candidates.add(base);
  }

  const addresses = [...candidates];

  // Spend the RPC-bound TVL budget on the highest-value markets first.
  const byValue = addresses.sort((a, b) => valueScore(b) - valueScore(a));

  const wethPriceUSD = getCachedTokenMeta(WETH_ADDRESS)?.priceUSD ?? null;

  const enrich = (async () => {
    try {
      const stale = byValue
        .filter((addr) => poolByBase.has(addr) && isStale(addr, now))
        .slice(0, PRICE_BUDGET_PER_CALL);

      const computed = await mapWithConcurrency(stale, PRICE_CONCURRENCY, (addr) =>
        computeMarket(poolByBase.get(addr)!, wethPriceUSD),
      );

      stale.forEach((addr, i) => marketCache.set(addr, { data: computed[i], computedAt: now }));
    } catch {
      // Best-effort - partial enrichment is already cached.
    }
  })();

  await Promise.race([enrich, new Promise((resolve) => setTimeout(resolve, CALL_TIME_BUDGET_MS))]);

  // Build every candidate: RPC-enriched (with TVL) where computed, otherwise
  // from the explorer's cached identity/price - always a real name/logo/price
  // for recognized tokens, just without TVL until enrichment reaches it.
  const markets = addresses.map(
    (addr) => marketCache.get(addr)?.data ?? fromCachedMeta(addr, poolByBase.get(addr)),
  );

  return markets.sort(compareMarkets);
}

/** Ranks a token by the explorer's known trading value, for enrichment order. */
function valueScore(address: `0x${string}`): number {
  if (address === WETH_ADDRESS) return Number.MAX_SAFE_INTEGER;
  const meta = getCachedTokenMeta(address);
  if (!meta) return 0;
  return meta.volume24h ?? meta.marketCap ?? (meta.priceUSD != null ? 1 : 0);
}

function compareMarkets(a: MarketData, b: MarketData): number {
  if (a.verified !== b.verified) return a.verified ? -1 : 1;

  const av = a.volume24h ?? -1;
  const bv = b.volume24h ?? -1;
  if (av !== bv) return bv - av;

  const at = a.tvl ?? -1;
  const bt = b.tvl ?? -1;
  if (at !== bt) return bt - at;

  const ap = a.price != null ? 1 : 0;
  const bp = b.price != null ? 1 : 0;
  if (ap !== bp) return bp - ap;

  return a.symbol.localeCompare(b.symbol);
}

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function quoteSymbolFor(address: `0x${string}`, group?: PoolGroup): string {
  if (!group) return address === WETH_ADDRESS ? STABLE_SYMBOL : STABLE_SYMBOL;
  if (group.quoteAddress === STABLE_ADDRESS) return STABLE_SYMBOL;
  if (group.quoteAddress === WETH_ADDRESS) return "WETH";
  const other = getCachedTokenMeta(group.otherAddress);
  return other?.symbol ?? shortAddr(group.otherAddress);
}

/** A listing built from the explorer's cached identity/price only - no RPC, no TVL. */
function fromCachedMeta(address: `0x${string}`, group?: PoolGroup): MarketData {
  const curated = curatedToken(address);
  const meta = getCachedTokenMeta(address);
  const symbol = curated?.symbol ?? meta?.symbol ?? shortAddr(address);

  return {
    symbol,
    name: curated?.name ?? meta?.name ?? shortAddr(address),
    address,
    logo: meta?.logo ?? null,
    pair: `${symbol}/${quoteSymbolFor(address, group)}`,
    price: meta?.priceUSD ?? null,
    tvl: null,
    change24h: null,
    volume24h: meta?.volume24h ?? null,
    verified: curated != null || (meta?.recognized ?? false),
    decimals: curated?.decimals ?? meta?.decimals ?? 18,
    feeTier: group?.fee ?? null,
    quoteSymbol: quoteSymbolFor(address, group),
  };
}

export async function getMarketData(symbol: string): Promise<MarketData | null> {
  const all = await getAllMarketData();
  return all.find((m) => m.symbol.toLowerCase() === symbol.toLowerCase()) ?? null;
}

/** USD price of one unit of a curated token symbol (used for portfolio/fee valuation). */
export async function getTokenPriceUSD(symbol: string): Promise<number | null> {
  if (symbol === STABLE_SYMBOL) return 1;

  const token = getToken(symbol);
  if (!token) return null;

  const address = (
    token.isNative ? (token.wrapped ?? token.address) : token.address
  ).toLowerCase() as `0x${string}`;

  // Prefer the explorer's spot price for this exact address (cheap, no RPC,
  // no full market scan). Fall back to the pool-derived market price only if
  // the explorer doesn't recognize the token.
  const meta = await getTokenMeta(address);
  if (meta?.priceUSD != null) return meta.priceUSD;

  const all = await getAllMarketData();
  const match = all.find((m) => m.address.toLowerCase() === address);
  return match?.price ?? null;
}
