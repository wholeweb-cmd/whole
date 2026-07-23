import { publicClient } from "@/lib/web3/client";

export async function getLatestBlock() {
  return publicClient.getBlockNumber();
}

export async function getGasPrice() {
  return publicClient.getGasPrice();
}

export async function getChainId() {
  return publicClient.getChainId();
}
