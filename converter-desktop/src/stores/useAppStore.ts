import { create } from "zustand";
import { AppPage } from "@/types/navigation";

interface AppState {
  currentPage: AppPage;
  selectedToolId: string | null;
  theme: "light" | "dark" | "system";
  defaultOutputPath: string;
  navigateTo: (page: AppPage, toolId?: string | null) => void;
  openWorkspace: (toolId: string) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  setDefaultOutputPath: (path: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: "dashboard",
  selectedToolId: null,
  theme: "system",
  defaultOutputPath: "Downloads/Converted",

  navigateTo: (page, toolId = null) =>
    set({
      currentPage: page,
      selectedToolId: toolId,
    }),

  openWorkspace: (toolId) =>
    set({
      currentPage: "workspace",
      selectedToolId: toolId,
    }),

  setTheme: (theme) => set({ theme }),
  setDefaultOutputPath: (path) => set({ defaultOutputPath: path }),
}));
