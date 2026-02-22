"use client";

import { useEffect, useRef } from "react";
import { usePdfHighlighterContext } from "react-pdf-highlighter-extended";
import type { ScaledPosition } from "react-pdf-highlighter-extended";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { normalizePosition } from "@/lib/normalizePosition";
import type { PaperHighlight, HighlightColor } from "@/types/highlight";
import type { PaperNote } from "@/types/note";

const COLORS: { color: HighlightColor; label: string; bg: string; border: string }[] = [
  { color: "yellow", label: "Key Point", bg: "#EBDBA480", border: "#EBDBA4" },
  { color: "red", label: "Question", bg: "#EBA18880", border: "#EBA188" },
  { color: "blue", label: "Reference", bg: "#C0D7EB80", border: "#C0D7EB" },
];

export function SelectionTooltip() {
  const context = usePdfHighlighterContext();
  const { getCurrentSelection, removeGhostHighlight } = context;
  const { paperId, addHighlight, addNote } = useWorkspaceStore();

  // Snapshot the selection the moment the tooltip appears (in ScaledPosition format).
  // We do NOT call makeGhostHighlight() here: that API replaces the native browser
  // selection with a ghost highlight whose position comes from the raw PDF text layer,
  // causing the selection box to bleed into adjacent columns. Instead we keep the
  // native selection visible (which correctly follows the text lines) and store the
  // scaled position so it survives a button click that might clear the browser selection.
  const pendingRef = useRef<{ position: ScaledPosition; text: string } | null>(null);

  useEffect(() => {
    const sel = getCurrentSelection();
    if (sel) {
      pendingRef.current = {
        position: sel.position,
        text: sel.content?.text?.trim() ?? "",
      };
    }
    return () => { pendingRef.current = null; };
  }, [getCurrentSelection]);

  const makeHighlight = (color: HighlightColor): PaperHighlight | null => {
    // Prefer live native selection; fall back to ref snapshot if the click cleared it.
    const sel = getCurrentSelection();
    const position = sel?.position ?? pendingRef.current?.position;
    const text = sel?.content?.text?.trim() ?? pendingRef.current?.text ?? "";

    if (!position || !paperId) return null;
    return {
      id: crypto.randomUUID(),
      color,
      selectedText: text,
      position: normalizePosition(position, text),
      paperId,
      createdAt: new Date().toISOString(),
    };
  };

  const handleHighlight = (color: HighlightColor) => {
    const highlight = makeHighlight(color);
    if (!highlight) return;
    addHighlight(highlight);
    removeGhostHighlight();
  };

  const handleAddNote = () => {
    const highlight = makeHighlight("green");
    if (!highlight) return;
    addHighlight(highlight);
    removeGhostHighlight();

    const note: PaperNote = {
      id: crypto.randomUUID(),
      paperId: highlight.paperId,
      highlightId: highlight.id,
      blocks: [
        {
          id: crypto.randomUUID(),
          data: {
            type: "quote",
            highlightId: highlight.id,
            quotedText: highlight.selectedText,
            pageNumber: highlight.position.boundingRect.pageNumber ?? 1,
          },
        },
        {
          id: crypto.randomUUID(),
          data: { type: "text", content: "" },
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addNote(note);
  };

  return (
    <div className="selection-tooltip">
      {COLORS.map(({ color, label, bg, border }) => (
        <button
          key={color}
          onClick={() => handleHighlight(color)}
          title={label}
          style={{
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            border: `2px solid ${border}`,
            background: bg,
            cursor: "pointer",
            transition: "transform 0.12s ease",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.18)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        />
      ))}

      <div style={{ width: "1px", height: "14px", background: "rgba(255,255,255,0.2)", margin: "0 2px" }} />

      <button
        onClick={handleAddNote}
        style={{
          background: "transparent",
          border: "none",
          color: "rgba(255,255,255,0.85)",
          fontSize: "12px",
          cursor: "pointer",
          padding: "2px 6px",
          borderRadius: "4px",
          transition: "background 0.12s ease",
          whiteSpace: "nowrap",
          fontFamily: "inherit",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        + Note
      </button>
    </div>
  );
}
