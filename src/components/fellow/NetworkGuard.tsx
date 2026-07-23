import { useAccount, useSwitchChain } from "wagmi";
import { AlertTriangle } from "lucide-react";

import { robinhood } from "@/lib/web3/client";

/**
 * Fellow only ever reads/writes Robinhood Chain contracts - if the connected
 * wallet's active chain differs (e.g. a WalletConnect wallet that didn't
 * auto-switch on login), every write is blocked here rather than risking a
 * transaction confirmation that looks right but targets the wrong network.
 */
export function NetworkGuard() {
  const { isConnected, chainId } = useAccount();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected || chainId === robinhood.id) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex flex-wrap items-center justify-center gap-3 border-b border-yellow-500/40 bg-yellow-500 px-4 py-2 text-center text-xs font-medium text-black sm:text-sm">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>Wrong network - Fellow only works on Robinhood Chain. Switch to continue.</span>
      <button
        type="button"
        onClick={() => switchChain({ chainId: robinhood.id })}
        disabled={isPending}
        className="rounded-sm bg-black px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
      >
        {isPending ? "Switching…" : "Switch Network"}
      </button>
    </div>
  );
}
