import { create } from "zustand";

export type ActivityType = "Swap" | "Add Liquidity" | "Remove Liquidity" | "Claim Fees";
export type ActivityStatus = "pending" | "success" | "error";

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  detail: string;
  hash?: `0x${string}`;
  status: ActivityStatus;
  timestamp: number;
}

interface ActivityStore {
  entries: ActivityEntry[];
  add: (entry: Omit<ActivityEntry, "id" | "timestamp">) => string;
  update: (id: string, patch: Partial<ActivityEntry>) => void;
}

/**
 * Lightweight in-memory log of the connected wallet's actions taken in
 * this session (swaps, liquidity changes). Not a substitute for a real
 * indexer/subgraph - it only knows about transactions submitted through
 * this app while it's open.
 */
export const useActivityStore = create<ActivityStore>((set) => ({
  entries: [],

  add: (entry) => {
    const id = crypto.randomUUID();

    set((state) => ({
      entries: [{ ...entry, id, timestamp: Date.now() }, ...state.entries].slice(0, 20),
    }));

    return id;
  },

  update: (id, patch) => {
    set((state) => ({
      entries: state.entries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    }));
  },
}));
