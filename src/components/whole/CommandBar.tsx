import { useState } from "react";
import { Command, CornerDownLeft, ArrowRight, Loader2 } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";

import { chat } from "@/functions/chat";
import type { Intent } from "@/lib/intent/types";
import { ActionCard } from "./ActionCard";

const suggestions = [
  "Swap 100 USDG to ETH",
  "Add liquidity 10 ETH and 100 USDG",
  "What's my portfolio worth?",
  "Claim my fees",
  "Open liquidity",
];

export function CommandBar() {
  const { user } = usePrivy();
  const address =
    user?.wallet?.address ?? user?.linkedAccounts?.find((a) => a.type === "wallet")?.address;

  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [intent, setIntent] = useState<Intent | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    const message = value.trim();
    if (!message || loading) return;

    setValue("");
    setLoading(true);

    try {
      const result = await chat({ data: { message, address } });
      setIntent(result);
    } catch (err) {
      console.error(err);
      setIntent({
        kind: "unknown",
        raw: message,
        reason: "Something went wrong reaching WHOLE. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl flex-col gap-2.5 px-5 py-4">
        {intent && <ActionCard intent={intent} onDismiss={() => setIntent(null)} />}

        {focused && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setValue(s);
                }}
                className="surface-tile glow-primary-hover flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-[11px] text-muted-foreground hover:border-primary/60 hover:text-foreground"
              >
                <ArrowRight className="h-3 w-3 text-primary" />
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="surface-panel flex items-center gap-3 rounded-xl border border-border px-5 py-3.5 transition-colors focus-within:border-primary/50">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <Command className="h-4 w-4 text-primary" />
          )}
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 120)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run();
            }}
            placeholder="Ask WHOLE..."
            disabled={loading}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-60"
          />
          <kbd className="hidden rounded-md border border-border px-2 py-1 font-mono text-[10px] text-muted-foreground sm:inline">
            ⌘K
          </kbd>
          <button
            type="button"
            disabled={!value || loading}
            onClick={run}
            className="glow-primary-hover flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-[11px] font-semibold text-primary-foreground disabled:opacity-40 disabled:shadow-none"
          >
            Run <CornerDownLeft className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
