import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { encodeFunctionData, formatUnits } from "viem";

import { CHAIN } from "@/lib/config/chain";
import { ERC20_ABI } from "@/lib/uniswap/abi/erc20";
import type { SwapToken } from "@/lib/uniswap/route";
import {
  BALANCE_QUERY_KEY,
  ZERO_BALANCE,
  type TokenBalance,
} from "./useERC20Balance";
import { useWalletAddress } from "./useWalletAddress";

const REFRESH_MS = 15_000;
const REQUEST_CHUNK_SIZE = 40;
const REQUEST_TIMEOUT_MS = 8_000;

interface RpcRequest {
  jsonrpc: "2.0";
  id: number;
  method: "eth_getBalance" | "eth_call";
  params: unknown[];
}

interface RpcResponse {
  id: number;
  result?: `0x${string}`;
  error?: { code: number; message: string };
}

type BalanceMap = Record<string, bigint | null>;

export function swapTokenKey(token: SwapToken) {
  return token.isNative ? "native:eth" : `erc20:${token.address.toLowerCase()}`;
}

async function fetchBalanceChunk(
  requests: RpcRequest[],
  signal: AbortSignal,
): Promise<RpcResponse[]> {
  const controller = new AbortController();
  const abortFromQuery = () => controller.abort(signal.reason);
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  if (signal.aborted) abortFromQuery();
  else signal.addEventListener("abort", abortFromQuery, { once: true });

  let response: Response;
  try {
    response = await fetch(CHAIN.rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(requests),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener("abort", abortFromQuery);
  }

  if (!response.ok) {
    throw new Error(`Balance RPC returned HTTP ${response.status}`);
  }

  const payload = (await response.json()) as RpcResponse[] | RpcResponse;
  return Array.isArray(payload) ? payload : [payload];
}

/**
 * Reads every token shown by the Swap picker in a small number of JSON-RPC
 * batch requests. Previously each row opened its own polling query; with a
 * large token list those calls continuously cancelled and restarted before
 * the RPC could answer, leaving the visible balance stuck on a loading mark.
 */
export function useSwapBalances(tokens: SwapToken[]) {
  const { address, isLoading: walletLoading } = useWalletAddress();

  const uniqueTokens = useMemo(() => {
    const seen = new Set<string>();
    return tokens.filter((token) => {
      const key = swapTokenKey(token);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [tokens]);

  const tokenSignature = useMemo(
    () =>
      uniqueTokens
        .map((token) => `${swapTokenKey(token)}:${token.decimals}`)
        .sort()
        .join("|"),
    [uniqueTokens],
  );

  const query = useQuery({
    queryKey: [BALANCE_QUERY_KEY, "swap-batch", address?.toLowerCase(), tokenSignature],
    enabled: Boolean(address && uniqueTokens.length),
    staleTime: 8_000,
    refetchInterval: REFRESH_MS,
    refetchIntervalInBackground: true,
    refetchOnReconnect: "always",
    refetchOnWindowFocus: "always",
    retry: 2,
    retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 5_000),
    queryFn: async ({ signal }) => {
      const wallet = address as `0x${string}`;
      const balanceCall = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [wallet],
      });

      const requests: RpcRequest[] = uniqueTokens.map((token, index) =>
        token.isNative
          ? {
              jsonrpc: "2.0",
              id: index + 1,
              method: "eth_getBalance",
              params: [wallet, "latest"],
            }
          : {
              jsonrpc: "2.0",
              id: index + 1,
              method: "eth_call",
              params: [{ to: token.address, data: balanceCall }, "latest"],
            },
      );

      const chunks: RpcRequest[][] = [];
      for (let index = 0; index < requests.length; index += REQUEST_CHUNK_SIZE) {
        chunks.push(requests.slice(index, index + REQUEST_CHUNK_SIZE));
      }

      const responses = (
        await Promise.all(chunks.map((chunk) => fetchBalanceChunk(chunk, signal)))
      ).flat();
      const byId = new Map(responses.map((response) => [response.id, response]));

      let successfulReads = 0;
      const balances: BalanceMap = {};

      uniqueTokens.forEach((token, index) => {
        const response = byId.get(index + 1);
        const key = swapTokenKey(token);

        if (!response?.result) {
          balances[key] = null;
          return;
        }

        try {
          balances[key] = BigInt(response.result);
          successfulReads += 1;
        } catch {
          balances[key] = null;
        }
      });

      if (requests.length > 0 && successfulReads === 0) {
        throw new Error("The balance service did not return any token balances");
      }

      return balances;
    },
  });

  const getBalance = useCallback(
    (token: SwapToken | null): TokenBalance => {
      if (!token) return ZERO_BALANCE;

      const enabled = Boolean(address);
      const raw = query.data?.[swapTokenKey(token)];
      const hasValue = typeof raw === "bigint";

      if (!hasValue) {
        return {
          ...ZERO_BALANCE,
          decimals: token.decimals,
          isLoading:
            enabled &&
            !query.data &&
            (query.isLoading || query.isFetching || walletLoading),
          isError: enabled && (query.isError || raw === null),
        };
      }

      const exact = formatUnits(raw, token.decimals);
      return {
        raw,
        decimals: token.decimals,
        exact,
        value: Number(exact),
        isLoading: false,
        isError: false,
      };
    },
    [
      address,
      query.data,
      query.isError,
      query.isFetching,
      query.isLoading,
      walletLoading,
    ],
  );

  return {
    getBalance,
    refresh: query.refetch,
  };
}
