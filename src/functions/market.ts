import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getAllMarketData, getMarketData } from "@/lib/uniswap/market";

export const fetchMarkets = createServerFn({ method: "GET" }).handler(async () => {
  return getAllMarketData();
});

export const fetchMarket = createServerFn({ method: "GET" })
  .validator(z.object({ symbol: z.string() }))
  .handler(async ({ data }) => {
    return getMarketData(data.symbol);
  });
