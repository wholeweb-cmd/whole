import { createServerFn } from "@tanstack/react-start";
import Groq from "groq-sdk";
import { z } from "zod";

import { getAllMarketData } from "@/lib/uniswap/market";
import { TOKENS } from "@/lib/tokens/index";
import { parseIntent } from "@/lib/intent/parser";
import type { Intent } from "@/lib/intent/types";

import { fetchPortfolio } from "./portfolio";

const TOOL_NAME = "propose_action";
const MODEL = "llama-3.3-70b-versatile";
const SUPPORTED_SYMBOLS = TOKENS.map((t) => t.symbol).join(", ");

const chatInputSchema = z.object({
  message: z.string().min(1).max(2000),
  address: z.string().optional(),
});

const tool: Groq.Chat.Completions.ChatCompletionTool = {
  type: "function",
  function: {
    name: TOOL_NAME,
    description:
      "Propose exactly one Fellow action or answer in response to the user's message. Always call this tool exactly once.",
    parameters: {
      type: "object",
      properties: {
        kind: {
          type: "string",
          enum: [
            "swap",
            "add_liquidity",
            "remove_liquidity",
            "claim_fees",
            "navigate",
            "answer",
            "unknown",
          ],
          description: "The type of action or response being proposed.",
        },
        reply: {
          type: "string",
          description: "A short (under 200 characters) natural language reply shown to the user.",
        },
        amount: { type: "string", description: "swap: amount of fromToken to sell." },
        fromToken: { type: "string", description: "swap: token symbol to sell." },
        toToken: { type: "string", description: "swap: token symbol to buy." },
        tokenA: { type: "string", description: "add_liquidity: first token symbol." },
        tokenB: { type: "string", description: "add_liquidity: second token symbol." },
        amountA: { type: "string", description: "add_liquidity: amount of tokenA." },
        amountB: { type: "string", description: "add_liquidity: amount of tokenB." },
        positionId: {
          type: "string",
          description:
            "remove_liquidity / claim_fees: the LP position token id, only if it can be resolved unambiguously from the CONTEXT (e.g. exactly one matching open position).",
        },
        navigateTo: {
          type: "string",
          enum: ["/swap", "/liquidity", "/portfolio", "/markets", "/"],
          description: "navigate: destination route.",
        },
        navigateLabel: { type: "string", description: "navigate: human-readable destination label." },
        reason: {
          type: "string",
          description: "unknown: a short explanation of why this couldn't be resolved into an action.",
        },
      },
      required: ["kind", "reply"],
    },
  },
};

function buildSystemPrompt(context: string) {
  return `You are Fellow, a conversational assistant embedded in a DeFi terminal for Robinhood Chain.

Rules you must always follow:
- You never execute transactions yourself. You only ever propose ONE action by calling the ${TOOL_NAME} tool exactly once per message - the user always confirms manually in a review card afterward before anything is signed.
- Only reference these supported tokens: ${SUPPORTED_SYMBOLS}. If the user names anything else, use kind "unknown" and explain why in "reason".
- Never invent balances, prices, TVL, APR, or any other number. Only state figures that literally appear in the CONTEXT block below. If information isn't in CONTEXT, say you don't have it.
- If a request is ambiguous (e.g. "remove my liquidity" while the user has several open positions and didn't say which), do not guess - use kind "unknown" or "answer" and ask a clarifying question.
- Keep "reply" concise: one or two short sentences.
- Use kind "answer" for greetings, product questions, and portfolio/market questions you can answer from CONTEXT.
- Use kind "navigate" only for explicit requests to open a page.

CONTEXT:
${context}`;
}

// The chat model has a strict per-request token budget, and the full market
// list is ~1,400 rows - far too large to inline. Only the most active markets
// are ever relevant to a conversational question, so cap the context.
const MAX_MARKETS_IN_CONTEXT = 25;

async function buildContext(address?: string): Promise<string> {
  const markets = await getAllMarketData();
  const marketLines =
    markets
      .slice(0, MAX_MARKETS_IN_CONTEXT)
      .map(
        (m) =>
          `${m.symbol} (${m.pair}): price=${m.price != null ? `$${m.price}` : "?"} vol24h=${
            m.volume24h != null ? `$${m.volume24h.toFixed(0)}` : "?"
          }`,
      )
      .join("\n") || "none";

  if (!address) {
    return `Wallet: not connected.\n\nMarkets (real-time, on-chain):\n${marketLines}`;
  }

  try {
    const portfolio = await fetchPortfolio({ data: { address } });

    const assetLines =
      portfolio.assets
        .map(
          (a) =>
            `${a.symbol}: amount=${a.amount} value=${a.value != null ? `$${a.value.toFixed(2)}` : "unknown"}`,
        )
        .join("\n") || "none";

    const positionLines =
      portfolio.positions
        .map(
          (p) =>
            `position #${p.tokenId}: ${p.pair} (fee ${p.fee / 10000}%), unclaimed fees ${p.tokensOwed0} ${p.token0Symbol} + ${p.tokensOwed1} ${p.token1Symbol}`,
        )
        .join("\n") || "none";

    return `Wallet: ${address}
Total portfolio value: $${portfolio.totalValue.toFixed(2)}
Total claimable fees: $${portfolio.claimableFeesUSD.toFixed(2)}

Assets:
${assetLines}

Open LP positions:
${positionLines}

Markets (real-time, on-chain):
${marketLines}`;
  } catch {
    return `Wallet: ${address} (balances temporarily unavailable)\n\nMarkets (real-time, on-chain):\n${marketLines}`;
  }
}

function toIntent(raw: string, input: Record<string, unknown>): Intent {
  const kind = typeof input.kind === "string" ? input.kind : "";
  const reply = typeof input.reply === "string" ? input.reply : "";
  const str = (v: unknown) => (typeof v === "string" && v.length > 0 ? v : undefined);

  switch (kind) {
    case "swap": {
      const amount = str(input.amount);
      const fromToken = str(input.fromToken);
      const toToken = str(input.toToken);
      if (amount && fromToken && toToken) {
        return {
          kind: "swap",
          amount,
          fromToken: fromToken.toUpperCase(),
          toToken: toToken.toUpperCase(),
          raw,
        };
      }
      break;
    }
    case "add_liquidity": {
      const tokenA = str(input.tokenA);
      const tokenB = str(input.tokenB);
      if (tokenA && tokenB) {
        return {
          kind: "add_liquidity",
          tokenA: tokenA.toUpperCase(),
          tokenB: tokenB.toUpperCase(),
          amountA: str(input.amountA) ?? "",
          amountB: str(input.amountB) ?? "",
          raw,
        };
      }
      break;
    }
    case "remove_liquidity":
      return { kind: "remove_liquidity", positionId: str(input.positionId), raw };
    case "claim_fees":
      return { kind: "claim_fees", positionId: str(input.positionId), raw };
    case "navigate": {
      const to = str(input.navigateTo);
      if (
        to === "/swap" ||
        to === "/liquidity" ||
        to === "/portfolio" ||
        to === "/markets" ||
        to === "/"
      ) {
        return { kind: "navigate", to, label: str(input.navigateLabel) ?? to, raw };
      }
      break;
    }
    case "answer":
      if (reply) return { kind: "answer", reply, raw };
      break;
    case "unknown":
      return {
        kind: "unknown",
        raw,
        reason: str(input.reason) ?? reply ?? "I couldn't understand that.",
      };
  }

  // The declared kind was missing required fields - fall back to whatever
  // reply text the model gave rather than guessing at an action.
  if (reply) return { kind: "answer", reply, raw };
  return { kind: "unknown", raw, reason: "I couldn't understand that." };
}

export const chat = createServerFn({ method: "POST" })
  .validator(chatInputSchema)
  .handler(async ({ data }): Promise<Intent> => {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      const fallback = parseIntent(data.message);
      if (fallback.kind === "unknown") {
        return {
          kind: "unknown",
          raw: data.message,
          reason:
            "The AI assistant isn't configured yet (missing GROQ_API_KEY on the server), so I'm only matching a few fixed phrasings. Try something like \"swap 10 USDG to ETH\", or ask the site owner to set GROQ_API_KEY.",
        };
      }
      return fallback;
    }

    try {
      const client = new Groq({ apiKey });
      const context = await buildContext(data.address);

      const response = await client.chat.completions.create({
        model: MODEL,
        max_tokens: 512,
        messages: [
          { role: "system", content: buildSystemPrompt(context) },
          { role: "user", content: data.message },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: TOOL_NAME } },
      });

      const toolCall = response.choices[0]?.message?.tool_calls?.[0];

      if (!toolCall) {
        return { kind: "unknown", raw: data.message, reason: "The assistant didn't return a usable response." };
      }

      let input: Record<string, unknown>;
      try {
        input = JSON.parse(toolCall.function.arguments);
      } catch {
        return { kind: "unknown", raw: data.message, reason: "The assistant returned a malformed response." };
      }

      return toIntent(data.message, input);
    } catch (err) {
      console.error(err);
      return {
        kind: "unknown",
        raw: data.message,
        reason: "The AI assistant is temporarily unavailable. Please try again.",
      };
    }
  });
