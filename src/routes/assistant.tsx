import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { usePrivy } from "@privy-io/react-auth";
import { CornerDownLeft, Loader2, Bot, User } from "lucide-react";

import { chat } from "@/functions/chat";
import type { Intent } from "@/lib/intent/types";
import { ActionCard } from "@/components/fellow/ActionCard";

export const Route = createFileRoute("/assistant")({
  head: () => ({ meta: [{ title: "AI Assistant — Fellow" }] }),
  component: AssistantPage,
});

interface Message {
  id: number;
  role: "user" | "assistant";
  text: string;
  intent?: Intent;
}

const SUGGESTIONS = [
  "What's my portfolio worth?",
  "Swap 100 USDG to ETH",
  "Add liquidity 10 WETH and 100 USDG",
  "Show me the best markets today",
  "Claim my fees",
];

/** The assistant's spoken line for an intent - the ActionCard renders the executable part. */
function intentText(intent: Intent): string {
  switch (intent.kind) {
    case "answer":
      return intent.reply;
    case "unknown":
      return intent.reason;
    case "swap":
      return `Here's a swap of ${intent.amount} ${intent.fromToken} → ${intent.toToken}. Review and confirm below.`;
    case "add_liquidity":
      return `Ready to add liquidity to ${intent.tokenA}/${intent.tokenB}. Confirm the amounts below.`;
    case "remove_liquidity":
      return "Let's remove that liquidity — details below.";
    case "claim_fees":
      return "Let's claim those fees — details below.";
    case "navigate":
      return `Opening ${intent.label}.`;
  }
}

function actionable(intent: Intent): boolean {
  return intent.kind !== "answer" && intent.kind !== "unknown";
}

function AssistantPage() {
  const { user } = usePrivy();
  const address =
    user?.wallet?.address ?? user?.linkedAccounts?.find((a) => a.type === "wallet")?.address;

  const [messages, setMessages] = useState<Message[]>([]);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const nextId = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || loading) return;

    setValue("");
    setMessages((prev) => [...prev, { id: nextId.current++, role: "user", text: message }]);
    setLoading(true);

    try {
      const intent = await chat({ data: { message, address } });
      setMessages((prev) => [
        ...prev,
        { id: nextId.current++, role: "assistant", text: intentText(intent), intent },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId.current++,
          role: "assistant",
          text: "Something went wrong reaching Fellow. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function dismissAction(id: number) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, intent: undefined } : m)));
  }

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col p-4 md:p-6">
      <div className="mb-4 flex flex-col gap-1">
        <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
          <span className="text-muted-foreground">fellow@robinhood-chain</span>:~/assistant $
        </p>
        <h1 className="font-mono text-xl font-semibold tracking-tight">AI Assistant</h1>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto border border-border bg-card"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center">
            <div className="grid h-12 w-12 place-items-center border border-primary/40 bg-primary/10">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-mono text-sm text-foreground">Ask Fellow anything</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                Natural-language trading, liquidity, and portfolio — every action confirmed before it
                signs.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="border border-border bg-background px-3 py-1.5 font-mono text-[11px] text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-4">
            {messages.map((m) => (
              <div key={m.id} className="flex gap-3">
                <div
                  className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center border ${
                    m.role === "user"
                      ? "border-border bg-background text-muted-foreground"
                      : "border-primary/40 bg-primary/10 text-primary"
                  }`}
                >
                  {m.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {m.role === "user" ? "You" : "Fellow"}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground">
                    {m.text}
                  </p>
                  {m.intent && actionable(m.intent) && (
                    <div className="mt-3">
                      <ActionCard intent={m.intent} onDismiss={() => dismissAction(m.id)} />
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
                <div className="grid h-7 w-7 shrink-0 place-items-center border border-primary/40 bg-primary/10">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                </div>
                Fellow is thinking…
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 border border-border bg-card px-3 py-2 focus-within:border-primary/60">
        <span className="select-none font-mono text-primary">$</span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send(value);
          }}
          placeholder="Ask Fellow…"
          disabled={loading}
          className="flex-1 bg-transparent font-mono text-sm outline-none placeholder:text-muted-foreground disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => send(value)}
          disabled={!value || loading}
          className="flex items-center gap-1.5 bg-primary px-3 py-1 font-mono text-[11px] font-semibold uppercase text-black transition hover:opacity-90 disabled:opacity-40"
        >
          Send <CornerDownLeft className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
