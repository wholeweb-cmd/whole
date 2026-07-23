import { useState } from "react";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { parseUnits } from "viem";
import { toast } from "sonner";

import { getAllowance } from "@/lib/uniswap/read";
import { ERC20_ABI } from "@/lib/uniswap/abi/erc20";
import { POSITION_MANAGER_ABI, getFullRangeTicks } from "@/lib/uniswap/abi/positionManager";
import { UNISWAP } from "@/lib/uniswap/addresses";
import { robinhood } from "@/lib/web3/client";
import { getTokenDecimals } from "@/lib/tokens/helpers";
import { useActivityStore } from "@/lib/store/activityStore";

export type LiquidityStep = "idle" | "approving" | "submitting" | "success" | "error";

const positionManager = UNISWAP.positionManager as `0x${string}`;

interface AddLiquidityParams {
  tokenASymbol: string;
  tokenAAddress: `0x${string}`;
  tokenBSymbol: string;
  tokenBAddress: `0x${string}`;
  amountA: string;
  amountB: string;
  fee: number;
  // Explicit decimals let any discovered token be used, not just the curated
  // ones getTokenDecimals knows about (it falls back to that lookup).
  decimalsA?: number;
  decimalsB?: number;
}

export function useLiquidity() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [step, setStep] = useState<LiquidityStep>("idle");
  const [error, setError] = useState<string | null>(null);

  const addActivity = useActivityStore((s) => s.add);
  const updateActivity = useActivityStore((s) => s.update);

  async function ensureApproved(
    token: `0x${string}`,
    amount: bigint,
    owner: `0x${string}`,
    symbol: string,
  ) {
    const allowance = await getAllowance(token, owner, positionManager);
    if (allowance >= amount) return;

    toast.info(`Approving ${symbol}...`);

    const hash = await writeContractAsync({
      address: token,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [positionManager, amount],
      chainId: robinhood.id,
    });

    if (publicClient) {
      await publicClient.waitForTransactionReceipt({ hash });
    }
  }

  /**
   * Adds liquidity across the *full price range* (v1: no custom range
   * picker). Both sides must already be ERC20 balances the wallet holds
   * (e.g. WETH, not native ETH) since the position manager needs approvals
   * for both tokens.
   */
  async function addLiquidity({
    tokenASymbol,
    tokenAAddress,
    tokenBSymbol,
    tokenBAddress,
    amountA,
    amountB,
    fee,
    decimalsA: decimalsAParam,
    decimalsB: decimalsBParam,
  }: AddLiquidityParams) {
    if (!address) {
      setError("Connect your wallet first");
      setStep("error");
      return;
    }

    setError(null);

    const activityId = addActivity({
      type: "Add Liquidity",
      detail: `${amountA} ${tokenASymbol} + ${amountB} ${tokenBSymbol}`,
      status: "pending",
    });

    try {
      const decimalsA = decimalsAParam ?? getTokenDecimals(tokenASymbol);
      const decimalsB = decimalsBParam ?? getTokenDecimals(tokenBSymbol);

      const amountADesired = parseUnits(amountA || "0", decimalsA);
      const amountBDesired = parseUnits(amountB || "0", decimalsB);

      // Pool contracts expect token0 < token1 by address.
      const [token0, token1, amount0Desired, amount1Desired] =
        tokenAAddress.toLowerCase() < tokenBAddress.toLowerCase()
          ? [tokenAAddress, tokenBAddress, amountADesired, amountBDesired]
          : [tokenBAddress, tokenAAddress, amountBDesired, amountADesired];

      setStep("approving");
      await ensureApproved(tokenAAddress, amountADesired, address as `0x${string}`, tokenASymbol);
      await ensureApproved(tokenBAddress, amountBDesired, address as `0x${string}`, tokenBSymbol);

      const { tickLower, tickUpper } = getFullRangeTicks(fee);
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);

      setStep("submitting");

      const hash = await writeContractAsync({
        address: positionManager,
        abi: POSITION_MANAGER_ABI,
        functionName: "mint",
        args: [
          {
            token0,
            token1,
            fee,
            tickLower,
            tickUpper,
            amount0Desired,
            amount1Desired,
            amount0Min: 0n,
            amount1Min: 0n,
            recipient: address as `0x${string}`,
            deadline,
          },
        ],
        chainId: robinhood.id,
      });

      updateActivity(activityId, { hash });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      setStep("success");
      updateActivity(activityId, { status: "success" });
      toast.success(`Added liquidity to ${tokenASymbol}/${tokenBSymbol}`);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Adding liquidity failed";

      setError(message);
      setStep("error");
      updateActivity(activityId, { status: "error" });
      toast.error("Add liquidity failed", {
        description: message.slice(0, 140),
      });
    }
  }

  /** Withdraws 100% of a position's liquidity, then collects owed tokens. */
  async function removeLiquidity(
    tokenId: bigint,
    liquidity: bigint,
    label = `Position #${tokenId}`,
  ) {
    if (!address) {
      setError("Connect your wallet first");
      setStep("error");
      return;
    }

    setError(null);

    const activityId = addActivity({
      type: "Remove Liquidity",
      detail: label,
      status: "pending",
    });

    try {
      setStep("submitting");

      const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);

      const decreaseHash = await writeContractAsync({
        address: positionManager,
        abi: POSITION_MANAGER_ABI,
        functionName: "decreaseLiquidity",
        args: [
          {
            tokenId,
            liquidity,
            amount0Min: 0n,
            amount1Min: 0n,
            deadline,
          },
        ],
        chainId: robinhood.id,
      });

      updateActivity(activityId, { hash: decreaseHash });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: decreaseHash });
      }

      const maxUint128 = 2n ** 128n - 1n;

      const collectHash = await writeContractAsync({
        address: positionManager,
        abi: POSITION_MANAGER_ABI,
        functionName: "collect",
        args: [
          {
            tokenId,
            recipient: address as `0x${string}`,
            amount0Max: maxUint128,
            amount1Max: maxUint128,
          },
        ],
        chainId: robinhood.id,
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: collectHash });
      }

      setStep("success");
      updateActivity(activityId, { status: "success", hash: collectHash });
      toast.success(`Removed liquidity from ${label}`);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Removing liquidity failed";

      setError(message);
      setStep("error");
      updateActivity(activityId, { status: "error" });
      toast.error("Remove liquidity failed", {
        description: message.slice(0, 140),
      });
    }
  }

  function reset() {
    setStep("idle");
    setError(null);
  }

  return {
    addLiquidity,
    removeLiquidity,
    step,
    error,
    loading: step === "approving" || step === "submitting",
    reset,
  };
}
