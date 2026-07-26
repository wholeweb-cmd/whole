import { useEffect, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";

import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { ContextPanel } from "./ContextPanel";

/**
 * The persistent workspace shell wrapped around every route: top bar, left
 * nav, right context rail. Individual pages only render their own content
 * into the scrolling main area.
 */
export function WorkspaceLayout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    if (!menuOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <Header menuOpen={menuOpen} onMenuClick={() => setMenuOpen((open) => !open)} />
      <div className="flex min-h-0 flex-1">
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div key={pathname} className="route-enter min-h-full">
            {children}
          </div>
        </main>
        <ContextPanel />
      </div>

      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMenuOpen(false)}
            className="motion-overlay fixed inset-x-0 bottom-0 top-16 z-40 cursor-default bg-black/60 backdrop-blur-[2px]"
          />
          <Sidebar onNavigate={() => setMenuOpen(false)} />
        </>
      )}
    </div>
  );
}
