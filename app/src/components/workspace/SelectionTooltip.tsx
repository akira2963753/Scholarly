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

import { useEffect } from "react";

/**
 * Fix for multi-column PDFs: PDF text layers often store lines as full-page-width
 * text items, causing highlights to bleed into the adjacent column.
 */
/**
 * Fix for multi-column PDFs: PDF text layers often store lines as full-page-width
 * text items, causing highlights to bleed into the adjacent column.
 * This algorithm calculates the maximum physical space the given text could reasonably
 * occupy (distinguishing CJK vs English) and clamps the box width if it vastly exceeds it.
 */
function normalizePosition(position: ScaledPosition, text: string): ScaledPosition {
  const { rects, boundingRect } = position;
  if (!rects || rects.length === 0 || !text) return position;

  const rawText = text.trim();
  if (!rawText) return position;

  const widths = rects.map(r => r.x2 - r.x1);
  let maxWidth = Infinity;

  if (rects.length > 1) {
    const sorted = [...widths].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    maxWidth = median * 1.5;
  } else {
    // Single line selection.
    const H = rects[0].y2 - rects[0].y1;
    // Count CJK vs English characters for width estimation
    const cjkCount = (rawText.match(/[\u3000-\u9fff\uac00-\ud7a3\u0800-\u4e00]/g) || []).length;
    const otherCount = rawText.length - cjkCount;

    // Generous upper limit for text width: CJK=1.2x height, English=0.7x height, plus 3 chars padding
    const safeTextWidth = (cjkCount * 1.2 + otherCount * 0.7 + 3) * H;

    // If the box width is physically impossible for the text amount AND it spans >30% of the page
    if (widths[0] > safeTextWidth && widths[0] > boundingRect.width * 0.3) {
      maxWidth = safeTextWidth;
    }
  }

  if (maxWidth === Infinity) return position;

  const normalizedRects = rects.map(rect => {
    const w = rect.x2 - rect.x1;
    return w > maxWidth ? { ...rect, x2: rect.x1 + maxWidth } : rect;
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
  const context = usePdfHighlighterContext();
  const { getCurrentSelection, removeGhostHighlight } = context;
  const { paperId, addHighlight, addNote } = useWorkspaceStore();

  // As soon as the tooltip renders, convert the native selection into a GhostHighlight.
  // This removes the browser's native `::selection` (which draws ugly trailing boxes)
  // and gives us a clean HighlightContainer UI managed by React.
  useEffect(() => {
    const sel = getCurrentSelection();
    if (sel && "makeGhostHighlight" in sel && typeof sel.makeGhostHighlight === "function") {
      sel.makeGhostHighlight();
    }
  }, [getCurrentSelection]);

  const makeHighlight = (color: HighlightColor): PaperHighlight | null => {
    // Because we called makeGhostHighlight() above, getCurrentSelection() might be null.
    // We fall back to the ghost highlight's coordinates.
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
