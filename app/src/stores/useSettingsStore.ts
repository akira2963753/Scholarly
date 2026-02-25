import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark";

interface SettingsStore {
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      geminiApiKey: "",
      setGeminiApiKey: (key) => set({ geminiApiKey: key }),
      theme: "light",
      setTheme: (theme) => set({ theme }),
    }),
    { name: "scholarly-settings" }
  )
);
