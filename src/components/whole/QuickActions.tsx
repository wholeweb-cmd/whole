import { ArrowLeftRight, BarChart3, Bot, Droplets, Settings, Wallet } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { Card } from "./Card";

// Mirrors the workspace nav in Sidebar.tsx - the dashboard is the way in for
// anyone who hasn't found the rail yet.
const actions = [
  {
    to: "/markets",
    icon: BarChart3,
    title: "Markets",
    description: "Browse all available markets",
  },
  {
    to: "/swap",
    icon: ArrowLeftRight,
    title: "Swap",
    description: "Exchange tokens instantly",
  },
  {
    to: "/liquidity",
    icon: Droplets,
    title: "Liquidity",
    description: "Manage liquidity pools",
  },
  {
    to: "/wallet",
    icon: Wallet,
    title: "Wallet",
    description: "View your assets",
  },
  {
    to: "/assistant",
    icon: Bot,
    title: "My Agent",
    description: "Ask your on-chain agent",
  },
  {
    to: "/settings",
    icon: Settings,
    title: "Settings",
    description: "Configure workspace",
  },
] as const;

export function QuickActions() {
  return (
    <Card title="Quick Actions">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.to}
              to={action.to}
              className="surface-tile glow-primary-hover group flex items-center gap-3.5 rounded-lg border border-border bg-background/40 p-4 hover:border-primary/60 hover:bg-primary/5"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-surface-raised text-muted-foreground transition group-hover:border-primary/60 group-hover:bg-primary/10 group-hover:text-primary">
                <Icon className="h-3.5 w-3.5" />
              </span>

              <span className="flex min-w-0 flex-col">
                <span className="font-mono text-xs font-medium text-foreground transition group-hover:text-primary">
                  {action.title}
                </span>
                <span className="text-[10px] leading-relaxed text-muted-foreground">
                  {action.description}
                </span>
              </span>

              <span className="ml-auto shrink-0 font-mono text-primary opacity-0 transition group-hover:opacity-100">
                ▸
              </span>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
