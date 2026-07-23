import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";

import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { ContextPanel } from "./ContextPanel";
import { CommandBar } from "./CommandBar";

/**
 * The persistent terminal shell wrapped around every route: top bar, left
 * nav, right context rail, and the always-available "Ask Fellow" command bar.
 * Individual pages only render their own content into the scrolling main area.
 */
export function WorkspaceLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // The assistant route has its own full-height chat input, so the floating
  // command bar would be redundant there.
  const showCommandBar = pathname !== "/assistant";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <Header />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className={`min-w-0 flex-1 overflow-y-auto ${showCommandBar ? "pb-28" : ""}`}>
          {children}
        </main>
        <ContextPanel />
      </div>
      {showCommandBar && <CommandBar />}
    </div>
  );
}
