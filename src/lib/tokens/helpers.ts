import { TOKENS, getToken } from "./index";

export function getTokenAddress(symbol: string): `0x${string}` {
  const token = getToken(symbol);

  if (!token) {
    throw new Error(`Unknown token: ${symbol}`);
  }

  return token.address;
}

export function getTokenDecimals(symbol: string): number {
  const token = getToken(symbol);

  if (!token) {
    throw new Error(`Unknown token: ${symbol}`);
  }

  return token.decimals;
}

export function getFeeTier(symbol: string): number {
  const token = getToken(symbol);

  if (!token) {
    throw new Error(`Unknown token: ${symbol}`);
  }

  return token.feeTier ?? 3000;
}

export function isNativeToken(symbol: string): boolean {
  const token = getToken(symbol);

  if (!token) {
    return false;
  }

  return token.isNative;
}

export function getWrappedAddress(symbol: string): `0x${string}` {
  const token = getToken(symbol);

  if (!token) {
    throw new Error(`Unknown token: ${symbol}`);
  }

  if (!token.isNative) {
    return token.address;
  }

  if (!token.wrapped) {
    throw new Error(`${symbol} has no wrapped token`);
  }

  return token.wrapped;
}

export function getAllTokens() {
  return TOKENS;
}

export { getToken };
