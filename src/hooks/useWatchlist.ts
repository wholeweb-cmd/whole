import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "whole-watchlist";
const LEGACY_STORAGE_KEY = ["fl", "ow-watchlist"].join("");

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const saved =
      window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!saved) return [];
    const parsed: unknown = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
  } catch {
    // Corrupt or unreadable storage shouldn't take the markets page down.
    return [];
  }
}

export function useWatchlist() {
  // Starts empty so server and first client render agree, then hydrates from
  // storage. Writing is gated on that hydration - the previous version's save
  // effect fired on mount with the initial `[]` and wiped saved entries before
  // the load effect's state update landed.
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setWatchlist(read());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // Private mode / quota exceeded - the watchlist just won't persist.
    }
  }, [watchlist, hydrated]);

  const favorites = useMemo(() => new Set(watchlist), [watchlist]);

  const toggle = useCallback((symbol: string) => {
    setWatchlist((current) =>
      current.includes(symbol) ? current.filter((s) => s !== symbol) : [...current, symbol],
    );
  }, []);

  // Stable identity that only changes when the set does, so consumers can use
  // it as a memo dependency without recomputing the table on every render.
  const isFavorite = useCallback((symbol: string) => favorites.has(symbol), [favorites]);

  return { watchlist, favorites, toggle, isFavorite };
}
