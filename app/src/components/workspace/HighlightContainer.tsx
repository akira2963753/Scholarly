"use client";

import {
  useHighlightContainerContext,
  usePdfHighlighterContext,
  TextHighlight,
  MonitoredHighlightContainer,
} from "react-pdf-highlighter-extended";
import { HighlightEditMenu } from "./HighlightEditMenu";
import type { PaperHighlight, HighlightColor } from "@/types/highlight";

const COLOR_MAP: Record<HighlightColor, string> = {
  yellow: "rgba(252, 196, 25, 0.22)",
  red:    "rgba(225, 80, 80, 0.18)",
  blue:   "rgba(66, 153, 225, 0.22)",
};

const BORDER_MAP: Record<HighlightColor, string> = {
  yellow: "rgba(245, 159, 0, 0.6)",
  red:    "rgba(224, 49, 49, 0.55)",
  blue:   "rgba(25, 113, 194, 0.55)",
};

/**
 * Rendered once per highlight inside PdfHighlighter.
 * Uses useHighlightContainerContext() to access per-highlight data.
 */
export function HighlightContainer() {
  const { highlight, isScrolledTo } = useHighlightContainerContext<PaperHighlight>();
  const { setTip } = usePdfHighlighterContext();

  const color = highlight.color ?? "yellow";
  const bg = COLOR_MAP[color];
  const border = BORDER_MAP[color];

  const handleClick = () => {
    setTip({
      position: highlight.position,
      content: <HighlightEditMenu highlight={highlight} />,
    });
  };

  return (
    <MonitoredHighlightContainer onMouseEnter={() => {}}>
      <TextHighlight
        highlight={highlight}
        isScrolledTo={isScrolledTo}
        onClick={handleClick}
        style={{
          background: bg,
          mixBlendMode: "multiply",
          outline: isScrolledTo ? `2px solid ${border}` : "none",
          outlineOffset: "1px",
          borderRadius: "2px",
          cursor: "pointer",
          transition: "outline 0.2s ease",
        }}
      />
    </MonitoredHighlightContainer>
  );
}
