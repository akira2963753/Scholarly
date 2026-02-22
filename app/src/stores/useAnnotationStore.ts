"use client";

import { create } from "zustand";
import type { PaperHighlight } from "@/types/highlight";
import type { PaperNote } from "@/types/note";

interface PaperAnnotations {
    highlights: PaperHighlight[];
    notes: PaperNote[];
}

export const EMPTY_HIGHLIGHTS: PaperHighlight[] = [];
export const EMPTY_NOTES: PaperNote[] = [];

interface AnnotationStore {
    byPaper: Record<string, PaperAnnotations>;
    loading: Record<string, boolean>;

    fetchAnnotations: (paperId: string) => Promise<void>;

    addHighlight: (highlight: PaperHighlight) => Promise<void>;
    deleteHighlight: (paperId: string, highlightId: string) => Promise<void>;
    updateHighlightColor: (paperId: string, highlightId: string, color: PaperHighlight["color"]) => Promise<void>;

    addNote: (note: PaperNote) => Promise<void>;
    updateNoteContent: (paperId: string, noteId: string, content: string) => Promise<void>;
    deleteNote: (paperId: string, noteId: string) => Promise<void>;
}

function getPaper(byPaper: Record<string, PaperAnnotations>, paperId: string): PaperAnnotations {
    return byPaper[paperId] ?? { highlights: EMPTY_HIGHLIGHTS, notes: EMPTY_NOTES };
}

export const useAnnotationStore = create<AnnotationStore>((set, get) => ({
    byPaper: {},
    loading: {},

    fetchAnnotations: async (paperId) => {
        if (get().loading[paperId]) return;
        set((s) => ({ loading: { ...s.loading, [paperId]: true } }));
        try {
            const res = await fetch(`/api/annotations/${paperId}`);
            const { highlights, notes } = await res.json();
            set((s) => ({
                byPaper: { ...s.byPaper, [paperId]: { highlights: highlights ?? [], notes: notes ?? [] } },
            }));
        } finally {
            set((s) => ({ loading: { ...s.loading, [paperId]: false } }));
        }
    },

    addHighlight: async (highlight) => {
        // Optimistic update
        set((s) => {
            const prev = getPaper(s.byPaper, highlight.paperId);
            return { byPaper: { ...s.byPaper, [highlight.paperId]: { ...prev, highlights: [...prev.highlights, highlight] } } };
        });
        await fetch(`/api/annotations/${highlight.paperId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "highlight", ...highlight }),
        });
    },

    deleteHighlight: async (paperId, highlightId) => {
        set((s) => {
            const prev = getPaper(s.byPaper, paperId);
            return {
                byPaper: {
                    ...s.byPaper,
                    [paperId]: {
                        highlights: prev.highlights.filter((h) => h.id !== highlightId),
                        notes: prev.notes.filter((n) => n.highlightId !== highlightId),
                    },
                },
            };
        });
        await fetch(`/api/annotations/${paperId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "highlight", id: highlightId }),
        });
    },

    updateHighlightColor: async (paperId, highlightId, color) => {
        set((s) => {
            const prev = getPaper(s.byPaper, paperId);
            return {
                byPaper: {
                    ...s.byPaper,
                    [paperId]: { ...prev, highlights: prev.highlights.map((h) => (h.id === highlightId ? { ...h, color } : h)) },
                },
            };
        });
        await fetch(`/api/annotations/${paperId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "highlight", id: highlightId, color }),
        });
    },

    addNote: async (note) => {
        set((s) => {
            const prev = getPaper(s.byPaper, note.paperId);
            return { byPaper: { ...s.byPaper, [note.paperId]: { ...prev, notes: [...prev.notes, note] } } };
        });
        await fetch(`/api/annotations/${note.paperId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "note", ...note }),
        });
    },

    updateNoteContent: async (paperId, noteId, content) => {
        set((s) => {
            const prev = getPaper(s.byPaper, paperId);
            return {
                byPaper: {
                    ...s.byPaper,
                    [paperId]: {
                        ...prev,
                        notes: prev.notes.map((n) =>
                            n.id === noteId
                                ? { ...n, updatedAt: new Date().toISOString(), blocks: n.blocks.map((b) => (b.data.type === "text" ? { ...b, data: { type: "text" as const, content } } : b)) }
                                : n
                        ),
                    },
                },
            };
        });
        await fetch(`/api/annotations/${paperId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "note", id: noteId, blocks: get().byPaper[paperId]?.notes.find((n) => n.id === noteId)?.blocks }),
        });
    },

    deleteNote: async (paperId, noteId) => {
        set((s) => {
            const prev = getPaper(s.byPaper, paperId);
            return { byPaper: { ...s.byPaper, [paperId]: { ...prev, notes: prev.notes.filter((n) => n.id !== noteId) } } };
        });
        await fetch(`/api/annotations/${paperId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "note", id: noteId }),
        });
    },
}));
