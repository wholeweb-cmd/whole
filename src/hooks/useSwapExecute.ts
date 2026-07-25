import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { encodeFunctionData, parseUnits } from "viem";
import { toast } from "sonner";

import { getAllowance } from "@/lib/uniswap/read";
import { ERC20_ABI } from "@/lib/uniswap/abi/erc20";
import { SWAP_ROUTER_ABI } from "@/lib/uniswap/abi/swapRouter";
import { UNISWAP } from "@/lib/uniswap/addresses";
import { robinhood } from "@/lib/web3/client";
import { encodePath, isSingleHop, type Route, type SwapToken } from "@/lib/uniswap/route";
import { useActivityStore } from "@/lib/store/activityStore";
import { BALANCE_QUERY_KEY } from "./useERC20Balance";
import { SERVICE_FEE_BIPS, SERVICE_FEE_RECIPIENT } from "@/lib/config/swapFee";

export type SwapStep = "idle" | "approving" | "swapping" | "success" | "error";

const ROUTER = UNISWAP.swapRouter as `0x${string}`;

interface ExecuteParams {
  tokenIn: SwapToken;
  tokenOut: SwapToken;
  amountIn: string;
  grossAmountOut: string;
  slippage: number;
  route: Route;
}

/**
 * Executes an on-chain swap between any two tokens, choosing an exactInputSingle
 * (single hop) or exactInput (multi-hop path) call, wrapping native ETH on the
 * way in and unwrapping to native ETH on the way out via multicall.
 */
export function useSwapExecute() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [step, setStep] = useState<SwapStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  const addActivity = useActivityStore((s) => s.add);
  const updateActivity = useActivityStore((s) => s.update);
  const queryClient = useQueryClient();

  async function execute({
    tokenIn,
    tokenOut,
    amountIn,
    grossAmountOut,
    slippage,
    route,
  }: ExecuteParams) {
    if (!address) {
      setError("Connect your wallet first");
      setStep("error");
      return;
    }

    setError(null);
    setTxHash(null);

    const activityId = addActivity({
      type: "Swap",
      detail: `${amountIn} ${tokenIn.symbol} → ${tokenOut.symbol}`,
      status: "pending",
    });

    try {
      const amountInWei = parseUnits(amountIn, tokenIn.decimals);
      const grossAmountOutWei = parseUnits(grossAmountOut || "0", tokenOut.decimals);
      const slippageBips = BigInt(Math.max(0, Math.min(10_000, Math.round(slippage * 100))));
      const amountOutMinimum = (grossAmountOutWei * (10_000n - slippageBips)) / 10_000n;

      const nativeIn = tokenIn.isNative;
      const nativeOut = tokenOut.isNative;
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);

      // ERC20 input needs the router approved for the spend (native doesn't).
      if (!nativeIn) {
        setStep("approving");
        const allowance = await getAllowance(tokenIn.address, address as `0x${string}`, ROUTER);
        if (allowance < amountInWei) {
          toast.info(`Approving ${tokenIn.symbol}…`);
          const approveHash = await writeContractAsync({
            address: tokenIn.address,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [ROUTER, amountInWei],
            chainId: robinhood.id,
          });
          if (publicClient) await publicClient.waitForTransactionReceipt({ hash: approveHash });
        }
      }

      setStep("swapping");

      // Receive the gross output in the router, then atomically settle the net
      // amount to the user and the disclosed service fee to the treasury.
      const recipient = ROUTER;

      const swapData = isSingleHop(route)
        ? encodeFunctionData({
            abi: SWAP_ROUTER_ABI,
            functionName: "exactInputSingle",
            args: [
              {
                tokenIn: route.nodes[0],
                tokenOut: route.nodes[1],
                fee: route.fees[0],
                recipient,
                amountIn: amountInWei,
                amountOutMinimum,
                sqrtPriceLimitX96: 0n,
              },
            ],
          })
        : encodeFunctionData({
            abi: SWAP_ROUTER_ABI,
            functionName: "exactInput",
            args: [
              {
                path: encodePath(route),
                recipient,
                amountIn: amountInWei,
                amountOutMinimum,
              },
            ],
          });

      const settlementData = nativeOut
        ? encodeFunctionData({
            abi: SWAP_ROUTER_ABI,
            functionName: "unwrapWETH9WithFee",
            args: [
              amountOutMinimum,
              address as `0x${string}`,
              SERVICE_FEE_BIPS,
              SERVICE_FEE_RECIPIENT,
            ],
          })
        : encodeFunctionData({
            abi: SWAP_ROUTER_ABI,
            functionName: "sweepTokenWithFee",
            args: [
              tokenOut.address,
              amountOutMinimum,
              address as `0x${string}`,
              SERVICE_FEE_BIPS,
              SERVICE_FEE_RECIPIENT,
            ],
          });
      const calls = [swapData, settlementData];
      const transactionData = encodeFunctionData({
        abi: SWAP_ROUTER_ABI,
        functionName: "multicall",
        args: [deadline, calls],
      });
      const transactionValue = nativeIn ? amountInWei : undefined;

      // Simulate the exact calldata immediately before opening the wallet.
      // Supplying a modest 15% safety margin prevents wallets from inventing
      // a much larger gas limit while still leaving room for state changes.
      let gas: bigint | undefined;
      let maxFeePerGas: bigint | undefined;
      let maxPriorityFeePerGas: bigint | undefined;
      if (publicClient) {
        try {
          const [estimatedGas, estimatedFees] = await Promise.all([
            publicClient.estimateGas({
              account: address as `0x${string}`,
              to: ROUTER,
              data: transactionData,
              value: transactionValue,
            }),
            publicClient.estimateFeesPerGas(),
          ]);
          gas = (estimatedGas * 115n) / 100n;
          maxFeePerGas = estimatedFees.maxFeePerGas;
          maxPriorityFeePerGas = estimatedFees.maxPriorityFeePerGas;
        } catch {
          // The connected wallet can still estimate if the public RPC is
          // temporarily behind or refuses the simulation.
        }
      }

      const hash = await writeContractAsync({
        address: ROUTER,
        abi: SWAP_ROUTER_ABI,
        functionName: "multicall",
        args: [deadline, calls],
        value: transactionValue,
        chainId: robinhood.id,
        gas,
        maxFeePerGas,
        maxPriorityFeePerGas,
      });

      setTxHash(hash);
      updateActivity(activityId, { hash });
      if (publicClient) await publicClient.waitForTransactionReceipt({ hash });

      setStep("success");
      updateActivity(activityId, { status: "success" });
      // Both sides of the trade just moved - re-read them instead of leaving
      // the pre-swap numbers on screen until the next poll.
      queryClient.invalidateQueries({ queryKey: [BALANCE_QUERY_KEY] });
      toast.success(`Swapped ${amountIn} ${tokenIn.symbol} for ${tokenOut.symbol}`);
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
