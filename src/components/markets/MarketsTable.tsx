import { memo, useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { TokenIcon } from "./TokenIcon";
import type { MarketData } from "@/lib/uniswap/market";

type SortKey = "volume24h" | "tvl" | "price" | "change24h";

interface Props {
  markets: MarketData[];
  isLoading: boolean;
  isError: boolean;
  search: string;
  toggle(symbol: string): void;
  isFavorite(symbol: string): boolean;
}

// The discovered universe runs to several hundred tokens. Rendering them all
// on first paint costs a visible stall (each row mounts an image), so the list
// grows on demand instead.
const PAGE_SIZE = 60;

function formatUSD(value: number | null) {
  if (value == null) return "—";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function formatPrice(value: number | null) {
  if (value == null) return "—";
  if (value >= 1) return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  return `$${value.toPrecision(3)}`;
}

function formatChange(value: number | null) {
  if (value == null) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

const MarketRow = memo(function MarketRow({
  market,
  favorite,
  onToggle,
}: {
  market: MarketData;
  favorite: boolean;
  onToggle(symbol: string): void;
}) {
  const change = market.change24h;

  return (
    <tr className="group border-b border-border/60 transition hover:bg-primary/5">
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onToggle(market.symbol)}
            aria-label={
              favorite
                ? `Remove ${market.symbol} from watchlist`
                : `Add ${market.symbol} to watchlist`
            }
          >
            <Star
              className={`h-3.5 w-3.5 transition ${
                favorite
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground/40 hover:text-yellow-400"
              }`}
            />
          </button>

          <TokenIcon symbol={market.symbol} name={market.name} logo={market.logo} size={28} />

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
                  className="rounded-full border border-yellow-500/40 bg-yellow-500/10 px-1.5 py-px text-[8px] font-medium uppercase tracking-wide text-yellow-500"
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

      <td
        className={`px-4 py-2.5 text-right tabular-nums ${
          change == null ? "text-muted-foreground" : change >= 0 ? "text-primary" : "text-red-400"
        }`}
      >
        {formatChange(change)}
      </td>

      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
        {formatUSD(market.volume24h)}
      </td>

      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
        {formatUSD(market.tvl)}
      </td>
    </tr>
  );
});

export function MarketsTable({ markets, isLoading, isError, search, toggle, isFavorite }: Props) {
  const [sortBy, setSortBy] = useState<SortKey>("volume24h");
  const [limit, setLimit] = useState(PAGE_SIZE);

  // A new query/filter should start back at the top of the list.
  useEffect(() => {
    setLimit(PAGE_SIZE);
  }, [search, sortBy, markets.length]);

  const sorted = useMemo(() => {
    const rows = [...markets];

    rows.sort((a, b) => {
      const favA = isFavorite(a.symbol);
      const favB = isFavorite(b.symbol);
      if (favA !== favB) return favA ? -1 : 1;

      if (sortBy === "tvl") return (b.tvl ?? 0) - (a.tvl ?? 0);
      if (sortBy === "price") return (b.price ?? 0) - (a.price ?? 0);
      if (sortBy === "change24h") return (b.change24h ?? 0) - (a.change24h ?? 0);
      return (b.volume24h ?? 0) - (a.volume24h ?? 0);
    });

    return rows;
  }, [markets, sortBy, isFavorite]);

  const visible = sorted.slice(0, limit);

  const sortButton = (key: SortKey, label: string) => (
    <button
      type="button"
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
    <div className="surface-panel flex-1 overflow-auto rounded-xl border border-border">
      <table className="w-full border-collapse font-mono">
        <thead className="surface-head sticky top-0 z-10 bg-surface-raised">
          <tr className="border-b border-border text-left text-[10px] uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-3 font-medium">Token</th>
            <th className="px-4 py-3 text-right font-medium">
              <div className="flex justify-end">{sortButton("price", "Price")}</div>
            </th>
            <th className="px-4 py-3 text-right font-medium">
              <div className="flex justify-end">{sortButton("change24h", "24h")}</div>
            </th>
            <th className="px-4 py-3 text-right font-medium">
              <div className="flex justify-end">{sortButton("volume24h", "Vol 24h")}</div>
            </th>
            <th className="px-4 py-3 text-right font-medium">
              <div className="flex justify-end">{sortButton("tvl", "Liquidity")}</div>
            </th>
          </tr>
        </thead>

        <tbody>
          {isLoading && markets.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-xs text-muted-foreground">
                <span className="text-primary">▸</span> scanning on-chain pools…
              </td>
            </tr>
          )}

          {isError && markets.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-xs text-red-400">
                Couldn't load markets. Retrying…
              </td>
            </tr>
          )}

          {!isLoading && !isError && sorted.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-xs text-muted-foreground">
                {search ? `No markets match "${search}".` : "No markets match this filter."}
              </td>
            </tr>
          )}

          {visible.map((market) => (
            <MarketRow
              key={`${market.address}:${market.poolAddress ?? ""}`}
              market={market}
              favorite={isFavorite(market.symbol)}
              onToggle={toggle}
            />
          ))}
        </tbody>
      </table>

      {sorted.length > visible.length && (
        <button
          type="button"
          onClick={() => setLimit((n) => n + PAGE_SIZE)}
          className="w-full rounded-b-xl border-t border-border py-3.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition hover:bg-primary/5 hover:text-primary"
        >
          Load {Math.min(PAGE_SIZE, sorted.length - visible.length)} more · {visible.length}/
          {sorted.length}
        </button>
      )}
    </div>
  );
}
