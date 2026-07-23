import { useMemo, useState } from "react";
import { Star } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { TokenIcon } from "./TokenIcon";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useMarkets } from "@/hooks/useMarkets";

interface Props {
  search: string;
}

function formatUSD(value: number | null) {
  if (value == null) return "—";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function formatPrice(value: number | null) {
  if (value == null) return "—";
  if (value >= 1) return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  return `$${value.toPrecision(3)}`;
}

export function MarketsTable({ search }: Props) {
  const [sortBy, setSortBy] = useState<"volume24h" | "tvl" | "price">("volume24h");
  const { data: markets, isLoading } = useMarkets();

  const { toggle, isFavorite } = useWatchlist();

  const sortedMarkets = useMemo(() => {
    const q = search.toLowerCase();

    const filtered = (markets ?? []).filter((market) => {
      return (
        market.symbol.toLowerCase().includes(q) ||
        market.name.toLowerCase().includes(q) ||
        market.pair.toLowerCase().includes(q) ||
        market.address.toLowerCase().includes(q)
      );
    });

    return filtered.sort((a, b) => {
      const favA = isFavorite(a.symbol);
      const favB = isFavorite(b.symbol);
      if (favA !== favB) return favA ? -1 : 1;

      if (sortBy === "tvl") return (b.tvl ?? 0) - (a.tvl ?? 0);
      if (sortBy === "price") return (b.price ?? 0) - (a.price ?? 0);
      return (b.volume24h ?? 0) - (a.volume24h ?? 0);
    });
  }, [markets, search, sortBy, isFavorite]);

  const sortButton = (key: typeof sortBy, label: string) => (
    <button
      onClick={() => setSortBy(key)}
      className={`flex items-center gap-1 transition hover:text-foreground ${
        sortBy === key ? "text-primary" : ""
      }`}
    >
      {label}
      {sortBy === key && <span>▼</span>}
    </button>
  );

  return (
    <div className="flex-1 overflow-auto border border-border bg-card">
      <table className="w-full border-collapse font-mono">
        <thead className="sticky top-0 z-10 bg-[#0b0d11]">
          <tr className="border-b border-border text-left text-[10px] uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-3 font-medium">Token</th>
            <th className="px-4 py-3 text-right font-medium">{sortButton("price", "Price")}</th>
            <th className="px-4 py-3 text-right font-medium">
              <div className="flex justify-end">{sortButton("volume24h", "Vol 24h")}</div>
            </th>
            <th className="px-4 py-3 text-right font-medium">
              <div className="flex justify-end">{sortButton("tvl", "TVL")}</div>
            </th>
          </tr>
        </thead>

        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-xs text-muted-foreground">
                <span className="text-primary">▸</span> scanning on-chain pools…
              </td>
            </tr>
          )}

          {!isLoading && sortedMarkets.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-xs text-muted-foreground">
                No markets match "{search}".
              </td>
            </tr>
          )}

          {sortedMarkets.map((market) => (
            <tr
              key={market.address}
              className="group border-b border-border/60 transition hover:bg-primary/5"
            >
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => toggle(market.symbol)}>
                    <Star
                      className={`h-3.5 w-3.5 transition ${
                        isFavorite(market.symbol)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground/40 hover:text-yellow-400"
                      }`}
                    />
                  </button>

                  <TokenIcon symbol={market.symbol} logo={market.logo} size={28} />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        to="/markets/$symbol"
                        params={{ symbol: market.symbol }}
                        className="truncate font-semibold transition-colors group-hover:text-primary"
                      >
                        {market.symbol}
                      </Link>

                      {!market.verified && (
                        <span
                          title="Discovered on-chain, not curated — verify the contract before trading."
                          className="border border-yellow-500/40 px-1 py-px text-[8px] font-medium uppercase tracking-wide text-yellow-500"
                        >
                          Unverified
                        </span>
                      )}
                    </div>

                    <div className="truncate text-[10px] text-muted-foreground">{market.pair}</div>
                  </div>
                </div>
              </td>

              <td className="px-4 py-2.5 text-right tabular-nums">{formatPrice(market.price)}</td>
              <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                {formatUSD(market.volume24h)}
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                {formatUSD(market.tvl)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
