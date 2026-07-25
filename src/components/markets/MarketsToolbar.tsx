import { Search } from "lucide-react";

export type MarketFilter = "all" | "watchlist" | "gainers" | "losers";

interface Props {
  search: string;
  onSearch(value: string): void;
  filter: MarketFilter;
  onFilter(value: MarketFilter): void;
  count: number;
}

// Every filter here is backed by data the markets feed actually carries, so
// each one changes the table. (The previous "DeFi / AI / Meme" chips were
// decorative - there is no sector taxonomy behind them.)
const FILTERS: { value: MarketFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "watchlist", label: "★ Watchlist" },
  { value: "gainers", label: "Gainers" },
  { value: "losers", label: "Losers" },
];

export function MarketsToolbar({ search, onSearch, filter, onFilter, count }: Props) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="surface-tile flex h-11 w-full max-w-md items-center rounded-full border border-border bg-card px-4 font-mono transition-colors focus-within:border-primary/60">
        <span className="mr-2 select-none text-primary">$</span>
        <Search className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="grep token / symbol / address"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearch("")}
            aria-label="Clear search"
            className="ml-2 text-muted-foreground transition hover:text-foreground"
          >
            ✕
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <span className="mr-1 font-mono text-[11px] tabular-nums text-muted-foreground">
          {count} {count === 1 ? "market" : "markets"}
        </span>

        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={filter === f.value}
            onClick={() => onFilter(f.value)}
            className={`rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-wider transition ${
              filter === f.value
                ? "border-primary/50 bg-primary/10 text-primary"
                : "surface-tile border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
