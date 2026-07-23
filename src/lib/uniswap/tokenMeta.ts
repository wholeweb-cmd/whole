import { CHAIN } from "@/lib/config/chain";

// ---------------------------------------------------------------------------
// Token metadata via the block explorer's REST API.
//
// The chain's own JSON-RPC is often unreachable (DNS-level blocking of
// *.robinhood.com on some networks) and rate-limited on its proxy, but the
// explorer's REST API is reliable and - crucially - already carries the
// human data we need for a real markets UI that the raw contract can't give
// cheaply: display name, ticker, decimals, a CoinGecko-hosted logo, a spot
// USD price, and 24h volume. So token identity/pricing is sourced from here
// first, with on-chain reads used only as a fallback (see market.ts).
// ---------------------------------------------------------------------------

export interface TokenMeta {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  logo: string | null;
  priceUSD: number | null;
  volume24h: number | null;
  marketCap: number | null;
  // The explorer recognizes this as a real, priced token (has a logo and a
  // market price) - used as a lightweight "not an obvious impersonator"
  // signal alongside the curated allow-list.
  recognized: boolean;
}

interface RawToken {
  address_hash?: string;
  address?: string;
  symbol?: string | null;
  name?: string | null;
  decimals?: string | null;
  icon_url?: string | null;
  exchange_rate?: string | null;
  volume_24h?: string | null;
  circulating_market_cap?: string | null;
}

const TOKENS_LIST_ENDPOINT = `${CHAIN.explorer}/api/v2/tokens?type=ERC-20`;
const TOKEN_DETAIL_ENDPOINT = (address: string) => `${CHAIN.explorer}/api/v2/tokens/${address}`;

// Pages walked when warming the cache from the market-cap-sorted token list -
// 50 tokens/page, so this covers the top few hundred tokens in a handful of
// requests. Anything past this is filled in lazily per-address on demand.
const LIST_WARM_PAGES = 6;
const LIST_WARM_INTERVAL_MS = 60_000;

const metaCache = new Map<`0x${string}`, TokenMeta>();
let lastWarmAt = 0;
let warmInFlight: Promise<void> | null = null;

function num(value: string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toMeta(raw: RawToken): TokenMeta | null {
  const addr = (raw.address_hash ?? raw.address ?? "").toLowerCase();
  if (!addr.startsWith("0x") || addr.length !== 42) return null;

  const logo = raw.icon_url && raw.icon_url.startsWith("http") ? raw.icon_url : null;
  const priceUSD = num(raw.exchange_rate);
  const symbol = (raw.symbol ?? "").trim();

  return {
    address: addr as `0x${string}`,
    symbol: symbol || `${addr.slice(0, 6)}…${addr.slice(-4)}`,
    name: (raw.name ?? "").trim() || symbol || "Unknown Token",
    decimals: num(raw.decimals) ?? 18,
    logo,
    priceUSD,
    volume24h: num(raw.volume_24h),
    marketCap: num(raw.circulating_market_cap),
    recognized: Boolean(logo) && priceUSD != null,
  };
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Populate the cache from the explorer's market-cap-sorted token list. */
async function warmFromList(): Promise<void> {
  let cursor: Record<string, string | number> | undefined;

  for (let page = 0; page < LIST_WARM_PAGES; page++) {
    const url = new URL(TOKENS_LIST_ENDPOINT);
    if (cursor) {
      for (const [key, value] of Object.entries(cursor)) url.searchParams.set(key, String(value));
    }

    const data = await fetchJson<{
      items: RawToken[];
      next_page_params: Record<string, string | number> | null;
    }>(url.toString());

    if (!data) break;

    for (const raw of data.items ?? []) {
      const meta = toMeta(raw);
      // List entries are authoritative for identity/price - always refresh.
      if (meta) metaCache.set(meta.address, meta);
    }

    if (!data.next_page_params) break;
    cursor = data.next_page_params;
  }
}

/** Kick off (at most one) cache warm on a cadence, awaiting it only when the cache is cold. */
export async function ensureTokenListWarmed(): Promise<void> {
  const now = Date.now();

  if (now - lastWarmAt > LIST_WARM_INTERVAL_MS && !warmInFlight) {
    lastWarmAt = now;
    warmInFlight = warmFromList().finally(() => {
      warmInFlight = null;
    });
  }

  // Block only on the very first warm; later refreshes happen in the
  // background so they never slow a request that already has data.
  if (metaCache.size === 0 && warmInFlight) {
    await Promise.race([warmInFlight, new Promise((r) => setTimeout(r, 6_000))]);
  }
}

/** Metadata for a single token - cache first, then an individual explorer lookup. */
export async function getTokenMeta(address: `0x${string}`): Promise<TokenMeta | null> {
  const lower = address.toLowerCase() as `0x${string}`;

  const cached = metaCache.get(lower);
  if (cached) return cached;

  const raw = await fetchJson<RawToken>(TOKEN_DETAIL_ENDPOINT(lower));
  if (!raw) return null;

  const meta = toMeta({ ...raw, address_hash: raw.address_hash ?? lower });
  if (meta) metaCache.set(meta.address, meta);
  return meta;
}

/** Cached metadata only, no network. */
export function getCachedTokenMeta(address: `0x${string}`): TokenMeta | null {
  return metaCache.get(address.toLowerCase() as `0x${string}`) ?? null;
}

/** Every token currently in the metadata cache (i.e. the warmed token list). */
export function getAllCachedTokenMeta(): TokenMeta[] {
  return [...metaCache.values()];
}
