import { formatEther } from "ethers";

export function formatBalance(balance: bigint) {
  return Number(formatEther(balance)).toFixed(4);
}
