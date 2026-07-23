import { useState } from "react";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { toast } from "sonner";

import { POSITION_MANAGER_ABI } from "@/lib/uniswap/abi/positionManager";
import { UNISWAP } from "@/lib/uniswap/addresses";
import { robinhood } from "@/lib/web3/client";
import { useActivityStore } from "@/lib/store/activityStore";

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

  const addActivity = useActivityStore((s) => s.add);
  const updateActivity = useActivityStore((s) => s.update);

  async function claimFees(tokenId: bigint, label = `Position #${tokenId}`) {
    if (!address) {
      setError("Connect your wallet first");
      setStep("error");
      return;
    }

    setError(null);

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
        await publicClient.waitForTransactionReceipt({ hash });
      }

      setStep("success");
      updateActivity(activityId, { status: "success" });
      toast.success(`Claimed fees for ${label}`);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Claiming fees failed";

      setError(message);
      setStep("error");
      updateActivity(activityId, { status: "error" });
      toast.error("Claim fees failed", { description: message.slice(0, 140) });
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
    loading: step === "claiming",
    reset,
  };
}
