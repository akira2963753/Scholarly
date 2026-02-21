"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import type { PaperNote } from "@/types/note";
import type { PaperHighlight } from "@/types/highlight";

interface Props {
  note: PaperNote;
  highlight: PaperHighlight | undefined;
}

export function NoteCard({ note, highlight }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { registerNoteCardRef, scrollToPdfHighlight, updateNoteContent, deleteNote } = useWorkspaceStore();

  // Register this card's DOM ref for reverse scroll
  useEffect(() => {
    const el = cardRef.current;
    if (el) {
      registerNoteCardRef(note.highlightId, el);
      return () => registerNoteCardRef(note.highlightId, null);
    }
  }, [note.highlightId, registerNoteCardRef]);

  // Find the quote block and text block
  const quoteBlock = note.blocks.find((b) => b.data.type === "quote");
  const textBlock = note.blocks.find((b) => b.data.type === "text");
  const quotedText = quoteBlock?.data.type === "quote" ? quoteBlock.data.quotedText : "";
  const pageNumber = quoteBlock?.data.type === "quote" ? quoteBlock.data.pageNumber : null;
  const textContent = textBlock?.data.type === "text" ? textBlock.data.content : "";

  const [noteText, setNoteText] = useState(textContent);

  const handleScrollToPdf = () => {
    if (highlight) scrollToPdfHighlight(highlight);
  };

  const handleBlur = useCallback(() => {
    updateNoteContent(note.id, noteText);
  }, [note.id, noteText, updateNoteContent]);

  const COLOR_DOT: Record<string, string> = {
    yellow: "var(--hl-yellow-solid)",
    red: "var(--hl-red-solid)",
    blue: "var(--hl-blue-solid)",
  };

  return (
    <div
      ref={cardRef}
      style={{
        borderBottom: "1px solid var(--border)",
        padding: "16px 20px",
        transition: "background 0.15s ease",
      }}
    >
      {/* Quote Block — clicking scrolls PDF to location */}
      {quotedText && (
        <div
          className="quote-block"
          onClick={handleScrollToPdf}
          title="Click to jump to location in PDF"
        >
          {/* Color indicator + page badge */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {highlight && (
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: COLOR_DOT[highlight.color] || "var(--text-3)",
                    flexShrink: 0,
                  }}
                />
              )}
              <span style={{ fontSize: "11px", color: "var(--text-3)", fontFamily: "var(--font-ui)" }}>
                Quoted passage
              </span>
            </div>
            {pageNumber && (
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--accent)",
                  fontFamily: "var(--font-ui)",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                p. {pageNumber}
              </span>
            )}
          </div>
          <p style={{ margin: 0, lineHeight: 1.65, fontSize: "14.5px" }}>
            "{quotedText}"
          </p>
        </div>
      )}

      {/* Note text editor */}
      <div style={{ marginTop: "10px" }}>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          onBlur={handleBlur}
          placeholder="Add your thoughts, analysis, or connections…"
          style={{
            width: "100%",
            minHeight: "72px",
            padding: "8px 10px",
            fontSize: "13.5px",
            lineHeight: 1.6,
            fontFamily: "var(--font-content, 'EB Garamond', 'Noto Serif TC', Georgia, serif)",
            border: "1px solid transparent",
            borderRadius: "var(--radius-sm)",
            background: "transparent",
            color: "var(--text-1)",
            resize: "vertical",
            outline: "none",
            transition: "background 0.15s, border-color 0.15s",
          }}
          onFocus={(e) => {
            e.currentTarget.style.background = "var(--surface-2)";
            e.currentTarget.style.borderColor = "var(--border)";
          }}
          onBlurCapture={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "transparent";
          }}
        />
      </div>

      {/* Delete note */}
      <button
        onClick={() => deleteNote(note.id)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          fontSize: "11px",
          color: "var(--text-3)",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "2px 0",
          marginTop: "4px",
          transition: "color 0.12s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#e03131")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-3)")}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
        Delete
      </button>
    </div>
  );
}
