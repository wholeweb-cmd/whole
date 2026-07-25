import { useState, type ReactElement } from "react";
import { usePrivy } from "@privy-io/react-auth";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DisconnectWalletPopoverProps {
  children: ReactElement;
}

/** Requires an explicit confirmation before ending the wallet session. */
export function DisconnectWalletPopover({ children }: DisconnectWalletPopoverProps) {
  const { logout } = usePrivy();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={8}
        role="dialog"
        aria-label="Confirm wallet disconnect"
        className="surface-panel w-48 border-border p-2 font-mono"
      >
        <p className="px-2 pb-2 pt-1 text-[11px] text-muted-foreground">Disconnect wallet?</p>
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              void logout();
            }}
            className="rounded-md px-2.5 py-2 text-left text-xs font-semibold text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
          >
            Disconnect
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md px-2.5 py-2 text-left text-xs font-semibold text-primary transition hover:bg-primary/10"
          >
            Cancel
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
