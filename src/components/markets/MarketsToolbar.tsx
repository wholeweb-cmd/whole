import { Search } from "lucide-react";

interface Props {
  search: string;
  onSearch(value: string): void;
}

const filters = ["All", "DeFi", "AI", "Meme"];

export function MarketsToolbar({ search, onSearch }: Props) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex h-10 w-full max-w-md items-center border border-border bg-card px-3 font-mono focus-within:border-primary/60">
        <span className="mr-2 select-none text-primary">$</span>
        <Search className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="grep token / symbol / address"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex items-center gap-1.5">
        {filters.map((f, i) => (
          <button
            key={f}
            className={`border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition ${
              i === 0
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>
    </div>
  );
}
