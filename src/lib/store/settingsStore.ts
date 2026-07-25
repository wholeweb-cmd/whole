import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsStore {
  defaultSlippage: number;
  setDefaultSlippage: (value: number) => void;
}

const SETTINGS_STORAGE_KEY = "whole-settings";
const LEGACY_SETTINGS_STORAGE_KEY = ["fl", "ow-settings"].join("");

if (typeof window !== "undefined") {
  try {
    const currentSettings = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    const legacySettings = window.localStorage.getItem(LEGACY_SETTINGS_STORAGE_KEY);
    if (!currentSettings && legacySettings) {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, legacySettings);
    }
    if (legacySettings) {
      window.localStorage.removeItem(LEGACY_SETTINGS_STORAGE_KEY);
    }
  } catch {
    // Storage can be unavailable in strict privacy modes; defaults still work.
  }
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      defaultSlippage: 0.5,
      setDefaultSlippage: (value) =>
        set({ defaultSlippage: Number.isFinite(value) ? Math.min(Math.max(value, 0), 50) : 0.5 }),
    }),
    { name: SETTINGS_STORAGE_KEY },
  ),
);
