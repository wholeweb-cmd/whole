import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { TokenIcon } from "@/components/markets/TokenIcon";
import { useSwapBalance } from "@/hooks/useSwapBalance";
import type { SwapToken } from "@/lib/uniswap/route";

interface Props {
  tokens: SwapToken[];
  onSelect(token: SwapToken): void;
}

function fmtPrice(v: number | null) {
  if (v == null) return "";
  if (v >= 1) return `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  return `$${v.toPrecision(3)}`;
}

function TokenRow({ token, onSelect }: { token: SwapToken; onSelect(t: SwapToken): void }) {
  const balance = useSwapBalance(token);

  return (
    <button
      onClick={() => onSelect(token)}
      className="flex w-full items-center justify-between px-3 py-2.5 font-mono transition hover:bg-primary/5"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <TokenIcon symbol={token.symbol} logo={token.logo} size={26} />
        <div className="min-w-0 text-left">
          <div className="truncate text-sm font-medium">{token.symbol}</div>
          <div className="truncate text-[10px] text-muted-foreground">{token.name}</div>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-xs tabular-nums">{balance > 0 ? balance.toFixed(4) : "—"}</div>
        <div className="text-[10px] tabular-nums text-muted-foreground">{fmtPrice(token.price)}</div>
      </div>
    </button>
  );
}

export function TokenSelector({ tokens, onSelect }: Props) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return tokens.slice(0, 80);

    const isAddr = query.startsWith("0x");
    const matches = tokens.filter((t) =>
      isAddr
        ? t.address.toLowerCase().includes(query)
        : t.symbol.toLowerCase().includes(query) || t.name.toLowerCase().includes(query),
    );
    return matches.slice(0, 80);
  }, [q, tokens]);

  return (
    <div className="border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2 focus-within:border-primary/60">
        <span className="font-mono text-primary">$</span>
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
          placeholder="symbol, name, or 0x contract address…"
          className="flex-1 bg-transparent font-mono text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="max-h-72 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="px-3 py-6 text-center font-mono text-xs text-muted-foreground">
            {q.startsWith("0x")
              ? "No pooled token at that address."
              : "No tokens match your search."}
          </p>
        ) : (
          filtered.map((token) => (
            <TokenRow key={token.isNative ? "eth" : token.address} token={token} onSelect={onSelect} />
          ))
        )}
      </div>
    </div>
  );
}
