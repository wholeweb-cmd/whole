export type IntentKind =
  "swap" | "add_liquidity" | "remove_liquidity" | "claim_fees" | "navigate" | "answer" | "unknown";

export interface SwapIntent {
  kind: "swap";
  amount: string;
  fromToken: string;
  toToken: string;
  raw: string;
}

export interface AddLiquidityIntent {
  kind: "add_liquidity";
  tokenA: string;
  tokenB: string;
  amountA: string;
  amountB: string;
  raw: string;
}

export interface RemoveLiquidityIntent {
  kind: "remove_liquidity";
  positionId?: string;
  raw: string;
}

export interface ClaimFeesIntent {
  kind: "claim_fees";
  positionId?: string;
  raw: string;
}

export interface NavigateIntent {
  kind: "navigate";
  to: "/swap" | "/liquidity" | "/wallet" | "/markets" | "/";
  label: string;
  raw: string;
}

/** A plain conversational reply with no on-chain action - e.g. answering "what's my balance?". */
export interface AnswerIntent {
  kind: "answer";
  reply: string;
  raw: string;
}

export interface UnknownIntent {
  kind: "unknown";
  raw: string;
  reason: string;
}

export type Intent =
  | SwapIntent
  | AddLiquidityIntent
  | RemoveLiquidityIntent
  | ClaimFeesIntent
  | NavigateIntent
  | AnswerIntent
  | UnknownIntent;
