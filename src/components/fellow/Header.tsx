import { Search, Bell, Wallet } from "lucide-react";

export function Header() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4 md:px-6">
      <div className="flex items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded-sm bg-primary">
          <span className="text-[13px] font-bold text-primary-foreground">F</span>
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-foreground">Fellow</span>
        <span className="ml-2 hidden text-[10px] font-medium uppercase tracking-widest text-muted-foreground md:inline">
          Terminal
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 rounded-sm border border-border bg-card px-3 py-1.5 md:flex md:w-80">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            placeholder="Search markets, pools, tx..."
            className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="rounded-sm border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">⌘K</kbd>
        </div>
        <button className="relative grid h-8 w-8 place-items-center rounded-sm border border-border text-muted-foreground hover:text-foreground">
          <Bell className="h-3.5 w-3.5" />
          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-primary" />
        </button>
        <div className="hidden items-center gap-2 rounded-sm border border-border bg-card px-3 py-1.5 sm:flex">
          <Wallet className="h-3.5 w-3.5 text-primary" />
          <span className="font-mono text-xs font-medium text-foreground">0x7a3f...b21e</span>
        </div>
      </div>
    </header>
  );
}