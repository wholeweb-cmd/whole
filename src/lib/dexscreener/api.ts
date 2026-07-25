// ---------------------------------------------------------------------------
// DexScreener client.
//
// Two endpoints are used:
//
//   tokens/v1/{chain}/{addr,...}  - batched, up to 30 addresses per request.
//     Returns the pools each address trades in. This is the workhorse for
//     building the markets list; the previous per-token loop needed one
//     request per token (~300 sequential round-trips per refresh).
//
//   latest/dex/tokens/{addr}      - every pool touching a single address,
//     including ones where it is the *quote* side. Needed to price tokens
//     that are never the base token of a pool (WETH on this chain), which
//     the batch endpoint returns nothing for.
//
// A pair is only a valid price source for the address that is its BASE
// token: `priceUsd` describes the base side. Picking pairs[0] blindly - as
// this module used to - resolves WETH to whichever memecoin happens to be
// quoted against it, so every lookup here filters on base address first.
// ---------------------------------------------------------------------------

const API = "https://api.dexscreener.com";
const CHAIN_ID = "robinhood";

// The batch endpoint's documented ceiling. Exceeding it drops the overflow.
const BATCH_SIZE = 30;
// DexScreener rate-limits at 300 req/min; a handful in flight stays well
// under that while still collapsing a ~300-token refresh into ~2 rounds.
const BATCH_CONCURRENCY = 4;

const PAIR_TTL_MS = 30_000;
const REQUEST_TIMEOUT_MS = 8_000;

export interface DexPair {
  chainId: string;
  dexId: string;

  pairAddress: string;

  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };

  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };

  /** USD price of the *base* token. */
  priceUsd: string;

  /** Price of the base token denominated in the quote token. */
  priceNative?: string;

  liquidity?: {
    usd?: number;
  };

  volume?: {
    h24?: number;
    h6?: number;
    h1?: number;
  };

  priceChange?: {
    h24?: number;
  };

  fdv?: number;

  marketCap?: number;

  labels?: string[];

  info?: {
    imageUrl?: string;
  };
}

interface CacheEntry<T> {
  value: T;
  expires: number;
}

/** Best base-side pair per token address. `null` = looked up, none exists. */
const basePairCache = new Map<string, CacheEntry<DexPair | null>>();

/** Every pair touching an address, used for quote-side price derivation. */
const allPairsCache = new Map<string, CacheEntry<DexPair[]>>();

/** In-flight requests, keyed by URL, so concurrent callers share one fetch. */
const inFlight = new Map<string, Promise<unknown>>();

function fresh<T>(entry: CacheEntry<T> | undefined): entry is CacheEntry<T> {
  return entry !== undefined && entry.expires > Date.now();
}

function liquidityOf(pair: DexPair): number {
  return pair.liquidity?.usd ?? 0;
}

/** Deepest pool wins - the shallow ones carry unreliable prices. */
function deepest(pairs: DexPair[]): DexPair | null {
  let best: DexPair | null = null;
  for (const pair of pairs) {
    if (!best || liquidityOf(pair) > liquidityOf(best)) best = pair;
  }
  return best;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  const existing = inFlight.get(url);
  if (existing) return existing as Promise<T | null>;

  const request = (async () => {
    try {
      const res = await fetch(url, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!res.ok) return null;
      return (await res.json()) as T;
    } catch {
      return null;
    } finally {
      inFlight.delete(url);
    }
  })();

  inFlight.set(url, request);
  return request;
}

/** Run `fn` over `items` with a bounded number of requests in flight. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * Best base-side pair for each address, batched and cached.
 * Addresses with no pool where they are the base resolve to `null`.
 */
export async function getDexPairs(addresses: string[]): Promise<Map<string, DexPair | null>> {
  const result = new Map<string, DexPair | null>();
  const missing: string[] = [];

  for (const raw of addresses) {
    const address = raw.toLowerCase();
    if (result.has(address)) continue;

    const cached = basePairCache.get(address);
    if (fresh(cached)) {
      result.set(address, cached.value);
    } else {
      result.set(address, null);
      missing.push(address);
    }
  }

  if (missing.length === 0) return result;

  const batches = chunk(missing, BATCH_SIZE);

  const responses = await mapWithConcurrency(batches, BATCH_CONCURRENCY, (batch) =>
    fetchJson<DexPair[]>(`${API}/tokens/v1/${CHAIN_ID}/${batch.join(",")}`),
  );

  // Group every returned pair under its base token, then keep the deepest.
  const byBase = new Map<string, DexPair[]>();
  for (const pairs of responses) {
    for (const pair of pairs ?? []) {
      const base = pair.baseToken?.address?.toLowerCase();
      if (!base) continue;
      const bucket = byBase.get(base);
      if (bucket) bucket.push(pair);
      else byBase.set(base, [pair]);
    }
  }

  const expires = Date.now() + PAIR_TTL_MS;
  for (const address of missing) {
    const best = deepest(byBase.get(address) ?? []);
    basePairCache.set(address, { value: best, expires });
    result.set(address, best);
  }

  return result;
}

/** Best base-side pair for a single address. */
export async function getDexPair(address: string): Promise<DexPair | null> {
  const pairs = await getDexPairs([address]);
  return pairs.get(address.toLowerCase()) ?? null;
}

/** Every pool touching this address, base side or quote side. */
export async function getAllPairsFor(address: string): Promise<DexPair[]> {
  const key = address.toLowerCase();

  const cached = allPairsCache.get(key);
  if (fresh(cached)) return cached.value;

  const json = await fetchJson<{ pairs?: DexPair[] | null }>(`${API}/latest/dex/tokens/${key}`);
  const pairs = json?.pairs ?? [];

  allPairsCache.set(key, { value: pairs, expires: Date.now() + PAIR_TTL_MS });
  return pairs;
}

/**
 * USD price for a token that only ever appears as the *quote* side of a pool.
 *
 * WETH on Robinhood Chain has no pool where it is the base token, so the
 * batch lookup yields nothing for it. Its price is recovered from the deepest
 * pool quoting against it: `priceUsd` is the base token in dollars and
 * `priceNative` is that same base token denominated in WETH, so their ratio
 * is WETH in dollars.
 */
export async function getQuoteSidePriceUSD(address: string): Promise<number | null> {
  const summary = await getQuoteSideMarket(address);
  return summary?.priceUSD ?? null;
}

export interface QuoteSideMarket {
  priceUSD: number;
  poolAddress: string;
  /** Liquidity of the pool the numbers above were read from. */
  liquidityUSD: number | null;
  volume24h: number | null;
  /** Ticker of the token on the other side of that pool. */
  counterSymbol: string;
}

/**
 * Price and pool stats for a quote-only token, read off one specific pool.
 *
 * When `preferCounter` names a token (the chain's stable), the pool paired
 * against it wins over a merely deeper one - so WETH reports the WETH/USDG
 * pool's TVL rather than some memecoin/WETH pool's, which would be a real
 * number attached to the wrong pair.
 */
export async function getQuoteSideMarket(
  address: string,
  preferCounter?: string,
): Promise<QuoteSideMarket | null> {
  const key = address.toLowerCase();
  const counter = preferCounter?.toLowerCase();

  // `latest/dex/tokens` caps its response at 30 pools and does not order them
  // by liquidity, so the counter's pool with this token can be missing from
  // this token's own list. Look from the counter's side as well.
  const [own, fromCounter] = await Promise.all([
    getAllPairsFor(key),
    counter && counter !== key ? getAllPairsFor(counter) : Promise.resolve<DexPair[]>([]),
  ]);

  const seen = new Set<string>();
  const pairs: DexPair[] = [];
  for (const pair of [...own, ...fromCounter]) {
    const id = pair.pairAddress?.toLowerCase();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    pairs.push(pair);
  }

  const usable = pairs.filter((pair) => {
    if (pair.quoteToken?.address?.toLowerCase() !== key) return false;
    const usd = Number(pair.priceUsd);
    const native = Number(pair.priceNative);
    return Number.isFinite(usd) && usd > 0 && Number.isFinite(native) && native > 0;
  });

  const preferred = counter
    ? usable.filter((pair) => pair.baseToken?.address?.toLowerCase() === counter)
    : [];

  const best = deepest(preferred.length > 0 ? preferred : usable);
  if (!best) return null;

  const price = Number(best.priceUsd) / Number(best.priceNative);
  if (!Number.isFinite(price) || price <= 0) return null;

  return {
    priceUSD: price,
    poolAddress: best.pairAddress,
    liquidityUSD: best.liquidity?.usd ?? null,
    volume24h: best.volume?.h24 ?? null,
    counterSymbol: best.baseToken?.symbol ?? "",
  };
}
