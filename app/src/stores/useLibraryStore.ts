"use client";

import { create } from "zustand";

// Frontend-serialized types (dates are strings after JSON serialization from the API)
export interface FolderData {
  id: string;
  userId?: string;
  name: string;
  createdAt: string;
}

export interface PaperData {
  id: string;
  userId?: string;
  folderId?: string | null;
  title: string;
  author: string;
  school: string | null;
  year: number;
  venue: string;
  starred?: boolean;
  filePath: string;
  createdAt: string;
  updatedAt: string;
}

interface LibraryStore {
  papers: PaperData[];
  folders: FolderData[];
  loading: boolean;

  fetchAll: () => Promise<void>;

  addPaper: (paper: PaperData) => void;
  removePaper: (id: string) => Promise<void>;
  updatePaper: (id: string, updates: Partial<PaperData>) => Promise<void>;

  addFolder: (folder: FolderData) => void;
  removeFolder: (id: string) => Promise<void>;
  updateFolder: (id: string, updates: Partial<FolderData>) => Promise<void>;
}

export const useLibraryStore = create<LibraryStore>((set, _get) => ({
  papers: [],
  folders: [],
  loading: false,

  fetchAll: async () => {
    set({ loading: true });
    try {
      const [papersRes, foldersRes] = await Promise.all([
        fetch("/api/papers"),
        fetch("/api/folders"),
      ]);
      const [papers, folders] = await Promise.all([papersRes.json(), foldersRes.json()]);
      set({ papers: Array.isArray(papers) ? papers : [], folders: Array.isArray(folders) ? folders : [] });
    } finally {
      set({ loading: false });
    }
  },

  addPaper: (paper) => set((s) => ({ papers: [paper, ...s.papers] })),

  removePaper: async (id) => {
    await fetch(`/api/papers/${id}`, { method: "DELETE" });
    set((s) => ({ papers: s.papers.filter((p) => p.id !== id) }));
  },

  updatePaper: async (id, updates) => {
    const res = await fetch(`/api/papers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const updated: PaperData = await res.json();
      set((s) => ({ papers: s.papers.map((p) => (p.id === id ? updated : p)) }));
    }
  },

  addFolder: (folder) => set((s) => ({ folders: [...s.folders, folder] })),

  removeFolder: async (id) => {
    await fetch(`/api/folders/${id}`, { method: "DELETE" });
    set((s) => ({
      folders: s.folders.filter((f) => f.id !== id),
      papers: s.papers.map((p) => (p.folderId === id ? { ...p, folderId: null } : p)),
    }));
  },

  updateFolder: async (id, updates) => {
    const res = await fetch(`/api/folders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const updated: FolderData = await res.json();
      set((s) => ({ folders: s.folders.map((f) => (f.id === id ? updated : f)) }));
    }
  },
}));
