export const CHAIN = {
  id: 4663,

  name: "Robinhood Chain",

  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },

  rpcUrl: "https://rpc.mainnet.chain.robinhood.com",

  // The block explorer also runs its own JSON-RPC proxy
  // (`${explorer}/api/eth-rpc`), but it's rate-limited to ~1 request/hour -
  // not usable as general RPC fallback. Its REST API (used below for pool
  // discovery) has a much more generous limit.
  explorer: "https://robinhoodchain.blockscout.com",

  explorerApi: "https://robinhoodchain.blockscout.com/api",
};
