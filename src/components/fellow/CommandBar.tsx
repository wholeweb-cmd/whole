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
        reason: "Something went wrong reaching Fellow. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3">
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
                className="flex items-center gap-2 rounded-sm border border-border bg-card px-2.5 py-1.5 text-[11px] text-muted-foreground hover:border-primary hover:text-foreground"
              >
                <ArrowRight className="h-3 w-3 text-primary" />
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3 border border-border bg-card px-4 py-3">
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
            placeholder="Ask Fellow..."
            disabled={loading}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-60"
          />
          <kbd className="hidden rounded-sm border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
            ⌘K
          </kbd>
          <button
            type="button"
            disabled={!value || loading}
            onClick={run}
            className="flex items-center gap-1.5 rounded-sm bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground disabled:opacity-40"
          >
            Run <CornerDownLeft className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
