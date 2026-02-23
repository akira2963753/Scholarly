"use client";

import { useEffect } from "react";
import { usePdfHighlighterContext } from "react-pdf-highlighter-extended";
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

  // Convert native selection to a ghost highlight immediately.
  // This removes the browser's native ::selection (which bleeds across columns due to
  // PDF.js text-layer bounding boxes) and gives us a React-managed highlight container
  // where we can normalize the position to prevent column bleed.
  useEffect(() => {
    const sel = getCurrentSelection();
    if (sel && "makeGhostHighlight" in sel && typeof sel.makeGhostHighlight === "function") {
      sel.makeGhostHighlight();
    }
  }, [getCurrentSelection]);

  const makeHighlight = (color: HighlightColor): PaperHighlight | null => {
    // getCurrentSelection() is null after makeGhostHighlight(); fall back to ghost.
    const sel = getCurrentSelection() || (context as any).getGhostHighlight?.();
    if (!sel || !paperId) return null;
    return {
      id: crypto.randomUUID(),
      color,
      selectedText: sel.content?.text?.trim() || "",
      position: normalizePosition(sel.position, sel.content?.text || ""),
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
