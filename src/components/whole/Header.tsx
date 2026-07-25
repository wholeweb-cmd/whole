import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Search } from "lucide-react";

import { WalletButton } from "./WalletButton";

interface HeaderProps {
  menuOpen: boolean;
  onMenuClick: () => void;
}

export function Header({ menuOpen, onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  function submit() {
    const q = query.trim();
    // Carry the query through to the markets page rather than dropping it -
    // the box used to navigate with nothing attached.
    navigate({ to: "/markets", search: q ? { q } : {} });
  }

  return (
    <header className="relative z-[60] flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-4 font-mono md:px-6">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-controls="workspace-navigation"
          aria-expanded={menuOpen}
          className={`glow-primary-hover grid h-10 w-10 place-items-center rounded-lg border transition-colors ${
            menuOpen
              ? "border-primary/50 bg-primary/10 text-primary"
              : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-primary"
          }`}
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link
          to="/"
          aria-label="WHOLE home"
          className="block h-11 w-11 shrink-0 overflow-hidden rounded-lg"
        >
          <img
            src="/brand/whole-logo-original.png"
            alt="WHOLE"
            width={44}
            height={44}
            className="h-full w-full object-contain"
          />
        </Link>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="surface-tile hidden items-center gap-2 rounded-full border border-border bg-card px-4 py-2 transition-colors focus-within:border-primary/60 md:flex md:w-72">
          <span className="text-primary">$</span>
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder="Search markets…"
            className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <WalletButton />
      </div>
    </header>
  );
}
