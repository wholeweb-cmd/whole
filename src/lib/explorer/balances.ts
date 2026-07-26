import { CHAIN } from "@/lib/config/chain";

const CACHE_MS = 20_000;
const REQUEST_TIMEOUT_MS = 8_000;

interface ExplorerAddress {
  coin_balance: string | null;
}

interface ExplorerTokenBalance {
  token: {
    address_hash: string;
    decimals: string | null;
    icon_url: string | null;
    name: string | null;
    symbol: string | null;
  };
  value: string;
}

export interface ExplorerTokenSnapshot {
  raw: bigint;
  decimals: number | null;
  iconUrl: string | null;
  name: string | null;
  symbol: string | null;
}

export interface WalletBalanceSnapshot {
  native: bigint;
  tokens: Map<string, ExplorerTokenSnapshot>;
}

const cache = new Map<string, { expiresAt: number; request: Promise<WalletBalanceSnapshot> }>();

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Explorer balance request failed (${response.status})`);
  }

  return (await response.json()) as T;
}

/**
 * Reads one complete wallet snapshot from Robinhood Chain's official
 * Blockscout explorer. A short server-side cache deduplicates the swap,
 * dashboard and wallet page requests for the same address.
 */
export async function getWalletBalanceSnapshot(
  wallet: `0x${string}`,
): Promise<WalletBalanceSnapshot> {
  const key = wallet.toLowerCase();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.request;

  const encodedWallet = encodeURIComponent(wallet);
  const request = Promise.all([
    fetchJson<ExplorerAddress>(`${CHAIN.explorer}/api/v2/addresses/${encodedWallet}`),
    fetchJson<ExplorerTokenBalance[]>(
      `${CHAIN.explorer}/api/v2/addresses/${encodedWallet}/token-balances`,
    ),
  ]).then(([address, tokenBalances]) => {
    const tokens = new Map<string, ExplorerTokenSnapshot>();

    for (const item of tokenBalances) {
      const tokenAddress = item.token?.address_hash?.toLowerCase();
      if (!tokenAddress || !item.value) continue;

      tokens.set(tokenAddress, {
        raw: BigInt(item.value),
        decimals: item.token.decimals == null ? null : Number(item.token.decimals),
        iconUrl: item.token.icon_url,
        name: item.token.name,
        symbol: item.token.symbol,
      });
    }

    return {
      native: address.coin_balance == null ? 0n : BigInt(address.coin_balance),
      tokens,
    };
  });

  cache.set(key, { expiresAt: Date.now() + CACHE_MS, request });

  try {
    return await request;
  } catch (error) {
    cache.delete(key);
    throw error;
  }
}
