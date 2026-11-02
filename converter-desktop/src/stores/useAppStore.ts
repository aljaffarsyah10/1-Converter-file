import { create } from "zustand";

interface AppState {
  currentTool: string | null;
  setCurrentTool: (tool: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentTool: null,
  setCurrentTool: (tool) => set({ currentTool: tool }),
}));

