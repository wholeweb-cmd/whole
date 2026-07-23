import { readContract } from "viem/actions";
import { formatUnits } from "viem";

import { publicClient } from "@/lib/web3/client";
import { TOKENS } from "@/lib/tokens/index";

import { POSITION_MANAGER_ABI } from "./abi/positionManager";
import { UNISWAP } from "./addresses";

const positionManager = UNISWAP.positionManager as `0x${string}`;

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
  token0Symbol: string;
  token1Symbol: string;
  fee: number;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
  tokensOwed0: string;
  tokensOwed1: string;
}

function symbolForAddress(address: string) {
  const match = TOKENS.find((t) => t.address.toLowerCase() === address.toLowerCase());
  return match?.symbol ?? `${address.slice(0, 6)}...${address.slice(-4)}`;
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

    const token0Info = TOKENS.find((t) => t.address.toLowerCase() === pos[2].toLowerCase());
    const token1Info = TOKENS.find((t) => t.address.toLowerCase() === pos[3].toLowerCase());

    results.push({
      tokenId,
      token0Symbol: symbolForAddress(pos[2]),
      token1Symbol: symbolForAddress(pos[3]),
      fee: pos[4],
      tickLower: pos[5],
      tickUpper: pos[6],
      liquidity: pos[7],
      tokensOwed0: formatUnits(pos[10], token0Info?.decimals ?? 18),
      tokensOwed1: formatUnits(pos[11], token1Info?.decimals ?? 18),
    });
  }

  return results;
}
