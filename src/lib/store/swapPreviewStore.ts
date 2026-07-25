import { create } from "zustand";

/**
 * The swap form's live routing state, published for the Route Preview card
 * that sits beside it on the Swap page.
 *
 * The form owns this state; the preview only reads it. Going through a store
 * rather than lifting state into the route keeps SwapCard's own API untouched.
 */

export type SwapPreviewStatus = "idle" | "resolving" | "quoting" | "noRoute" | "ready";

export interface SwapPreview {
  /** Ticker of every stop in swap order, e.g. ["ETH", "WETH", "USDG"]. */
  path: string[];
  /** What happens between each pair of stops: a pool's fee tier, or a wrap. */
  hopLabels: string[];
  fromSymbol: string | null;
  toSymbol: string | null;
  amountIn: string;
  amountOut: string;
  /** Gross on-chain quote before the service fee, used for price impact. */
  grossAmountOut: string;
  serviceFee: string;
  /** Mid-market output implied by each token's USD price, for price impact. */
  midOut: string | null;
  quoteSource: "onchain" | "price" | null;
  slippage: number;
  status: SwapPreviewStatus;
}

export const EMPTY_PREVIEW: SwapPreview = {
  path: [],
  hopLabels: [],
  fromSymbol: null,
  toSymbol: null,
  amountIn: "",
  amountOut: "",
  grossAmountOut: "",
  serviceFee: "",
  midOut: null,
  quoteSource: null,
  slippage: 0.5,
  status: "idle",
};

interface SwapPreviewStore extends SwapPreview {
  publish: (preview: SwapPreview) => void;
  clear: () => void;
}

export const useSwapPreviewStore = create<SwapPreviewStore>((set) => ({
  ...EMPTY_PREVIEW,
  publish: (preview) => set(preview),
  clear: () => set(EMPTY_PREVIEW),
}));
