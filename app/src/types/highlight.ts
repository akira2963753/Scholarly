import type { Highlight, ScaledPosition } from "react-pdf-highlighter-extended";

export type HighlightColor = "yellow" | "red" | "blue" | "green";

/** Extends the library's Highlight with our custom fields */
export interface PaperHighlight extends Highlight {
  color: HighlightColor;
  selectedText: string;
  paperId: string;
  createdAt: string;
}

export type { ScaledPosition };
