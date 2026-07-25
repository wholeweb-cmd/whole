import { useEffect, useMemo, useState } from "react";
import { Outlet, useRouterState, useSearch } from "@tanstack/react-router";

import { MarketsToolbar, type MarketFilter } from "./MarketsToolbar";
import { MarketsTable } from "./MarketsTable";
import { useMarkets } from "@/hooks/useMarkets";
import { useWatchlist } from "@/hooks/useWatchlist";

export function MarketsPage() {
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });

  const isDetail = pathname !== "/markets";

  if (isDetail) {
    return <Outlet />;
  }

  return <MarketsIndex />;
}

/**
 * Split out so the markets list's data hooks don't mount (and poll) while a
 * token detail page is showing.
 */
function MarketsIndex() {
  const { q } = useSearch({ from: "/markets" });

  const [search, setSearch] = useState(q ?? "");
  const [filter, setFilter] = useState<MarketFilter>("all");

  // Keep the box in sync when the URL changes under it (header search,
  // back/forward, a shared link).
  useEffect(() => {
    setSearch(q ?? "");
  }, [q]);

  const { data: markets, isLoading, isError } = useMarkets();
  const { favorites, toggle, isFavorite } = useWatchlist();

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return (markets ?? []).filter((market) => {
      if (filter === "watchlist" && !favorites.has(market.symbol)) return false;
      if (filter === "gainers" && !((market.change24h ?? 0) > 0)) return false;
      if (filter === "losers" && !((market.change24h ?? 0) < 0)) return false;

      if (!needle) return true;

      return (
        market.symbol.toLowerCase().includes(needle) ||
        market.name.toLowerCase().includes(needle) ||
        market.pair.toLowerCase().includes(needle) ||
        market.address.toLowerCase().includes(needle)
      );
    });
  }, [markets, search, filter, favorites]);

  return (
    <div className="flex h-full flex-col p-5 md:p-7">
      <div className="mb-5">
        <h1 className="mt-1 font-mono text-2xl font-bold tracking-tight">Markets</h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          Live token universe discovered on-chain via Uniswap pools + chain indexer.
        </p>
      </div>

      <MarketsToolbar
        search={search}
        onSearch={setSearch}
        filter={filter}
        onFilter={setFilter}
        count={visible.length}
      />

      <MarketsTable
        markets={visible}
        isLoading={isLoading}
        isError={isError}
        search={search}
        toggle={toggle}
        isFavorite={isFavorite}
      />
    </div>
  );
}
