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
      {/* Panel header */}
      <div
        style={{
          padding: "14px 20px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-1)" }}>Notes</span>
        {notes.length > 0 && (
          <span
            className="badge"
            style={{ background: "var(--surface-3)", color: "var(--text-2)" }}
          >
            {notes.length}
          </span>
        )}
      </div>

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
