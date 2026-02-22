"use client";

import { usePdfHighlighterContext } from "react-pdf-highlighter-extended";
import type { ScaledPosition } from "react-pdf-highlighter-extended";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import type { PaperHighlight, HighlightColor } from "@/types/highlight";
import type { PaperNote } from "@/types/note";

const COLORS: { color: HighlightColor; label: string; bg: string; border: string }[] = [
  { color: "yellow", label: "Key Point", bg: "#EBDBA480", border: "#EBDBA4" },
  { color: "red", label: "Question", bg: "#EBA18880", border: "#EBA188" },
  { color: "blue", label: "Reference", bg: "#C0D7EB80", border: "#C0D7EB" },
];

/**
 * Fix for multi-column PDFs: PDF text layers often store lines as full-page-width
 * text items, causing highlights to bleed into the adjacent column.
 *
 * Strategy: any rect whose width exceeds 55% of the page width is treated as a
 * "column-bleed" rect and clipped. The clipped width uses the narrowest
 * non-oversized rect as reference; falls back to 48% of the page width.
 */
function normalizePosition(position: ScaledPosition): ScaledPosition {
  const { rects, boundingRect } = position;
  if (rects.length === 0) return position;

  // `boundingRect.width` and `.height` are the PDF page's pixel dimensions
  const pageWidth = boundingRect.width;
  if (!pageWidth) return position;

  const COLUMN_THRESHOLD = pageWidth * 0.55; // wider than this → spanning columns

  const oversized = rects.filter((r) => r.x2 - r.x1 > COLUMN_THRESHOLD);
  if (oversized.length === 0) return position; // nothing to clip

  // Use narrowest rect as the expected column width; fallback to 48% of page
  const narrow = rects.filter((r) => r.x2 - r.x1 <= COLUMN_THRESHOLD);
  const columnWidth =
    narrow.length > 0
      ? Math.max(...narrow.map((r) => r.x2 - r.x1))
      : pageWidth * 0.48;

  const normalizedRects = rects.map((rect) => {
    const w = rect.x2 - rect.x1;
    return w > COLUMN_THRESHOLD ? { ...rect, x2: rect.x1 + columnWidth } : rect;
  });

  return {
    ...position,
    rects: normalizedRects,
    boundingRect: {
      ...boundingRect,
      x2: Math.max(...normalizedRects.map((r) => r.x2)),
    },
  };
}

export function SelectionTooltip() {
  const { getCurrentSelection, removeGhostHighlight } = usePdfHighlighterContext();
  const { paperId, addHighlight, addNote } = useWorkspaceStore();

  const makeHighlight = (color: HighlightColor): PaperHighlight | null => {
    const sel = getCurrentSelection();
    if (!sel || !paperId) return null;
    return {
      id: crypto.randomUUID(),
      color,
      selectedText: sel.content?.text?.trim() || "",
      position: normalizePosition(sel.position),
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
