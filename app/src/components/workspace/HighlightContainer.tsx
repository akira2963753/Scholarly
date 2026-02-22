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
  yellow: "rgba(235, 219, 164, 0.5)",
  red: "rgba(235, 161, 136, 0.5)",
  blue: "rgba(192, 215, 235, 0.5)",
  green: "rgba(235, 234, 191, 0.5)",
};

const BORDER_MAP: Record<HighlightColor, string> = {
  yellow: "#EBDBA4",
  red: "#EBA188",
  blue: "#C0D7EB",
  green: "#EBEABF",
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
    <MonitoredHighlightContainer onMouseEnter={() => { }}>
      <TextHighlight
        highlight={highlight}
        isScrolledTo={isScrolledTo}
        onClick={handleClick}
        style={{
          background: bg,
          outline: isScrolledTo ? `2px solid ${border}` : "none",
          outlineOffset: "1px",
          borderRadius: "2px",
          cursor: "pointer",
          transition: "outline 0.2s ease",
          transform: "scaleY(0.85)",
          transformOrigin: "bottom",
        }}
      />
    </MonitoredHighlightContainer>
  );
}
