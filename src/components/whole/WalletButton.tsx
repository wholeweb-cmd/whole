import { Wallet } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { useNativeBalance } from "@/hooks/useNativeBalance";
import { useWalletAddress } from "@/hooks/useWalletAddress";
import { DisconnectWalletPopover } from "./DisconnectWalletPopover";

export function WalletButton() {
  const { ready, authenticated, login } = usePrivy();
  const { address, isLoading: walletLoading } = useWalletAddress();

  const balance = useNativeBalance(address);

  if (!ready) {
    return (
      <button
        disabled
        className="hidden items-center gap-2 surface-tile rounded-full border border-border bg-card px-4 py-2 opacity-50 sm:flex"
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
        className="hidden items-center gap-2 surface-tile rounded-full border border-border bg-card px-4 py-2 glow-primary-hover hover:border-primary/60 sm:flex"
      >
        <Wallet className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-medium">Connect Wallet</span>
      </button>
    );
  }

  const addressLabel = address ?? "";
  const short =
    addressLabel.length > 10
      ? `${addressLabel.slice(0, 6)}...${addressLabel.slice(-4)}`
      : addressLabel;

  return (
    <DisconnectWalletPopover>
      <button
        type="button"
        className="hidden items-center gap-2 surface-tile rounded-full border border-border bg-card px-4 py-2 glow-primary-hover hover:border-primary/60 sm:flex"
      >
        <div className="h-2 w-2 rounded-full bg-green-500" />

        <div className="flex flex-col items-start leading-none">
          <span className="font-mono text-[11px] font-medium">{short}</span>

          <span className="text-[10px] text-muted-foreground">
            {walletLoading || balance.isLoading ? "…" : balance.value.toFixed(4)} ETH
          </span>
        </div>
      </button>
    </DisconnectWalletPopover>
  );
}
