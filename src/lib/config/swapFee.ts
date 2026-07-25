export const SERVICE_FEE_BIPS = 17n;
export const SERVICE_FEE_PERCENT = Number(SERVICE_FEE_BIPS) / 100;
export const SERVICE_FEE_RATE = Number(SERVICE_FEE_BIPS) / 10_000;
export const SERVICE_FEE_RECIPIENT = "0xda5a7bd6dd715662dcaa5b307b4cd9480f1861ab" as const;

const BIPS_DENOMINATOR = 10_000n;

/**
 * Mirrors SwapRouter02's fee calculation so the UI shows the same net amount
 * that the router sends to the user.
 */
export function deductServiceFee(grossAmount: bigint) {
  const feeAmount = (grossAmount * SERVICE_FEE_BIPS) / BIPS_DENOMINATOR;
  return {
    feeAmount,
    netAmount: grossAmount - feeAmount,
  };
}
