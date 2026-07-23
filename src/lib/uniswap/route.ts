import { getToken } from "@/lib/tokens/index";

// ---------------------------------------------------------------------------
// Swap routing.
//
// Almost every token on Robinhood Chain pools against USDG (a handful pool
// against WETH, which itself pools against USDG). So USDG is used as the
// universal routing hub: any token reaches any other token by hopping through
// USDG. A route is a list of pool "nodes" (token addresses) plus the fee tier
// of each hop between them - a single-hop route when both tokens share USDG
// as their direct quote, otherwise a two- or three-hop path.
// ---------------------------------------------------------------------------

export interface SwapToken {
  symbol: string;
  name: string;
  /** ERC20 address used in pools (WETH's address for native ETH). */
  address: `0x${string}`;
  decimals: number;
  logo: string | null;
  price: number | null;
  /** Fee tier of this token's pool against its quote asset (null = no pool). */
  feeTier: number | null;
  /** Which asset this token pools against: "USDG", "WETH", or another symbol. */
  quoteSymbol: string;
  /** True for native ETH (routed as WETH, sent/received as ether). */
  isNative: boolean;
}

export interface Route {
  /** Token addresses in swap order: [tokenIn, …hubs…, tokenOut]. */
  nodes: `0x${string}`[];
  /** Fee tier for each hop; length === nodes.length - 1. */
  fees: number[];
}

const USDG_ADDRESS = (getToken("USDG")?.address ?? "").toLowerCase() as `0x${string}`;
const WETH_ADDRESS = (getToken("ETH")?.wrapped ?? "").toLowerCase() as `0x${string}`;

export function isUSDG(address: string) {
  return address.toLowerCase() === USDG_ADDRESS;
}
export function isWETH(address: string) {
  return address.toLowerCase() === WETH_ADDRESS;
}

/** Hops carrying `token` down to the USDG hub, or null if it can't be routed there. */
function hopsToUSDG(token: SwapToken, wethFee: number | null): Route | null {
  const addr = token.address.toLowerCase() as `0x${string}`;

  if (addr === USDG_ADDRESS) return { nodes: [USDG_ADDRESS], fees: [] };
  if (token.feeTier == null) return null;

  const quote = token.quoteSymbol.toUpperCase();

  if (quote === "USDG") {
    return { nodes: [addr, USDG_ADDRESS], fees: [token.feeTier] };
  }
  if (quote === "WETH" || addr === WETH_ADDRESS) {
    if (addr === WETH_ADDRESS) return { nodes: [addr, USDG_ADDRESS], fees: [token.feeTier] };
    if (wethFee == null) return null;
    return { nodes: [addr, WETH_ADDRESS, USDG_ADDRESS], fees: [token.feeTier, wethFee] };
  }

  // Pools only against some other token with no USDG route we can construct.
  return null;
}

/** Build a swap route from `tokenIn` to `tokenOut`, hubbing through USDG. */
export function buildRoute(
  tokenIn: SwapToken,
  tokenOut: SwapToken,
  wethFee: number | null,
): Route | null {
  const inAddr = tokenIn.address.toLowerCase();
  const outAddr = tokenOut.address.toLowerCase();
  if (inAddr === outAddr) return null;

  const inHops = hopsToUSDG(tokenIn, wethFee);
  const outHops = hopsToUSDG(tokenOut, wethFee);
  if (!inHops || !outHops) return null;

  // inHops ends at USDG; reversed outHops starts at USDG - splice them at that
  // shared junction (drop the duplicate USDG node).
  const revNodes = [...outHops.nodes].reverse();
  const revFees = [...outHops.fees].reverse();

  const nodes = [...inHops.nodes, ...revNodes.slice(1)];
  const fees = [...inHops.fees, ...revFees];

  // Collapse any adjacent duplicate node (e.g. USDG↔USDG when one side is the
  // hub itself) so we never emit a zero-length hop.
  const cleanNodes: `0x${string}`[] = [];
  const cleanFees: number[] = [];
  for (let i = 0; i < nodes.length; i++) {
    if (i > 0 && nodes[i] === nodes[i - 1]) continue;
    if (i > 0) cleanFees.push(fees[i - 1]);
    cleanNodes.push(nodes[i]);
  }

  if (cleanNodes.length < 2 || cleanFees.length < 1) return null;
  return { nodes: cleanNodes, fees: cleanFees };
}

export function isSingleHop(route: Route) {
  return route.fees.length === 1;
}

/** Encode a multi-hop route as a Uniswap V3 path: addr(20) fee(3) addr(20) fee(3) … addr. */
export function encodePath(route: Route): `0x${string}` {
  let path = "0x";
  for (let i = 0; i < route.fees.length; i++) {
    path += route.nodes[i].slice(2);
    path += route.fees[i].toString(16).padStart(6, "0");
  }
  path += route.nodes[route.nodes.length - 1].slice(2);
  return path.toLowerCase() as `0x${string}`;
}

/** Human-readable route, e.g. "NVDA → USDG → GME". */
export function routeLabel(route: Route, symbolFor: (addr: string) => string): string {
  return route.nodes.map((n) => symbolFor(n)).join(" → ");
}
