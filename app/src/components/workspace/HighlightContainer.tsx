"use client";

import {
  useHighlightContainerContext,
  usePdfHighlighterContext,
  TextHighlight,
  MonitoredHighlightContainer,
} from "react-pdf-highlighter-extended";
import { HighlightEditMenu } from "./HighlightEditMenu";
import { normalizePosition } from "@/lib/normalizePosition";
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

// Library assigns this id to ghost highlights (non-permanent, in-progress selections)
const GHOST_ID = "empty-id";

/**
 * Rendered once per highlight inside PdfHighlighter.
 * Uses useHighlightContainerContext() to access per-highlight data.
 * Ghost highlights (id === GHOST_ID) are styled as a neutral selection indicator
 * and have their position normalized to prevent column bleed.
 */
export function HighlightContainer() {
  const { highlight, isScrolledTo } = useHighlightContainerContext<PaperHighlight>();
  const { setTip } = usePdfHighlighterContext();

  const isGhost = highlight.id === GHOST_ID;

  // For ghost highlights: normalize position to clamp column bleed
  const ghostText = isGhost ? ((highlight as any).content?.text ?? "") : "";
  const displayHighlight = isGhost
    ? { ...highlight, position: normalizePosition(highlight.position, ghostText) }
    : highlight;

  // Ghost → neutral selection-blue; permanent → chosen colour
  const color = highlight.color ?? "yellow";
  const bg = isGhost ? "rgba(66, 153, 225, 0.28)" : COLOR_MAP[color];
  const border = isGhost ? "transparent" : BORDER_MAP[color];

  const handleClick = isGhost
    ? undefined
    : () => {
        setTip({
          position: highlight.position,
          content: <HighlightEditMenu highlight={highlight} />,
        });
      };

  return (
    <MonitoredHighlightContainer onMouseEnter={() => {}}>
      <TextHighlight
        highlight={displayHighlight}
        isScrolledTo={isScrolledTo}
        onClick={handleClick}
        style={{
          background: bg,
          outline: !isGhost && isScrolledTo ? `2px solid ${border}` : "none",
          outlineOffset: "1px",
          borderRadius: "2px",
          cursor: isGhost ? "text" : "pointer",
          transition: "outline 0.2s ease",
          transform: "scaleY(0.85)",
          transformOrigin: "bottom",
        }}
      />
    </MonitoredHighlightContainer>
  );
}
