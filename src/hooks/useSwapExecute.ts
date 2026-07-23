import { useState } from "react";
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

export type SwapStep = "idle" | "approving" | "swapping" | "success" | "error";

const ROUTER = UNISWAP.swapRouter as `0x${string}`;

interface ExecuteParams {
  tokenIn: SwapToken;
  tokenOut: SwapToken;
  amountIn: string;
  amountOut: string;
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

  async function execute({ tokenIn, tokenOut, amountIn, amountOut, slippage, route }: ExecuteParams) {
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
      const minOutNumber = Math.max(Number(amountOut || "0") * (1 - slippage / 100), 0);
      const amountOutMinimum =
        minOutNumber > 0 ? parseUnits(minOutNumber.toFixed(tokenOut.decimals), tokenOut.decimals) : 0n;

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

      // When the output is native ETH the router must receive the WETH first,
      // then unwrap it to the user - so recipient is the router and the call is
      // wrapped in a multicall with unwrapWETH9.
      const recipient = nativeOut ? ROUTER : (address as `0x${string}`);

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
                deadline,
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
                deadline,
                amountIn: amountInWei,
                amountOutMinimum,
              },
            ],
          });

      let hash: `0x${string}`;

      if (nativeOut) {
        const unwrapData = encodeFunctionData({
          abi: SWAP_ROUTER_ABI,
          functionName: "unwrapWETH9",
          args: [amountOutMinimum, address as `0x${string}`],
        });
        hash = await writeContractAsync({
          address: ROUTER,
          abi: SWAP_ROUTER_ABI,
          functionName: "multicall",
          args: [[swapData, unwrapData]],
          value: nativeIn ? amountInWei : undefined,
          chainId: robinhood.id,
        });
      } else if (isSingleHop(route)) {
        hash = await writeContractAsync({
          address: ROUTER,
          abi: SWAP_ROUTER_ABI,
          functionName: "exactInputSingle",
          args: [
            {
              tokenIn: route.nodes[0],
              tokenOut: route.nodes[1],
              fee: route.fees[0],
              recipient,
              deadline,
              amountIn: amountInWei,
              amountOutMinimum,
              sqrtPriceLimitX96: 0n,
            },
          ],
          value: nativeIn ? amountInWei : undefined,
          chainId: robinhood.id,
        });
      } else {
        hash = await writeContractAsync({
          address: ROUTER,
          abi: SWAP_ROUTER_ABI,
          functionName: "exactInput",
          args: [
            {
              path: encodePath(route),
              recipient,
              deadline,
              amountIn: amountInWei,
              amountOutMinimum,
            },
          ],
          value: nativeIn ? amountInWei : undefined,
          chainId: robinhood.id,
        });
      }

      setTxHash(hash);
      updateActivity(activityId, { hash });
      if (publicClient) await publicClient.waitForTransactionReceipt({ hash });

      setStep("success");
      updateActivity(activityId, { status: "success" });
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
