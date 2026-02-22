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

  const pageWidth = boundingRect.width;
  if (!pageWidth) return position;

  // We divide the text length by the number of rects to roughly estimate 
  // how many characters are in each highlighted box.
  const charsPerRect = rawText.length / rects.length;
  const cjkCount = (rawText.match(/[\u3000-\u9fff\uac00-\ud7a3\u0800-\u4e00]/g) || []).length / rects.length;
  const otherCount = charsPerRect - cjkCount;

  const normalizedRects = rects.map(rect => {
    const H = rect.y2 - rect.y1;
    const W = rect.x2 - rect.x1;

    // Generous upper limit for physical text width: 
    // CJK characters ~1.4x height, English ~0.85x height, plus 6 chars padding
    const expectedMaxWidth = (cjkCount * 1.4 + otherCount * 0.85 + 6) * H;

    // Detection logic: If the box's physical width drastically exceeds the expected text width, 
    // it means PDF.js has rendered a full-page width span for a short sentence.
    // We use a 1.25x safe multiplier so we NEVER accidentally trigger on wide fonts.
    if (W > expectedMaxWidth * 1.25 && W > pageWidth * 0.3) {

      // If it starts in the left column and bleeds into the right half
      if (rect.x1 < pageWidth * 0.48 && rect.x2 > pageWidth * 0.52) {
        // Clamp to the center column boundary (49%), or 1.5x expected width if it's super short.
        // This guarantees we never cut off actual text!
        const safeClamp = Math.max(pageWidth * 0.49, rect.x1 + expectedMaxWidth * 1.5);
        return { ...rect, x2: Math.min(rect.x2, safeClamp) };
      }

      // If it starts in the right column and bleeds off the page margin
      if (rect.x1 > pageWidth * 0.5 && rect.x2 > pageWidth * 0.95) {
        const safeClamp = Math.max(pageWidth * 0.96, rect.x1 + expectedMaxWidth * 1.5);
        return { ...rect, x2: Math.min(rect.x2, safeClamp) };
      }
    }

    return rect;
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
