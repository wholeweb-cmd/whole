import { Home, BarChart3, Wallet, Activity, Settings } from "lucide-react";
import { useState } from "react";

const items = [
  { label: "Home", icon: Home },
  { label: "Markets", icon: BarChart3 },
  { label: "Portfolio", icon: Wallet },
  { label: "Activity", icon: Activity },
  { label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [active, setActive] = useState("Home");
  return (
    <aside className="hidden w-52 shrink-0 flex-col border-r border-border bg-background md:flex">
      <div className="px-4 pt-6 pb-3">
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Workspace</p>
      </div>
      <nav className="flex flex-col gap-0.5 px-2">
        {items.map((it) => {
          const Icon = it.icon;
          const isActive = active === it.label;
          return (
            <button
              key={it.label}
              onClick={() => setActive(it.label)}
              className={`flex items-center gap-3 rounded-sm px-3 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-[#101216] text-foreground"
                  : "text-muted-foreground hover:bg-[#101216] hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={2} />
              <span>{it.label}</span>
              {isActive && <span className="ml-auto h-1 w-1 rounded-full bg-primary" />}
            </button>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-border p-4">
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Network</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs font-medium text-foreground">Robinhood Chain</span>
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">Block 18,204,331</p>
      </div>
    </aside>
  );
}