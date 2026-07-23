import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsStore {
  defaultSlippage: number;
  setDefaultSlippage: (value: number) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      defaultSlippage: 0.5,
      setDefaultSlippage: (value) =>
        set({ defaultSlippage: Number.isFinite(value) ? Math.min(Math.max(value, 0), 50) : 0.5 }),
    }),
    { name: "fellow-settings" },
  ),
);
