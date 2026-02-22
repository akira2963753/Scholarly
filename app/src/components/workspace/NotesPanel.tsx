"use client";

import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { NoteCard } from "./NoteCard";

export function NotesPanel() {
  const notes = useWorkspaceStore((s) => s.notes);
  const highlights = useWorkspaceStore((s) => s.highlights);

  // Sort by highlight page number
  const sortedNotes = [...notes].sort((a, b) => {
    const ha = highlights.find((h) => h.id === a.highlightId);
    const hb = highlights.find((h) => h.id === b.highlightId);
    const pa = ha?.position.boundingRect.pageNumber ?? 0;
    const pb = hb?.position.boundingRect.pageNumber ?? 0;
    return pa - pb;
  });

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--surface)" }}>

      {/* Notes list */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {sortedNotes.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: "12px",
              color: "var(--text-3)",
              padding: "40px 24px",
              textAlign: "center",
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ opacity: 0.35 }}>
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: 500 }}>No notes yet</p>
              <p style={{ margin: 0, fontSize: "12px" }}>
                Select text in the PDF and click <strong>+ Note</strong> to begin
              </p>
            </div>
          </div>
        ) : (
          sortedNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              highlight={highlights.find((h) => h.id === note.highlightId)}
            />
          ))
        )}
      </div>
    </div>
  );
}
