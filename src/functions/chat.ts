import { createServerFn } from "@tanstack/react-start";
import Groq from "groq-sdk";
import { z } from "zod";

import { getAllMarketData, getMarketData, type MarketData } from "@/lib/uniswap/market";
import { getTokenMeta, type TokenMeta } from "@/lib/uniswap/tokenMeta";
import { TOKENS, getToken } from "@/lib/tokens/index";
import { parseIntent } from "@/lib/intent/parser";
import type { Intent } from "@/lib/intent/types";

import { fetchPortfolio } from "./portfolio";

const TOOL_NAME = "propose_action";
const MODEL = "llama-3.3-70b-versatile";
const EXECUTABLE_SYMBOLS = TOKENS.map((t) => t.symbol).join(", ");

const chatInputSchema = z.object({
  message: z.string().min(1).max(2000),
  address: z.string().optional(),
});

const tool: Groq.Chat.Completions.ChatCompletionTool = {
  type: "function",
  function: {
    name: TOOL_NAME,
    description:
      "Propose exactly one WHOLE action or answer in response to the user's message. Always call this tool exactly once.",
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
          description:
            "A concise natural-language reply shown to the user. Token analysis may use a few short sentences.",
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
          enum: ["/swap", "/liquidity", "/wallet", "/markets", "/"],
          description: "navigate: destination route.",
        },
        navigateLabel: {
          type: "string",
          description: "navigate: human-readable destination label.",
        },
        reason: {
          type: "string",
          description:
            "unknown: a short explanation of why this couldn't be resolved into an action.",
        },
      },
      required: ["kind", "reply"],
    },
  },
};

function buildSystemPrompt(context: string) {
  return `You are WHOLE, a conversational assistant embedded in a DeFi workspace for Robinhood Chain.

Rules you must always follow:
- Always reply in English, even when the user's message is written in another language.
- You never execute transactions yourself. You only ever propose ONE action by calling the ${TOOL_NAME} tool exactly once per message - the user always confirms manually in a review card afterward before anything is signed.
- You can understand and discuss any Robinhood Chain token resolved in CONTEXT by symbol, name, or contract address. Do not limit token analysis to ${EXECUTABLE_SYMBOLS}.
- Executable swap and add-liquidity review cards currently support ${EXECUTABLE_SYMBOLS}. This execution limit does not prevent you from identifying, explaining, or analyzing any other token. If the user requests an unsupported transaction, explain the limitation without pretending the token is unknown.
- Never invent balances, prices, TVL, APR, or any other number. Only state figures that literally appear in the CONTEXT block below. If information isn't in CONTEXT, say you don't have it.
- When asked to analyze a token, identify the matched token and contract, summarize only the available market figures, and clearly mention when data or verification is unavailable. A contract address alone is valid natural-language input.
- If a request is ambiguous (e.g. "remove my liquidity" while the user has several open positions and didn't say which), do not guess - use kind "unknown" or "answer" and ask a clarifying question.
- Keep "reply" concise. Token analysis can use up to four short sentences.
- Use kind "answer" for greetings, product questions, and portfolio/market questions you can answer from CONTEXT.
- Use kind "navigate" only for explicit requests to open a page.

CONTEXT:
${context}`;
}

// The complete discovered universe is searched before prompting. Only direct
// matches plus a short active-market overview are sent to the model, which
// keeps prompts small without making long-tail tokens invisible.
const MAX_MATCHED_TOKENS = 12;
const MAX_ACTIVE_MARKETS = 15;
const TOKEN_ADDRESS_PATTERN = /0x[a-fA-F0-9]{40}/g;

function marketLine(market: MarketData): string {
  return `${market.symbol} (${market.name}) contract=${market.address} pair=${market.pair} price=${
    market.price != null ? `$${market.price}` : "unavailable"
  } tvl=${market.tvl != null ? `$${market.tvl}` : "unavailable"} change24h=${
    market.change24h != null ? `${market.change24h}%` : "unavailable"
  } volume24h=${
    market.volume24h != null ? `$${market.volume24h}` : "unavailable"
  } verified=${market.verified ? "yes" : "no"}`;
}

function metaLine(meta: TokenMeta): string {
  return `${meta.symbol} (${meta.name}) contract=${meta.address} price=${
    meta.priceUSD != null ? `$${meta.priceUSD}` : "unavailable"
  } volume24h=${meta.volume24h != null ? `$${meta.volume24h}` : "unavailable"} marketCap=${
    meta.marketCap != null ? `$${meta.marketCap}` : "unavailable"
  } verified=${meta.recognized ? "yes" : "no"}; no indexed pool market was found`;
}

function containsSymbol(message: string, symbol: string): boolean {
  if (!symbol) return false;
  const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])\\$?${escaped}($|[^a-z0-9])`, "i").test(message);
}

async function resolveMentionedTokens(
  message: string,
  markets: MarketData[],
): Promise<{ markets: MarketData[]; metadata: TokenMeta[] }> {
  const lowerMessage = message.toLowerCase();
  const requestedAddresses = new Set(
    (message.match(TOKEN_ADDRESS_PATTERN) ?? []).map((address) => address.toLowerCase()),
  );
  const matched = new Map<string, MarketData>();
  const metadata = new Map<string, TokenMeta>();

  for (const market of markets) {
    const addressMatch = requestedAddresses.has(market.address.toLowerCase());
    const symbolMatch = containsSymbol(message, market.symbol);
    const normalizedName = market.name.trim().toLowerCase();
    const nameMatch =
      normalizedName.length >= 4 &&
      normalizedName !== "token" &&
      normalizedName !== "coin" &&
      lowerMessage.includes(normalizedName);

    if (addressMatch || symbolMatch || nameMatch) {
      matched.set(market.address.toLowerCase(), market);
      if (matched.size >= MAX_MATCHED_TOKENS) break;
    }
  }

  // A raw address is resolved directly through the explorer and pool index,
  // even when it is outside the warmed/recognized market list.
  for (const address of requestedAddresses) {
    if (matched.has(address)) continue;

    const market = await getMarketData(address);
    if (market) {
      matched.set(address, market);
      continue;
    }

    const meta = await getTokenMeta(address as `0x${string}`);
    if (meta) metadata.set(address, meta);
  }

  return {
    markets: [...matched.values()].slice(0, MAX_MATCHED_TOKENS),
    metadata: [...metadata.values()].slice(0, MAX_MATCHED_TOKENS),
  };
}

async function buildContext(message: string, address?: string): Promise<string> {
  const markets = await getAllMarketData();
  const mentioned = await resolveMentionedTokens(message, markets);
  const matchedAddresses = new Set(mentioned.markets.map((market) => market.address.toLowerCase()));

  const matchedLines = [
    ...mentioned.markets.map(marketLine),
    ...mentioned.metadata.map(metaLine),
  ].join("\n");
  const activeLines =
    markets
      .filter((market) => !matchedAddresses.has(market.address.toLowerCase()))
      .slice(0, MAX_ACTIVE_MARKETS)
      .map(marketLine)
      .join("\n") || "none";

  const marketContext = `Robinhood Chain token resolver:
- ${markets.length} indexed markets searched by symbol, name, and address.
- Raw contract addresses are also looked up directly through the chain explorer.

Tokens matched from this request:
${matchedLines || "none"}

Most active markets:
${activeLines}`;

  if (!address) {
    return `Wallet: not connected.\n\n${marketContext}`;
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

${marketContext}`;
  } catch {
    return `Wallet: ${address} (balances temporarily unavailable)\n\n${marketContext}`;
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
        const normalizedFrom = fromToken.toUpperCase();
        const normalizedTo = toToken.toUpperCase();

        if (!getToken(normalizedFrom) || !getToken(normalizedTo)) {
          return {
            kind: "answer",
            reply: `I can analyze ${normalizedFrom} and ${normalizedTo}, but executable swap cards currently support ${EXECUTABLE_SYMBOLS}.`,
            raw,
          };
        }

        return {
          kind: "swap",
          amount,
          fromToken: normalizedFrom,
          toToken: normalizedTo,
          raw,
        };
      }
      break;
    }
    case "add_liquidity": {
      const tokenA = str(input.tokenA);
      const tokenB = str(input.tokenB);
      if (tokenA && tokenB) {
        const normalizedA = tokenA.toUpperCase();
        const normalizedB = tokenB.toUpperCase();

        if (!getToken(normalizedA) || !getToken(normalizedB)) {
          return {
            kind: "answer",
            reply: `I can analyze ${normalizedA} and ${normalizedB}, but executable liquidity cards currently support ${EXECUTABLE_SYMBOLS}.`,
            raw,
          };
        }

        return {
          kind: "add_liquidity",
          tokenA: normalizedA,
          tokenB: normalizedB,
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
        to === "/wallet" ||
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
            "My Agent isn't configured yet (missing GROQ_API_KEY on the server), so I can only match a few fixed actions. Ask the site owner to configure GROQ_API_KEY for natural-language token analysis.",
        };
      }
      return fallback;
    }

    try {
      const client = new Groq({ apiKey });
      const context = await buildContext(data.message, data.address);

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
        return {
          kind: "unknown",
          raw: data.message,
          reason: "The assistant didn't return a usable response.",
        };
      }

      let input: Record<string, unknown>;
      try {
        input = JSON.parse(toolCall.function.arguments);
      } catch {
        return {
          kind: "unknown",
          raw: data.message,
          reason: "The assistant returned a malformed response.",
        };
      }

      return toIntent(data.message, input);
    } catch (err) {
      console.error(err);
      return {
        kind: "unknown",
        raw: data.message,
        reason: "My Agent is temporarily unavailable. Please try again.",
      };
    }
  });
