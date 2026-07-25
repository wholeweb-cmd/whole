import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { toast } from "sonner";

import { POSITION_MANAGER_ABI } from "@/lib/uniswap/abi/positionManager";
import { UNISWAP } from "@/lib/uniswap/addresses";
import { robinhood } from "@/lib/web3/client";
import { useActivityStore } from "@/lib/store/activityStore";
import { BALANCE_QUERY_KEY } from "./useERC20Balance";
import { LIQUIDITY_POSITIONS_QUERY_KEY } from "./useLiquidityPositions";
import { PORTFOLIO_QUERY_KEY } from "./usePortfolioData";

export type ClaimFeesStep = "idle" | "claiming" | "success" | "error";

const positionManager = UNISWAP.positionManager as `0x${string}`;
const MAX_UINT128 = 2n ** 128n - 1n;

/** Claims accrued fees for an LP position without touching its liquidity. */
export function useClaimFees() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [step, setStep] = useState<ClaimFeesStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [activeTokenId, setActiveTokenId] = useState<bigint | null>(null);

  const addActivity = useActivityStore((s) => s.add);
  const updateActivity = useActivityStore((s) => s.update);
  const queryClient = useQueryClient();

  async function claimFees(tokenId: bigint, label = `Position #${tokenId}`) {
    if (!address) {
      setError("Connect your wallet first");
      setStep("error");
      return false;
    }

    setError(null);
    setActiveTokenId(tokenId);

    const activityId = addActivity({
      type: "Claim Fees",
      detail: label,
      status: "pending",
    });

    try {
      setStep("claiming");

      const hash = await writeContractAsync({
        address: positionManager,
        abi: POSITION_MANAGER_ABI,
        functionName: "collect",
        args: [
          {
            tokenId,
            recipient: address as `0x${string}`,
            amount0Max: MAX_UINT128,
            amount1Max: MAX_UINT128,
          },
        ],
        chainId: robinhood.id,
      });

      updateActivity(activityId, { hash });

      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status !== "success") throw new Error("The claim transaction was reverted");
      }

      setStep("success");
      updateActivity(activityId, { status: "success" });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [BALANCE_QUERY_KEY] }),
        queryClient.invalidateQueries({ queryKey: [LIQUIDITY_POSITIONS_QUERY_KEY] }),
        queryClient.invalidateQueries({ queryKey: [PORTFOLIO_QUERY_KEY] }),
      ]);
      toast.success(`Claimed fees for ${label}`);
      return true;
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Claiming fees failed";

      setError(message);
      setStep("error");
      updateActivity(activityId, { status: "error" });
      toast.error("Claim fees failed", { description: message.slice(0, 140) });
      return false;
    } finally {
      setActiveTokenId(null);
    }
  }

  function reset() {
    setStep("idle");
    setError(null);
  }

  return {
    claimFees,
    step,
    error,
    activeTokenId,
    loading: step === "claiming",
    reset,
  };
}
