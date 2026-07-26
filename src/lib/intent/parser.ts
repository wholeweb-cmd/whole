import { TOKENS } from "@/lib/tokens/index";
import type { Intent } from "./types";

const KNOWN_SYMBOLS = TOKENS.map((t) => t.symbol);

/**
 * This is a deterministic, pattern-matching parser - not an LLM. It
 * recognizes a handful of common phrasings for the actions this app can
 * actually execute (swap, add/remove liquidity, navigation). Anything it
 * doesn't recognize falls through to an "unknown" intent with suggestions,
 * rather than guessing.
 */

function resolveSymbol(raw: string): string | null {
  const upper = raw.trim().toUpperCase();
  return KNOWN_SYMBOLS.find((s) => s === upper) ?? null;
}

function parseSwap(text: string): Intent | null {
  const match = text.match(/swap\s+([\d.]+)\s+([a-z]+)\s+(?:to|for|into)\s+([a-z]+)/i);
  if (!match) return null;

  const [, amount, fromRaw, toRaw] = match;
  const fromToken = resolveSymbol(fromRaw);
  const toToken = resolveSymbol(toRaw);

  if (!fromToken || !toToken) {
    return {
      kind: "unknown",
      raw: text,
      reason: `I don't recognize ${!fromToken ? fromRaw : toRaw}. Known tokens: ${KNOWN_SYMBOLS.join(", ")}.`,
    };
  }

  return { kind: "swap", amount, fromToken, toToken, raw: text };
}

function parseAddLiquidity(text: string): Intent | null {
  if (!/add\s+liquidity/i.test(text)) return null;

  // "add liquidity 10 ETH and 100 USDG" / "add liquidity 10 ETH, 100 USDG"
  const withAmounts = text.match(/([\d.]+)\s+([a-z]+)\D+([\d.]+)\s+([a-z]+)/i);

  if (withAmounts) {
    const [, amountA, aRaw, amountB, bRaw] = withAmounts;
    const tokenA = resolveSymbol(aRaw);
    const tokenB = resolveSymbol(bRaw);

    if (!tokenA || !tokenB) {
      return {
        kind: "unknown",
        raw: text,
        reason: `I don't recognize ${!tokenA ? aRaw : bRaw}. Known tokens: ${KNOWN_SYMBOLS.join(", ")}.`,
      };
    }

    return {
      kind: "add_liquidity",
      tokenA,
      tokenB,
      amountA,
      amountB,
      raw: text,
    };
  }

  // "add liquidity to ETH/USDG" (no amounts yet - ask for them in the card)
  const pairOnly = text.match(/([a-z]+)\s*[/-]\s*([a-z]+)/i);
  if (pairOnly) {
    const [, aRaw, bRaw] = pairOnly;
    const tokenA = resolveSymbol(aRaw);
    const tokenB = resolveSymbol(bRaw);

    if (tokenA && tokenB) {
      return {
        kind: "add_liquidity",
        tokenA,
        tokenB,
        amountA: "",
        amountB: "",
        raw: text,
      };
    }
  }

  return {
    kind: "unknown",
    raw: text,
    reason: 'Tell me the pair and amounts, e.g. "add liquidity 10 ETH and 100 USDG".',
  };
}

function parseRemoveLiquidity(text: string): Intent | null {
  if (!/remove\s+(all\s+)?liquidity/i.test(text)) return null;
  return { kind: "remove_liquidity", raw: text };
}

function parseNavigate(text: string): Intent | null {
  const match = text.match(
    /(?:go to|open|show|navigate to)\s+(swap|liquidity|portfolio|wallet|markets|dashboard|home)/i,
  );
  if (!match) return null;

  const target = match[1].toLowerCase();

  const routes: Record<
    string,
    { to: "/swap" | "/liquidity" | "/wallet" | "/markets" | "/"; label: string }
  > = {
    swap: { to: "/swap", label: "Swap" },
    liquidity: { to: "/liquidity", label: "Liquidity" },
    portfolio: { to: "/wallet", label: "Wallet" },
    wallet: { to: "/wallet", label: "Wallet" },
    markets: { to: "/markets", label: "Markets" },
    dashboard: { to: "/", label: "Dashboard" },
    home: { to: "/", label: "Dashboard" },
  };

  const route = routes[target];
  if (!route) return null;

  return { kind: "navigate", to: route.to, label: route.label, raw: text };
}

export function parseIntent(input: string): Intent {
  const text = input.trim();

  if (!text) {
    return { kind: "unknown", raw: text, reason: "Type a command to get started." };
  }

  return (
    parseSwap(text) ??
    parseAddLiquidity(text) ??
    parseRemoveLiquidity(text) ??
    parseNavigate(text) ?? {
      kind: "unknown",
      raw: text,
      reason:
        'Try something like "Swap 100 USDG to ETH", "Add liquidity 10 ETH and 100 USDG", or "Show markets".',
    }
  );
}
