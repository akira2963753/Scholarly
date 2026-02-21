"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Paper } from "@/types/paper";
import { MOCK_PAPERS } from "@/mock/data";

interface LibraryStore {
  papers: Paper[];
  addPaper: (paper: Paper) => void;
  removePaper: (id: string) => void;
  updatePaper: (id: string, updates: Partial<Paper>) => void;
}

export const useLibraryStore = create<LibraryStore>()(
  persist(
    (set) => ({
      papers: MOCK_PAPERS,

      addPaper: (paper) =>
        set((state) => ({ papers: [paper, ...state.papers] })),

      removePaper: (id) =>
        set((state) => ({ papers: state.papers.filter((p) => p.id !== id) })),

      updatePaper: (id, updates) =>
        set((state) => ({
          papers: state.papers.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        })),
    }),
    { name: "scholarly-library" }
  )
);
