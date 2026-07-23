import { Home, BarChart3, Wallet, Droplets, ArrowLeftRight, Settings, Bot } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";

import { useBlockNumber } from "@/hooks/useBlockNumber";
import { useGasPrice } from "@/hooks/useGasPrice";
import { useChainStatus } from "@/hooks/useChainStatus";

const items = [
  { label: "Dashboard", to: "/", icon: Home },
  { label: "Markets", to: "/markets", icon: BarChart3 },
  { label: "Swap", to: "/swap", icon: ArrowLeftRight },
  { label: "Liquidity", to: "/liquidity", icon: Droplets },
  { label: "Portfolio", to: "/portfolio", icon: Wallet },
  { label: "AI Assistant", to: "/assistant", icon: Bot },
  { label: "Settings", to: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const blockNumber = useBlockNumber();
  const gas = useGasPrice();
  const online = useChainStatus();

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-background font-mono md:flex">
      <div className="px-3 pb-2 pt-5">
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          <span className="text-primary">▍</span> Workspace
        </p>
      </div>

      <nav className="flex flex-col gap-0.5 px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));

          return (
            <Link
              key={item.label}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2 text-xs font-medium transition-colors ${
                active
                  ? "border-l-2 border-primary bg-[#101216] text-foreground"
                  : "border-l-2 border-transparent text-muted-foreground hover:bg-[#101216] hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
              {active && <span className="ml-auto text-primary">▸</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-border p-3">
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Network
        </p>

        <div className="mt-3 space-y-2 text-[11px]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">chain</span>
            <span>Robinhood</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">block</span>
            <span className="tabular-nums">{blockNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">gas</span>
            <span className="tabular-nums">{gas} gwei</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">status</span>
            <span className={online ? "text-primary" : "text-red-400"}>
              ● {online ? "online" : "offline"}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
