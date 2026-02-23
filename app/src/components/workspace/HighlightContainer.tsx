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

// Library assigns this id to ghost highlights (non-permanent, in-progress selections)
const GHOST_ID = "empty-id";

/**
 * Normalize a ViewportPosition (LTWHP rects) to prevent column bleed.
 *
 * In ScaledPosition, boundingRect.width == the PAGE width in viewport pixels
 * (because scaledPositionToViewport stores the viewport page size in the width/height
 * fields of every Scaled rect). We pass that value in as `pageWidthPx` so we can
 * apply the same column-boundary clamping used by normalizePosition, but in the
 * already-converted pixel coordinate space that HighlightContainer receives.
 */
function normalizeViewportPosition(position: any, text: string, pageWidthPx: number): any {
  const { rects, boundingRect } = position;
  if (!rects || rects.length === 0 || !text || !pageWidthPx) return position;

  const rawText = text.trim();
  if (!rawText) return position;

  const charsPerRect = rawText.length / rects.length;
  const cjkCount =
    (rawText.match(/[\u3000-\u9fff\uac00-\ud7a3\u0800-\u4e00]/g) || []).length / rects.length;
  const otherCount = charsPerRect - cjkCount;

  const normalizedRects = rects.map((rect: any) => {
    const H = rect.height;
    const W = rect.width;
    const rightEdge = rect.left + W;
    const expectedMaxWidth = (cjkCount * 1.4 + otherCount * 0.85 + 6) * H;

    if (W > expectedMaxWidth * 1.25 && W > pageWidthPx * 0.3) {
      if (rect.left < pageWidthPx * 0.48 && rightEdge > pageWidthPx * 0.52) {
        const safeClamp = Math.max(pageWidthPx * 0.49, rect.left + expectedMaxWidth * 1.5);
        return { ...rect, width: Math.min(W, safeClamp - rect.left) };
      }
      if (rect.left > pageWidthPx * 0.5 && rightEdge > pageWidthPx * 0.95) {
        const safeClamp = Math.max(pageWidthPx * 0.96, rect.left + expectedMaxWidth * 1.5);
        return { ...rect, width: Math.min(W, safeClamp - rect.left) };
      }
    }
    return rect;
  });

  return {
    ...position,
    rects: normalizedRects,
    boundingRect: {
      ...boundingRect,
      width:
        Math.max(...normalizedRects.map((r: any) => r.left + r.width)) -
        (boundingRect.left ?? 0),
    },
  };
}

/**
 * Rendered once per highlight inside PdfHighlighter.
 * Ghost highlights (id === GHOST_ID) are:
 *   – styled as a neutral selection-blue (not yellow)
 *   – position-normalized in viewport space to prevent column bleed
 */
export function HighlightContainer() {
  const { highlight, isScrolledTo } = useHighlightContainerContext<PaperHighlight>();
  const ctx = usePdfHighlighterContext() as any;

  const isGhost = highlight.id === GHOST_ID;

  // For ghost highlights, normalize the viewport position using the page width stored
  // inside the ghost's original ScaledPosition (boundingRect.width == page px width).
  const displayHighlight: any = (() => {
    if (!isGhost) return highlight;
    const ghostText: string = (highlight as any).content?.text ?? "";
    const pageWidthPx: number | undefined =
      ctx.getGhostHighlight?.()?.position?.boundingRect?.width;
    if (!ghostText || !pageWidthPx) return highlight;
    return {
      ...highlight,
      position: normalizeViewportPosition(highlight.position, ghostText, pageWidthPx),
    };
  })();

  // Ghost → neutral selection-blue; permanent → chosen colour
  const color = highlight.color ?? "yellow";
  const bg = isGhost ? "rgba(66, 153, 225, 0.28)" : COLOR_MAP[color];
  const border = isGhost ? "transparent" : BORDER_MAP[color];

  const handleClick = isGhost
    ? undefined
    : () => {
      ctx.setTip({
        position: highlight.position,
        content: <HighlightEditMenu highlight={highlight} />,
      });
    };

  return (
    <MonitoredHighlightContainer onMouseEnter={() => { }}>
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
        }}
      />
    </MonitoredHighlightContainer>
  );
}
