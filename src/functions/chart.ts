import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Historical price charts via CoinGecko.
//
// Robinhood Chain has no price-history indexer of its own, but its tokens are
// the same assets CoinGecko tracks (the explorer even sources its logos and
// spot rates from there). So chart history is fetched from CoinGecko's public
// API: resolve the ticker to a CoinGecko id once, then pull the market chart
// for the requested range. Everything is cached server-side to stay well
// under the free tier's rate limit, and a token with no CoinGecko listing
// simply returns an empty series (the UI then falls back to a live-sampled
// line).
// ---------------------------------------------------------------------------

const API = "https://api.coingecko.com/api/v3";

export type ChartRange = "1" | "7" | "30" | "365";

export interface ChartPoint {
  t: number; // unix ms
  price: number;
}

const inputSchema = z.object({
  symbol: z.string().min(1).max(32),
  range: z.enum(["1", "7", "30", "365"]).default("7"),
  // The token's known on-chain USD price, used to disambiguate CoinGecko coins
  // that share a ticker (e.g. the $22 GameStop tokenized stock vs a $0.0004
  // meme coin both listed as "GME").
  price: z.number().optional(),
});

// Ambiguous / hijacked tickers resolved explicitly so e.g. "ETH" doesn't
// match some random low-cap coin that happens to share the symbol.
const SYMBOL_TO_ID: Record<string, string> = {
  ETH: "ethereum",
  WETH: "weth",
  USDG: "global-dollar",
  USDE: "ethena-usde",
  BTC: "bitcoin",
  WBTC: "wrapped-bitcoin",
  VIRTUAL: "virtual-protocol",
  DEGEN: "degen-base",
  NPC: "non-playable-coin",
};

const idCache = new Map<string, string | null>();
const seriesCache = new Map<string, { data: ChartPoint[]; expires: number }>();
const SERIES_TTL_MS = 60_000;

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(9_000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function currentPrices(ids: string[]): Promise<Record<string, number>> {
  if (ids.length === 0) return {};
  const data = await fetchJson<Record<string, { usd?: number }>>(
    `${API}/simple/price?ids=${ids.map(encodeURIComponent).join(",")}&vs_currency=usd&vs_currencies=usd`,
  );
  const out: Record<string, number> = {};
  for (const [id, v] of Object.entries(data ?? {})) if (v?.usd != null) out[id] = v.usd;
  return out;
}

async function resolveId(symbol: string, priceHint?: number): Promise<string | null> {
  const upper = symbol.toUpperCase();
  if (SYMBOL_TO_ID[upper]) return SYMBOL_TO_ID[upper];

  const key = upper;
  if (idCache.has(key)) return idCache.get(key)!;

  const data = await fetchJson<{
    coins: { id: string; symbol: string; market_cap_rank: number | null }[];
  }>(`${API}/search?query=${encodeURIComponent(symbol)}`);

  let id: string | null = null;
  const coins = data?.coins ?? [];
  const exact = coins.filter((c) => c.symbol?.toUpperCase() === upper);
  const candidates = exact.length ? exact : coins.slice(0, 1);

  if (candidates.length) {
    // On Robinhood Chain these tickers are usually the tokenized-stock listing
    // (e.g. GME → gamestop-robinhood-tokenized-stock), so prefer that variant.
    const rh = candidates.find((c) => c.id.includes("robinhood-tokenized-stock"));

    if (rh) {
      id = rh.id;
    } else if (priceHint != null && candidates.length > 1) {
      // Disambiguate same-ticker coins by which current price is closest to
      // the token's real on-chain price.
      const prices = await currentPrices(candidates.slice(0, 6).map((c) => c.id));
      let best: string | null = null;
      let bestDiff = Infinity;
      for (const c of candidates) {
        const p = prices[c.id];
        if (p == null || p <= 0) continue;
        const diff = Math.abs(Math.log(p / priceHint));
        if (diff < bestDiff) {
          bestDiff = diff;
          best = c.id;
        }
      }
      id =
        best ??
        [...candidates].sort(
          (a, b) => (a.market_cap_rank ?? 1e9) - (b.market_cap_rank ?? 1e9),
        )[0]?.id ??
        null;
    } else {
      id =
        [...candidates].sort(
          (a, b) => (a.market_cap_rank ?? 1e9) - (b.market_cap_rank ?? 1e9),
        )[0]?.id ?? null;
    }
  }

  idCache.set(key, id);
  return id;
}

export const fetchChart = createServerFn({ method: "GET" })
  .validator(inputSchema)
  .handler(async ({ data }): Promise<{ points: ChartPoint[]; source: "coingecko" | "none" }> => {
    const cacheKey = `${data.symbol.toUpperCase()}:${data.range}`;
    const cached = seriesCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return { points: cached.data, source: cached.data.length ? "coingecko" : "none" };
    }

    const id = await resolveId(data.symbol, data.price);
    if (!id) {
      seriesCache.set(cacheKey, { data: [], expires: Date.now() + SERIES_TTL_MS });
      return { points: [], source: "none" };
    }

    const raw = await fetchJson<{ prices: [number, number][] }>(
      `${API}/coins/${id}/market_chart?vs_currency=usd&days=${data.range}`,
    );

    const points: ChartPoint[] = (raw?.prices ?? []).map(([t, price]) => ({ t, price }));
    seriesCache.set(cacheKey, { data: points, expires: Date.now() + SERIES_TTL_MS });

    return { points, source: points.length ? "coingecko" : "none" };
  });
