import { useEffect, useState } from "react";

const STORAGE_KEY = "fellow-watchlist";

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      setWatchlist(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  function toggle(symbol: string) {
    setWatchlist((current) =>
      current.includes(symbol) ? current.filter((s) => s !== symbol) : [...current, symbol],
    );
  }

  function isFavorite(symbol: string) {
    return watchlist.includes(symbol);
  }

  return {
    watchlist,
    toggle,
    isFavorite,
  };
}
