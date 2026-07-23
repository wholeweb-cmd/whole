import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";

import { WalletButton } from "./WalletButton";

export function Header() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  function submit() {
    // The markets page reads no query param yet, so just take the user there;
    // its own search box filters. Kept simple and functional.
    navigate({ to: "/markets" });
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4 font-mono md:px-6">
      <div className="flex items-center gap-2">
        <div className="grid h-7 w-7 place-items-center bg-primary">
          <span className="text-[13px] font-bold text-primary-foreground">F</span>
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-foreground">fellow</span>
        <span className="ml-2 hidden text-[10px] font-medium uppercase tracking-widest text-primary md:inline">
          ▍ terminal
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 border border-border bg-card px-3 py-1.5 focus-within:border-primary/60 md:flex md:w-72">
          <span className="text-primary">$</span>
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder="search markets…"
            className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <WalletButton />
      </div>
    </header>
  );
}
