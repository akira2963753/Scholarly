"use client";

import { useEffect, useState, useCallback } from "react";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";

export function NotesPanel() {
  const notes = useWorkspaceStore((s) => s.notes);
  const addNote = useWorkspaceStore((s) => s.addNote);
  const updateNoteContent = useWorkspaceStore((s) => s.updateNoteContent);
  const paperId = useWorkspaceStore((s) => s.paperId);

  // Find the global note for this paper (one that has no highlightId or just the first note)
  const globalNote = notes.find((n) => !n.highlightId) || notes[0];

  const textBlock = globalNote?.blocks.find((b) => b.data.type === "text");
  const extractedText = textBlock && textBlock.data.type === "text" ? textBlock.data.content : "";

  const [noteText, setNoteText] = useState(extractedText);

  // Sync state if globalNote changes remotely or from initial load
  useEffect(() => {
    setNoteText(extractedText);
  }, [extractedText]);

  const handleBlur = useCallback(() => {
    if (!paperId) return;

    if (globalNote) {
      if (noteText !== extractedText) {
        updateNoteContent(globalNote.id, noteText);
      }
    } else if (noteText.trim()) {
      // Create a brand new global note
      addNote({
        id: crypto.randomUUID(),
        paperId,
        highlightId: null, // explicit null for global note
        blocks: [
          {
            id: crypto.randomUUID(),
            data: { type: "text", content: noteText },
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }, [paperId, globalNote, noteText, extractedText, updateNoteContent, addNote]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--surface)", padding: "20px" }}>
      <textarea
        value={noteText}
        onChange={(e) => setNoteText(e.target.value)}
        onBlur={handleBlur}
        placeholder="Start typing your notes here..."
        style={{
          width: "100%",
          height: "100%",
          padding: "0",
          fontSize: "14.5px",
          lineHeight: 1.6,
          fontFamily: "var(--font-ui-en, 'EB Garamond'), var(--font-ui-zh, 'Noto Serif TC'), Georgia, serif",
          border: "none",
          background: "transparent",
          color: "var(--text-1)",
          resize: "none",
          outline: "none",
        }}
      />
    </div>
  );
}
