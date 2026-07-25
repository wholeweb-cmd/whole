import { createFileRoute } from "@tanstack/react-router";
import { usePrivy } from "@privy-io/react-auth";

import { useSettingsStore } from "@/lib/store/settingsStore";
import { CHAIN } from "@/lib/config/chain";
import { useWalletAddress } from "@/hooks/useWalletAddress";
import { DisconnectWalletPopover } from "@/components/whole/DisconnectWalletPopover";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings" }] }),
  component: SettingsPage,
});

const SLIPPAGE_PRESETS = [0.1, 0.5, 1.0];

function SettingsPage() {
  const { authenticated, login } = usePrivy();
  const { address } = useWalletAddress();
  const defaultSlippage = useSettingsStore((s) => s.defaultSlippage);
  const setDefaultSlippage = useSettingsStore((s) => s.setDefaultSlippage);

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-5 font-mono md:p-7">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      </div>

      <div className="surface-panel rounded-xl border border-border p-7">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Default Slippage Tolerance
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Used as the starting slippage for swaps confirmed through the command bar, and pre-fills
          the Swap page.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {SLIPPAGE_PRESETS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setDefaultSlippage(v)}
              className={`rounded-lg px-3 py-2 text-sm transition ${
                defaultSlippage === v
                  ? "glow-primary bg-primary text-primary-foreground"
                  : "surface-tile border border-border hover:border-primary hover:bg-primary/5"
              }`}
            >
              {v}%
            </button>
          ))}

          <input
            value={defaultSlippage}
            onChange={(e) => setDefaultSlippage(Number(e.target.value))}
            inputMode="decimal"
            className="w-24 rounded-lg border border-border bg-transparent px-3 py-2 text-center text-sm outline-none transition focus:border-primary/60"
          />
          <span className="text-sm text-muted-foreground">%</span>
        </div>
      </div>

      <div className="surface-panel rounded-xl border border-border p-7">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Wallet
        </h2>

        {authenticated ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground">Connected</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{address}</p>
            </div>
            <DisconnectWalletPopover>
              <button
                type="button"
                className="surface-tile rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition hover:border-primary hover:bg-primary/5"
              >
                Disconnect
              </button>
            </DisconnectWalletPopover>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">No wallet connected.</p>
            <button
              type="button"
              onClick={login}
              className="glow-primary glow-primary-hover rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Connect Wallet
            </button>
          </div>
        )}
      </div>

      <div className="surface-panel rounded-xl border border-border p-7">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Network
        </h2>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Chain</span>
          <span className="text-foreground">
            {CHAIN.name} (id {CHAIN.id})
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Explorer</span>
          <a
            href={CHAIN.explorer}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            {CHAIN.explorer}
          </a>
        </div>
      </div>
    </div>
  );
}
