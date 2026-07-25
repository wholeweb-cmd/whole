export interface PoolToken {
  address: string;
  symbol: string;
  name: string;
}

export interface PoolInfo {
  poolAddress: string;

  dexId: string;

  chainId: string;

  priceUsd: number;

  liquidity: number;

  volume24h: number;

  fdv: number;

  marketCap: number;

  baseToken: PoolToken;

  quoteToken: PoolToken;
}
