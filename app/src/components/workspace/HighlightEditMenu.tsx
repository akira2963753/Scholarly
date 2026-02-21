"use client";

import { usePdfHighlighterContext } from "react-pdf-highlighter-extended";
import type { ViewportHighlight } from "react-pdf-highlighter-extended";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import type { PaperHighlight, HighlightColor } from "@/types/highlight";
import type { PaperNote } from "@/types/note";

interface Props {
  highlight: ViewportHighlight<PaperHighlight>;
}

const COLORS: { color: HighlightColor; bg: string; border: string }[] = [
  { color: "yellow", bg: "rgba(252,196,25,0.55)",  border: "#f59f00" },
  { color: "red",    bg: "rgba(230,80,80,0.50)",   border: "#e03131" },
  { color: "blue",   bg: "rgba(66,153,225,0.50)",  border: "#1971c2" },
];

export function HighlightEditMenu({ highlight }: Props) {
  const { setTip } = usePdfHighlighterContext();
  const { updateHighlightColor, deleteHighlight, notes, addNote, paperId } = useWorkspaceStore();

  const hasNote = notes.some((n) => n.highlightId === highlight.id);

  const handleColorChange = (color: HighlightColor) => {
    updateHighlightColor(highlight.id, color);
    setTip(null);
  };

  const handleAddNote = () => {
    if (!paperId) return;
    const note: PaperNote = {
      id: crypto.randomUUID(),
      paperId,
      highlightId: highlight.id,
      blocks: [
        {
          id: crypto.randomUUID(),
          data: {
            type: "quote",
            highlightId: highlight.id,
            quotedText: highlight.selectedText ?? "",
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
    setTip(null);
  };

  const handleDelete = () => {
    deleteHighlight(highlight.id);
    setTip(null);
  };

  return (
    <div className="selection-tooltip">
      {COLORS.map(({ color, bg, border }) => (
        <button
          key={color}
          onClick={() => handleColorChange(color)}
          title={color}
          style={{
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            border: `2px solid ${border}`,
            background: bg,
            cursor: "pointer",
            outline: highlight.color === color ? `2px solid white` : "none",
            outlineOffset: "1px",
            transition: "transform 0.12s ease",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.18)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        />
      ))}

      <div style={{ width: "1px", height: "14px", background: "rgba(255,255,255,0.2)", margin: "0 2px" }} />

      {!hasNote && (
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
            whiteSpace: "nowrap",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          + Note
        </button>
      )}

      <button
        onClick={handleDelete}
        title="Delete highlight"
        style={{
          background: "transparent",
          border: "none",
          color: "rgba(255,255,255,0.65)",
          cursor: "pointer",
          padding: "2px 5px",
          borderRadius: "4px",
          display: "flex",
          alignItems: "center",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#ff8787")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.65)")}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
      </button>
    </div>
  );
}
