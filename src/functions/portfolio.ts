import { createServerFn } from "@tanstack/react-start";
import { formatUnits } from "viem";
import { z } from "zod";

import { publicClient } from "@/lib/web3/client";
import { ERC20_ABI } from "@/lib/uniswap/abi/erc20";
import { getPositionsForOwner } from "@/lib/uniswap/liquidity";
import { getTokenPriceUSD } from "@/lib/uniswap/market";
import { TOKENS } from "@/lib/tokens/index";

export interface PortfolioAsset {
  symbol: string;
  name: string;
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

    const [balances, positions] = await Promise.all([
      Promise.all(
        TOKENS.map(async (token) => {
          const [rawBalance, price] = await Promise.all([
            token.isNative
              ? publicClient.getBalance({ address: wallet })
              : publicClient.readContract({
                  address: token.address,
                  abi: ERC20_ABI,
                  functionName: "balanceOf",
                  args: [wallet],
                }),
            getTokenPriceUSD(token.symbol),
          ]);

          const amount = Number(formatUnits(rawBalance, token.decimals));

          const asset: PortfolioAsset = {
            symbol: token.symbol,
            name: token.name,
            amount,
            price,
            value: price != null ? amount * price : null,
          };

          return asset;
        }),
      ),
      getPositionsForOwner(wallet),
    ]);

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
