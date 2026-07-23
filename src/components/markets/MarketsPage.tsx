import { useState } from "react";
import { Outlet, useRouterState } from "@tanstack/react-router";

import { MarketsToolbar } from "./MarketsToolbar";
import { MarketsTable } from "./MarketsTable";

export function MarketsPage() {
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });

  const [search, setSearch] = useState("");

  const isDetail = pathname !== "/markets";

  if (isDetail) {
    return <Outlet />;
  }

  return (
    <div className="flex h-full flex-col p-4 md:p-6">
      <div className="mb-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
          <span className="text-muted-foreground">fellow@robinhood-chain</span>:~/markets $
        </p>
        <h1 className="mt-1 font-mono text-2xl font-bold tracking-tight">Markets</h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          Live token universe discovered on-chain via Uniswap pools + chain indexer.
        </p>
      </div>

      <MarketsToolbar search={search} onSearch={setSearch} />

      <MarketsTable search={search} />
    </div>
  );
}
