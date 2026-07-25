import { useMemo } from "react";

import { useMarkets } from "@/hooks/useMarkets";
import { getToken } from "@/lib/tokens/index";
import type { SwapToken } from "@/lib/uniswap/route";

const USDG = getToken("USDG");
const ETH = getToken("ETH");
const WETH_ADDRESS = (ETH?.wrapped ?? "").toLowerCase() as `0x${string}`;
const USDG_ADDRESS = (USDG?.address ?? "").toLowerCase() as `0x${string}`;

/**
 * The full set of swappable tokens on Robinhood Chain: every token with a
 * discovered Uniswap pool (from live market data, complete with real name,
 * ticker, logo and price), plus native ETH and USDG which anchor routing.
 */
export function useSwapTokens() {
  const { data: markets, isLoading } = useMarkets();

  return useMemo(() => {
    const list = markets ?? [];
    const wethMarket = list.find((m) => m.address.toLowerCase() === WETH_ADDRESS);
    const usdgMarket = list.find((m) => m.address.toLowerCase() === USDG_ADDRESS);
    const wethFee = wethMarket?.feeTier ?? ETH?.feeTier ?? 100;

    const tokens: SwapToken[] = [];

    // Native ETH (routed as WETH under the hood).
    tokens.push({
      symbol: "ETH",
      name: "Ether",
      address: WETH_ADDRESS,
      decimals: 18,
      logo: wethMarket?.logo ?? null,
      price: wethMarket?.price ?? null,
      feeTier: wethFee,
      quoteSymbol: "USDG",
      isNative: true,
    });

    // USDG — the routing hub / unit of account.
    tokens.push({
      symbol: "USDG",
      name: USDG?.name ?? "Global Dollar",
      address: USDG_ADDRESS,
      decimals: USDG?.decimals ?? 6,
      logo: usdgMarket?.logo ?? null,
      price: 1,
      feeTier: null,
      quoteSymbol: "USDG",
      isNative: false,
    });

    // Every real market token: priced (recognized by the explorer) or with a
    // discovered pool. The fee tier is filled in on demand at selection time
    // for tokens whose pool hasn't been indexed yet, so listing them without a
    // feeTier here is fine - they still become swappable once selected.
    for (const m of list) {
      if (m.address.toLowerCase() === USDG_ADDRESS) continue;
      if (m.price == null && m.feeTier == null) continue;
      tokens.push({
        symbol: m.symbol,
        name: m.name,
        address: m.address.toLowerCase() as `0x${string}`,
        decimals: m.decimals,
        logo: m.logo,
        price: m.price,
        feeTier: m.feeTier,
        quoteSymbol: m.quoteSymbol,
        isNative: false,
      });
    }

    // De-dupe by address (native ETH and WETH share an address; keep ETH first).
    const seen = new Set<string>();
    const deduped = tokens.filter((t) => {
      const key = t.isNative ? "native-eth" : t.address;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const byAddress = (address: string) =>
      deduped.find((t) => t.address.toLowerCase() === address.toLowerCase() && !t.isNative) ?? null;

    return { tokens: deduped, wethFee, byAddress, isLoading };
  }, [markets, isLoading]);
}
