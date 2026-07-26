import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getWalletBalanceSnapshot } from "@/lib/explorer/balances";

const addressSchema = z.string().regex(/^0x[0-9a-fA-F]{40}$/);

const inputSchema = z.object({
  wallet: addressSchema,
  token: addressSchema.optional(),
  decimals: z.number().int().min(0).max(255),
});

/**
 * Same-origin balance fallback. This keeps browser CORS and public RPC
 * outages from turning a real wallet balance into an error placeholder.
 */
export const fetchWalletBalance = createServerFn({ method: "GET" })
  .validator(inputSchema)
  .handler(async ({ data }): Promise<{ raw: string; decimals: number }> => {
    const snapshot = await getWalletBalanceSnapshot(data.wallet as `0x${string}`);

    if (!data.token) {
      return { raw: snapshot.native.toString(), decimals: 18 };
    }

    const token = snapshot.tokens.get(data.token.toLowerCase());

    return {
      raw: (token?.raw ?? 0n).toString(),
      decimals: token?.decimals ?? data.decimals,
    };
  });
