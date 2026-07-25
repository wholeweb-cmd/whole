import { useState } from "react";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { encodeFunctionData, parseUnits } from "viem";
import { toast } from "sonner";

import { getAllowance } from "@/lib/uniswap/read";
import { ERC20_ABI } from "@/lib/uniswap/abi/erc20";
import { SWAP_ROUTER_ABI } from "@/lib/uniswap/abi/swapRouter";
import { UNISWAP } from "@/lib/uniswap/addresses";
import { robinhood } from "@/lib/web3/client";
import {
  getFeeTier,
  getTokenDecimals,
  getWrappedAddress,
  isNativeToken,
} from "@/lib/tokens/helpers";
import { useActivityStore } from "@/lib/store/activityStore";

export type SwapStep = "idle" | "approving" | "swapping" | "success" | "error";

interface ExecuteSwapParams {
  fromToken: string;
  toToken: string;
  amountIn: string;
  amountOut: string;
  slippage: number;
}

/**
 * Executes a real on-chain swap: checks/sets ERC20 allowance for the swap
 * router when needed, then calls exactInputSingle on the router. Native
 * token input is sent as msg.value against the wrapped token address, per
 * the pattern already used by the read-side quote/balance code in this repo.
 */
export function useExecuteSwap() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [step, setStep] = useState<SwapStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  const addActivity = useActivityStore((s) => s.add);
  const updateActivity = useActivityStore((s) => s.update);

  async function execute({ fromToken, toToken, amountIn, amountOut, slippage }: ExecuteSwapParams) {
    if (!address) {
      setError("Connect your wallet first");
      setStep("error");
      return;
    }

    setError(null);
    setTxHash(null);

    const activityId = addActivity({
      type: "Swap",
      detail: `${amountIn} ${fromToken} → ${toToken}`,
      status: "pending",
    });

    try {
      const tokenInAddress = getWrappedAddress(fromToken);
      const tokenOutAddress = getWrappedAddress(toToken);
      const decimalsIn = getTokenDecimals(fromToken);
      const decimalsOut = getTokenDecimals(toToken);
      const fee = getFeeTier(fromToken);
      const nativeIn = isNativeToken(fromToken);

      const amountInWei = parseUnits(amountIn, decimalsIn);

      const minOutNumber = Math.max(Number(amountOut || "0") * (1 - slippage / 100), 0);
      const amountOutMinimum =
        minOutNumber > 0 ? parseUnits(minOutNumber.toFixed(decimalsOut), decimalsOut) : 0n;

      if (!nativeIn) {
        setStep("approving");

        const currentAllowance = await getAllowance(
          tokenInAddress,
          address as `0x${string}`,
          UNISWAP.swapRouter as `0x${string}`,
        );

        if (currentAllowance < amountInWei) {
          toast.info(`Approving ${fromToken}...`);

          const approveHash = await writeContractAsync({
            address: tokenInAddress,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [UNISWAP.swapRouter as `0x${string}`, amountInWei],
            chainId: robinhood.id,
          });

          if (publicClient) {
            await publicClient.waitForTransactionReceipt({
              hash: approveHash,
            });
          }
        }
      }

      setStep("swapping");

      const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);

      const swapData = encodeFunctionData({
        abi: SWAP_ROUTER_ABI,
        functionName: "exactInputSingle",
        args: [
          {
            tokenIn: tokenInAddress,
            tokenOut: tokenOutAddress,
            fee,
            recipient: address as `0x${string}`,
            amountIn: amountInWei,
            amountOutMinimum,
            sqrtPriceLimitX96: 0n,
          },
        ],
      });

      const swapHash = await writeContractAsync({
        address: UNISWAP.swapRouter as `0x${string}`,
        abi: SWAP_ROUTER_ABI,
        functionName: "multicall",
        args: [deadline, [swapData]],
        value: nativeIn ? amountInWei : undefined,
        chainId: robinhood.id,
      });

      setTxHash(swapHash);
      updateActivity(activityId, { hash: swapHash });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: swapHash });
      }

      setStep("success");
      updateActivity(activityId, { status: "success" });
      toast.success(`Swapped ${amountIn} ${fromToken} for ${toToken}`);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Swap failed, please try again";

      setError(message);
      setStep("error");
      updateActivity(activityId, { status: "error" });
      toast.error("Swap failed", { description: message.slice(0, 140) });
    }
  }

  function reset() {
    setStep("idle");
    setError(null);
    setTxHash(null);
  }

  return {
    execute,
    step,
    error,
    txHash,
    loading: step === "approving" || step === "swapping",
    reset,
  };
}
