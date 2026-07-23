import { http } from "wagmi";
import { createConfig } from "@privy-io/wagmi";

import { CHAIN } from "@/lib/config/chain";
import { robinhood } from "./client";

export const wagmiConfig = createConfig({
  chains: [robinhood],
  transports: {
    [robinhood.id]: http(CHAIN.rpcUrl, { timeout: 5_000, retryCount: 1 }),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
