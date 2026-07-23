import { createPublicClient, defineChain, http } from "viem";

import { CHAIN } from "@/lib/config/chain";

export const robinhood = defineChain({
  id: CHAIN.id,
  name: CHAIN.name,
  nativeCurrency: CHAIN.nativeCurrency,
  rpcUrls: {
    default: {
      http: [CHAIN.rpcUrl],
    },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: CHAIN.explorer,
    },
  },
});

export const publicClient = createPublicClient({
  chain: robinhood,
  // The public RPC has been observed to hang well past its default 10s
  // timeout on certain eth_call requests (e.g. quoting a pair with no
  // pool) - bound worst-case latency instead of retrying indefinitely,
  // which matters most on serverless functions with hard execution limits.
  //
  // The explorer's own JSON-RPC proxy was tried as a fallback here, but its
  // rate limit is ~1 request/hour - far too strict for real read traffic,
  // so it's only used for the REST-based pool discovery in
  // src/lib/uniswap/market.ts, not as an RPC fallback.
  transport: http(CHAIN.rpcUrl, { timeout: 5_000, retryCount: 1 }),
});
