import { Wallet } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { useNativeBalance } from "@/hooks/useNativeBalance";

export function WalletButton() {
  const { ready, authenticated, login, logout, user } = usePrivy();

  const address =
    user?.wallet?.address ?? user?.linkedAccounts?.find((a) => a.type === "wallet")?.address ?? "";

  const balance = useNativeBalance(
    ready && authenticated ? (address as `0x${string}` | undefined) : undefined,
  );

  if (!ready) {
    return (
      <button
        disabled
        className="hidden items-center gap-2 rounded-sm border border-border bg-card px-3 py-1.5 opacity-50 sm:flex"
      >
        <Wallet className="h-3.5 w-3.5 text-primary" />
        <span className="font-mono text-xs">Loading...</span>
      </button>
    );
  }

  if (!authenticated) {
    return (
      <button
        onClick={login}
        className="hidden items-center gap-2 rounded-sm border border-border bg-card px-3 py-1.5 transition hover:border-primary sm:flex"
      >
        <Wallet className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-medium">Connect Wallet</span>
      </button>
    );
  }

  const short = address.length > 10 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address;

  return (
    <button
      onClick={logout}
      className="hidden items-center gap-2 rounded-sm border border-border bg-card px-3 py-1.5 transition hover:border-primary sm:flex"
    >
      <div className="h-2 w-2 rounded-full bg-green-500" />

      <div className="flex flex-col items-start leading-none">
        <span className="font-mono text-[11px] font-medium">{short}</span>

        <span className="text-[10px] text-muted-foreground">{balance} ETH</span>
      </div>
    </button>
  );
}
