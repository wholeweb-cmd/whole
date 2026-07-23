import { createFileRoute } from "@tanstack/react-router";
import { usePrivy } from "@privy-io/react-auth";

import { useSettingsStore } from "@/lib/store/settingsStore";
import { CHAIN } from "@/lib/config/chain";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Fellow" }] }),
  component: SettingsPage,
});

const SLIPPAGE_PRESETS = [0.1, 0.5, 1.0];

function SettingsPage() {
  const { authenticated, user, login, logout } = usePrivy();
  const defaultSlippage = useSettingsStore((s) => s.defaultSlippage);
  const setDefaultSlippage = useSettingsStore((s) => s.setDefaultSlippage);

  const address =
    user?.wallet?.address ?? user?.linkedAccounts?.find((a) => a.type === "wallet")?.address ?? "";

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 font-mono md:p-6">
      <div className="flex flex-col gap-1">
        <p className="text-[10px] uppercase tracking-widest text-primary">
          <span className="text-muted-foreground">fellow@robinhood-chain</span>:~/settings $
        </p>
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
      </div>

      <div className="border border-border bg-card p-6">
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
                  ? "bg-primary text-black"
                  : "border border-border hover:border-primary"
              }`}
            >
              {v}%
            </button>
          ))}

          <input
            value={defaultSlippage}
            onChange={(e) => setDefaultSlippage(Number(e.target.value))}
            inputMode="decimal"
            className="w-24 border border-border bg-transparent px-3 py-2 text-sm outline-none"
          />
          <span className="text-sm text-muted-foreground">%</span>
        </div>
      </div>

      <div className="border border-border bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Wallet
        </h2>

        {authenticated ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground">Connected</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{address}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="border border-border px-4 py-2 text-sm font-medium transition hover:border-primary"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">No wallet connected.</p>
            <button
              type="button"
              onClick={login}
              className="bg-primary px-4 py-2 text-sm font-semibold text-black"
            >
              Connect Wallet
            </button>
          </div>
        )}
      </div>

      <div className="border border-border bg-card p-6">
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
