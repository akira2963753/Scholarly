import type { ScaledPosition } from "react-pdf-highlighter-extended";

/**
 * Fix for multi-column PDFs: PDF text layers often store lines as full-page-width
 * text items, causing highlights to bleed into the adjacent column.
 * This algorithm calculates the maximum physical space the given text could reasonably
 * occupy (distinguishing CJK vs English) and clamps the box width if it vastly exceeds it.
 */
export function normalizePosition(position: ScaledPosition, text: string): ScaledPosition {
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
