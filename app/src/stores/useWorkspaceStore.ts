"use client";

import { create } from "zustand";
import type { PaperHighlight } from "@/types/highlight";
import type { PaperNote } from "@/types/note";
import type { PdfHighlighterUtils } from "react-pdf-highlighter-extended";
import { useAnnotationStore } from "./useAnnotationStore";

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

interface WorkspaceStore {
  paperId: string | null;
  highlights: PaperHighlight[];
  notes: PaperNote[];

  /** Stored reference to PdfHighlighter utilities (for bidirectional anchor) */
  pdfUtils: PdfHighlighterUtils | null;

  /** Map of highlightId → NoteCard DOM element (for reverse anchor: PDF → note) */
  noteCardRefs: Map<string, HTMLElement>;

  /** Retain chat messages when switching tabs */
  chatMessages: ChatMessage[];
  /** Gemini File API URI for the current paper's PDF */
  paperFileUri: string | null;
  /** Whether the "PDF fully loaded" success message is visible */
  aiContextLoadedVisible: boolean;

  // ── Actions ──────────────────────────────────────────────
  initWorkspace: (paperId: string, highlights: PaperHighlight[], notes: PaperNote[]) => void;
  setAnnotations: (highlights: PaperHighlight[], notes: PaperNote[]) => void;
  setPdfUtils: (utils: PdfHighlighterUtils) => void;
  setChatMessages: (msgs: ChatMessage[]) => void;
  setPaperFileUri: (uri: string | null) => void;
  setAiContextLoadedVisible: (visible: boolean) => void;

  addHighlight: (highlight: PaperHighlight) => void;
  deleteHighlight: (id: string) => void;
  updateHighlightColor: (id: string, color: PaperHighlight["color"]) => void;

  addNote: (note: PaperNote) => void;
  updateNoteContent: (noteId: string, content: string) => void;
  deleteNote: (id: string) => void;

  /** Scroll PDF viewer to a specific highlight */
  scrollToPdfHighlight: (highlight: PaperHighlight) => void;

  /** Register a NoteCard DOM ref for reverse anchor */
  registerNoteCardRef: (highlightId: string, el: HTMLElement | null) => void;

  /** Scroll the notes panel to a note card */
  scrollToNoteCard: (highlightId: string) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>()((set, get) => ({
  paperId: null,
  highlights: [],
  notes: [],
  pdfUtils: null,
  noteCardRefs: new Map(),
  chatMessages: [],
  paperFileUri: null,
  aiContextLoadedVisible: false,

  initWorkspace: (paperId, highlights, notes) =>
    set({ paperId, highlights, notes, pdfUtils: null, noteCardRefs: new Map(), chatMessages: [], paperFileUri: null, aiContextLoadedVisible: false }),

  setAnnotations: (highlights, notes) => set({ highlights, notes }),

  setPdfUtils: (utils) => set({ pdfUtils: utils }),
  setChatMessages: (msgs) => set({ chatMessages: msgs }),
  setPaperFileUri: (uri) => set({ paperFileUri: uri }),
  setAiContextLoadedVisible: (visible) => set({ aiContextLoadedVisible: visible }),

  // ── Write-through: update runtime state + persist to annotation store ────

  addHighlight: (highlight) => {
    useAnnotationStore.getState().addHighlight(highlight);
    set((state) => ({ highlights: [...state.highlights, highlight] }));
  },

  deleteHighlight: (id) => {
    const { paperId } = get();
    if (paperId) useAnnotationStore.getState().deleteHighlight(paperId, id);
    set((state) => ({
      highlights: state.highlights.filter((h) => h.id !== id),
      notes: state.notes.filter((n) => n.highlightId !== id),
    }));
  },

  updateHighlightColor: (id, color) => {
    const { paperId } = get();
    if (paperId) useAnnotationStore.getState().updateHighlightColor(paperId, id, color);
    set((state) => ({
      highlights: state.highlights.map((h) => h.id === id ? { ...h, color } : h),
    }));
  },

  addNote: (note) => {
    useAnnotationStore.getState().addNote(note);
    set((state) => ({ notes: [...state.notes, note] }));
  },

  updateNoteContent: (noteId, content) => {
    const { paperId } = get();
    if (paperId) useAnnotationStore.getState().updateNoteContent(paperId, noteId, content);
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === noteId
          ? {
            ...n,
            updatedAt: new Date().toISOString(),
            blocks: n.blocks.map((b) =>
              b.data.type === "text" ? { ...b, data: { type: "text" as const, content } } : b
            ),
          }
          : n
      ),
    }));
  },

  deleteNote: (id) => {
    const { paperId } = get();
    if (paperId) useAnnotationStore.getState().deleteNote(paperId, id);
    set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));
  },

  // ── Navigation helpers ───────────────────────────────────
  scrollToPdfHighlight: (highlight) => {
    const { pdfUtils } = get();
    if (!pdfUtils) return;
    const viewer = pdfUtils.getViewer();
    const pageNumber = highlight.position.boundingRect.pageNumber;
    if (viewer && pageNumber) {
      viewer.currentPageNumber = pageNumber;
    }
  },

  registerNoteCardRef: (highlightId, el) => {
    set((state) => {
      const refs = new Map(state.noteCardRefs);
      if (el) {
        refs.set(highlightId, el);
      } else {
        refs.delete(highlightId);
      }
      return { noteCardRefs: refs };
    });
  },

  scrollToNoteCard: (highlightId) => {
    const el = get().noteCardRefs.get(highlightId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  },
}));
