import { create } from "zustand";

interface AppState {
  connected: boolean;
  address: string;
  chainId: number | null;

  setConnected: (v: boolean) => void;
  setAddress: (v: string) => void;
  setChainId: (v: number | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  connected: false,
  address: "",
  chainId: null,

  setConnected: (connected) => set({ connected }),
  setAddress: (address) => set({ address }),
  setChainId: (chainId) => set({ chainId }),
}));
