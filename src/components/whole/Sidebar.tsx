import { Home, BarChart3, Wallet, Droplets, ArrowLeftRight, Settings, Bot } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";

const items = [
  { label: "Dashboard", to: "/", icon: Home },
  { label: "Markets", to: "/markets", icon: BarChart3 },
  { label: "Swap", to: "/swap", icon: ArrowLeftRight },
  { label: "Liquidity", to: "/liquidity", icon: Droplets },
  { label: "Wallet", to: "/wallet", icon: Wallet },
  { label: "My Agent", to: "/assistant", icon: Bot },
  { label: "Settings", to: "/settings", icon: Settings },
];

export function Sidebar({ onNavigate }: { onNavigate: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside
      id="workspace-navigation"
      aria-label="Main navigation"
      className="surface-panel fixed bottom-0 left-0 top-16 z-50 flex w-64 flex-col border-r border-border bg-background font-mono shadow-2xl shadow-black/40"
    >
      <div className="px-4 pb-3 pt-6">
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          <span className="text-primary">▍</span> Workspace
        </p>
      </div>

      <nav className="flex flex-col gap-1 px-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));

          return (
            <Link
              key={item.label}
              to={item.to}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-xs font-medium transition-all ${
                active
                  ? "surface-tile border border-primary/30 bg-primary/10 text-foreground"
                  : "border border-transparent text-muted-foreground hover:bg-surface-raised hover:text-foreground"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
              <span>{item.label}</span>
              {active && <span className="ml-auto text-primary">▸</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
