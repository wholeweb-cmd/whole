import { createServerFn } from "@tanstack/react-start";
import { formatUnits } from "viem";
import { z } from "zod";

import { getWalletBalanceSnapshot } from "@/lib/explorer/balances";
import { getPositionsForOwner } from "@/lib/uniswap/liquidity";
import { getTokenPriceUSD } from "@/lib/uniswap/market";
import { TOKENS } from "@/lib/tokens/index";

export interface PortfolioAsset {
  symbol: string;
  name: string;
  logo: string | null;
  amount: number;
  price: number | null;
  value: number | null;
}

export interface PortfolioPosition {
  tokenId: string;
  pair: string;
  fee: number;
  tokensOwed0: string;
  tokensOwed1: string;
  token0Symbol: string;
  token1Symbol: string;
}

export interface PortfolioData {
  address: string;
  totalValue: number;
  assets: PortfolioAsset[];
  positions: PortfolioPosition[];
  claimableFeesUSD: number;
}

export const fetchPortfolio = createServerFn({ method: "GET" })
  .validator(z.object({ address: z.string() }))
  .handler(async ({ data }): Promise<PortfolioData> => {
    const wallet = data.address as `0x${string}`;

    const [snapshot, positions] = await Promise.all([
      getWalletBalanceSnapshot(wallet),
      getPositionsForOwner(wallet).catch(() => []),
    ]);

    const balances = await Promise.all(
      TOKENS.map(async (token) => {
        const metadataAddress = token.isNative ? token.wrapped : token.address;
        const tokenSnapshot = metadataAddress
          ? snapshot.tokens.get(metadataAddress.toLowerCase())
          : undefined;
        const rawBalance = token.isNative ? snapshot.native : (tokenSnapshot?.raw ?? 0n);
        const price = await getTokenPriceUSD(token.symbol);

        const amount = Number(formatUnits(rawBalance, token.decimals));

        const asset: PortfolioAsset = {
          symbol: token.symbol,
          name: token.name,
          logo: tokenSnapshot?.iconUrl ?? token.logo ?? null,
          amount,
          price,
          value: price != null ? amount * price : null,
        };

        return asset;
      }),
    );

    const totalValue = balances.reduce((sum, asset) => sum + (asset.value ?? 0), 0);

    const feeValues = await Promise.all(
      positions.map(async (p) => {
        const [price0, price1] = await Promise.all([
          getTokenPriceUSD(p.token0Symbol),
          getTokenPriceUSD(p.token1Symbol),
        ]);

        const fee0 = price0 != null ? Number(p.tokensOwed0) * price0 : 0;
        const fee1 = price1 != null ? Number(p.tokensOwed1) * price1 : 0;

        return fee0 + fee1;
      }),
    );

    return {
      address: wallet,
      totalValue,
      assets: balances,
      positions: positions.map((p) => ({
        tokenId: p.tokenId.toString(),
        pair: `${p.token0Symbol}/${p.token1Symbol}`,
        fee: p.fee,
        tokensOwed0: p.tokensOwed0,
        tokensOwed1: p.tokensOwed1,
        token0Symbol: p.token0Symbol,
        token1Symbol: p.token1Symbol,
      })),
      claimableFeesUSD: feeValues.reduce((sum, v) => sum + v, 0),
    };
  });
