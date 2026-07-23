export interface Token {
  symbol: string;
  name: string;
  address: `0x${string}`;
  decimals: number;

  chainId: number;

  isNative: boolean;

  wrapped?: `0x${string}`;

  logo?: string;

  feeTier?: number;
}

export const TOKENS: Token[] = [
  {
    symbol: "ETH",
    name: "Ether",
    address: "0x0000000000000000000000000000000000000000",
    decimals: 18,

    chainId: 4663,

    isNative: true,

    // Confirmed on-chain via the explorer (255k+ holders, real trading
    // volume) - the previous address here was the generic OP-stack
    // predeploy convention, which doesn't exist on this chain.
    wrapped: "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73",

    feeTier: 100,
  },

  {
    symbol: "WETH",
    name: "Wrapped Ether",
    address: "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73",

    decimals: 18,

    chainId: 4663,

    isNative: false,

    feeTier: 100,
  },

  {
    symbol: "USDG",

    name: "Global Dollar",

    // Confirmed on-chain: verified via the explorer's admin panel, ~$3.26B
    // circulating market cap. The previous address here was a placeholder
    // that doesn't correspond to any deployed contract.
    address: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",

    decimals: 6,

    chainId: 4663,

    isNative: false,

    feeTier: 100,
  },
];

// There is no first-party "Robinhood Coin"/RHC token on this chain - only
// dozens of unrelated scam/impersonator tokens squatting on that ticker
// (RHCat, RobinHoodCoin, RHCARD, etc., none verified). It was previously
// listed here at a fabricated address; removed rather than risk routing a
// user's swap into one of those look-alikes under an "official" label.

export function getToken(symbol: string) {
  return TOKENS.find((token) => token.symbol === symbol);
}
