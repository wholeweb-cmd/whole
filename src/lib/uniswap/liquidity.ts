import { readContract } from "viem/actions";
import { formatUnits } from "viem";

import { publicClient } from "@/lib/web3/client";
import { TOKENS } from "@/lib/tokens/index";
import { getTokenMeta } from "./tokenMeta";

import { POSITION_MANAGER_ABI } from "./abi/positionManager";
import { UNISWAP } from "./addresses";

const positionManager = UNISWAP.positionManager as `0x${string}`;
const MAX_UINT128 = 2n ** 128n - 1n;

export async function getPositionCount(owner: `0x${string}`) {
  return readContract(publicClient, {
    address: positionManager,
    abi: POSITION_MANAGER_ABI,
    functionName: "balanceOf",
    args: [owner],
  });
}

export async function getPositionTokenId(owner: `0x${string}`, index: bigint) {
  return readContract(publicClient, {
    address: positionManager,
    abi: POSITION_MANAGER_ABI,
    functionName: "tokenOfOwnerByIndex",
    args: [owner, index],
  });
}

export async function getPosition(tokenId: bigint) {
  return readContract(publicClient, {
    address: positionManager,
    abi: POSITION_MANAGER_ABI,
    functionName: "positions",
    args: [tokenId],
  });
}

export interface ParsedPosition {
  tokenId: bigint;
  token0: `0x${string}`;
  token1: `0x${string}`;
  token0Symbol: string;
  token1Symbol: string;
  token0Name: string;
  token1Name: string;
  token0Decimals: number;
  token1Decimals: number;
  token0Logo: string | null;
  token1Logo: string | null;
  fee: number;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
  tokensOwed0: string;
  tokensOwed1: string;
  /** True when the amounts came from a live collect simulation. */
  feePreviewLive: boolean;
}

async function tokenInfo(address: `0x${string}`) {
  const curated = TOKENS.find((t) => t.address.toLowerCase() === address.toLowerCase());
  const meta = await getTokenMeta(address).catch(() => null);

  return {
    symbol: curated?.symbol ?? meta?.symbol ?? `${address.slice(0, 6)}...${address.slice(-4)}`,
    name: curated?.name ?? meta?.name ?? "Unknown Token",
    decimals: curated?.decimals ?? meta?.decimals ?? 18,
    logo: meta?.logo ?? null,
  };
}

/**
 * Simulating collect returns the fees claimable right now without submitting
 * a transaction. The stored `tokensOwed` fields alone can be stale until the
 * position manager updates fee growth, which previously made earned fees look
 * like zero and disabled the Claim button.
 */
async function getClaimableFees(
  owner: `0x${string}`,
  tokenId: bigint,
  stored0: bigint,
  stored1: bigint,
) {
  try {
    const { result } = await publicClient.simulateContract({
      account: owner,
      address: positionManager,
      abi: POSITION_MANAGER_ABI,
      functionName: "collect",
      args: [
        {
          tokenId,
          recipient: owner,
          amount0Max: MAX_UINT128,
          amount1Max: MAX_UINT128,
        },
      ],
    });

    return { amount0: result[0], amount1: result[1], live: true };
  } catch {
    return { amount0: stored0, amount1: stored1, live: false };
  }
}

/** Enumerates and parses every open (non-empty) LP position owned by `owner`. */
export async function getPositionsForOwner(owner: `0x${string}`): Promise<ParsedPosition[]> {
  const count = await getPositionCount(owner);
  const results: ParsedPosition[] = [];

  for (let i = 0n; i < count; i++) {
    const tokenId = await getPositionTokenId(owner, i);
    const pos = await getPosition(tokenId);

    // liquidity === 0 means the position was fully withdrawn but the NFT
    // itself hasn't been burned - skip empty positions.
    if (pos[7] === 0n) continue;

    const [token0Info, token1Info, fees] = await Promise.all([
      tokenInfo(pos[2]),
      tokenInfo(pos[3]),
      getClaimableFees(owner, tokenId, pos[10], pos[11]),
    ]);

    results.push({
      tokenId,
      token0: pos[2],
      token1: pos[3],
      token0Symbol: token0Info.symbol,
      token1Symbol: token1Info.symbol,
      token0Name: token0Info.name,
      token1Name: token1Info.name,
      token0Decimals: token0Info.decimals,
      token1Decimals: token1Info.decimals,
      token0Logo: token0Info.logo,
      token1Logo: token1Info.logo,
      fee: pos[4],
      tickLower: pos[5],
      tickUpper: pos[6],
      liquidity: pos[7],
      tokensOwed0: formatUnits(fees.amount0, token0Info.decimals),
      tokensOwed1: formatUnits(fees.amount1, token1Info.decimals),
      feePreviewLive: fees.live,
    });
  }

  return results;
}
