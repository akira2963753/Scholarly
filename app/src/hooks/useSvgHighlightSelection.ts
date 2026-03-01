"use client";

import { useEffect, useState, useCallback } from "react";
import type { ScaledPosition, Scaled } from "react-pdf-highlighter-extended";

export interface SvgSelection {
  position: ScaledPosition;
  text: string;
  /** Screen-space CSS pixel coordinates for the fixed-position tooltip */
  screenCenterX: number;
  screenTopY: number;
}

/**
 * Detects text selections on the SVG text overlay and converts them into
 * a ScaledPosition (the format react-pdf-highlighter-extended stores).
 *
 * KEY APPROACH
 * ────────────────────────────────────────────────────────────────────────────
 * PDF.js sometimes stores an entire line as one <text> element.  A naive
 * approach (getBoundingClientRect on each selected element) always returns the
 * full-line width, so the highlight spans the entire line even when the user
 * only selected a few words.
 *
 * Fix: use the SVG DOM method getStartPositionOfChar(n) / getExtentOfChar(n)
 * to get the *exact* rendered x position of the selected characters within a
 * partial <text> element.  These methods honour textLength/lengthAdjust, so
 * the positions are accurate even when the browser has stretched or compressed
 * glyphs to fill the specified width.
 *
 * Coordinate system: getStartPositionOfChar returns points in the SVG user
 * coordinate space (= viewBox = canvas pixel space).  We multiply by
 * (pageEl.offsetWidth / canvas.width) to convert to page-relative CSS pixels,
 * which is the convention used by the library's ScaledPosition format.
 */
export function useSvgHighlightSelection(): {
  selection: SvgSelection | null;
  clearSelection: () => void;
} {
  const [selection, setSelection] = useState<SvgSelection | null>(null);

  useEffect(() => {
    /** Walk a range endpoint node up to its nearest SVG <text> element. */
    const resolveTextEl = (node: Node): SVGTextElement | null => {
      const el =
        node.nodeType === Node.TEXT_NODE
          ? node.parentElement
          : (node as Element);
      if (!el) return null;
      if (el.tagName.toLowerCase() === "text") return el as SVGTextElement;
      return el.closest<SVGTextElement>("text");
    };

    /**
     * Compute a DOMRect for a character-level slice of a <text> element.
     *
     * @param startChar  Index of first selected char.  -1 = from element start.
     * @param endChar    Exclusive end char index.       -1 = to element end.
     * @param svgToScreenX  Converts an SVG x coordinate to a screen CSS x.
     */
    const charRangeRect = (
      el: SVGTextElement,
      startChar: number,
      endChar: number,
      svgToScreenX: (svgX: number) => number,
    ): DOMRect => {
      const fullRect = el.getBoundingClientRect();
      // Both ends unconstrained → return the full element rect
      if (startChar < 0 && endChar < 0) return fullRect;

      try {
        const numChars = el.getNumberOfChars();
        if (numChars === 0) return fullRect;

        const sc = startChar < 0 ? 0 : Math.min(startChar, numChars - 1);
        const ec = endChar   < 0 ? numChars : Math.min(endChar, numChars);
        if (sc >= ec) return fullRect;

        // getStartPositionOfChar / getExtentOfChar return values in the SVG
        // user coordinate space, which is our canvas-pixel space.
        const svgStartX = el.getStartPositionOfChar(sc).x;
        const lastExt   = el.getExtentOfChar(ec - 1);
        const svgEndX   = lastExt.x + lastExt.width;

        return new DOMRect(
          svgToScreenX(svgStartX),
          fullRect.top,
          svgToScreenX(svgEndX) - svgToScreenX(svgStartX),
          fullRect.height,
        );
      } catch {
        // SVG char methods unsupported or index out of range → fall back
        return fullRect;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button !== 0) return;

      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        setSelection(null);
        return;
      }

      const range = sel.getRangeAt(0);
      const text  = sel.toString().trim();
      if (!text) { setSelection(null); return; }

      // Identify the SVG <text> element at the start of the selection
      const startTextEl = resolveTextEl(range.startContainer);
      if (!startTextEl?.closest(".svg-text-overlay")) { setSelection(null); return; }

      const pageEl = startTextEl.closest<HTMLElement>(".page[data-page-number]");
      if (!pageEl) { setSelection(null); return; }

      const pageNumber = parseInt(pageEl.dataset.pageNumber ?? "0", 10);
      if (!pageNumber) { setSelection(null); return; }

      const canvas = pageEl.querySelector<HTMLCanvasElement>("canvas");
      if (!canvas || canvas.width === 0) { setSelection(null); return; }

      // All <text> elements on this page, in DOM (= reading) order
      const svg = startTextEl.closest<SVGSVGElement>(".svg-text-overlay")!;
      const allTextEls = Array.from(svg.querySelectorAll<SVGTextElement>("text"));

      const startIdx = allTextEls.indexOf(startTextEl);
      if (startIdx < 0) { setSelection(null); return; }

      // End element — fall back to startEl for cross-page drags
      const endTextEl = resolveTextEl(range.endContainer);
      const endSvg    = endTextEl?.closest(".svg-text-overlay");
      const rawEndIdx =
        endSvg === svg && endTextEl ? allTextEls.indexOf(endTextEl) : startIdx;
      const endIdx = rawEndIdx < 0 ? startIdx : rawEndIdx;

      // If endOffset === 0 on a different element, the user didn't actually
      // select any characters in that last element — exclude it.
      const effectiveEndIdx =
        endIdx > startIdx && range.endOffset === 0 ? endIdx - 1 : endIdx;

      const iFrom = Math.min(startIdx, effectiveEndIdx);
      const iTo   = Math.max(startIdx, effectiveEndIdx);

      const selectedEls = allTextEls
        .slice(iFrom, iTo + 1)
        .filter((el) => el.textContent?.trim());
      if (selectedEls.length === 0) { setSelection(null); return; }

      const pageRect  = pageEl.getBoundingClientRect();
      const pageWidth  = pageEl.offsetWidth;
      const pageHeight = pageEl.offsetHeight;

      // Converts an SVG canvas-pixel x → screen CSS x
      const scaleX      = pageWidth / canvas.width;
      const svgToScreenX = (svgX: number) => pageRect.left + svgX * scaleX;

      const firstEl = selectedEls[0];
      const lastEl  = selectedEls[selectedEls.length - 1];
      const isSingleEl = firstEl === lastEl;

      // Compute per-element rects, trimming the first/last to selected chars
      const clientRects = selectedEls.map((el) => {
        if (isSingleEl) {
          return charRangeRect(el, range.startOffset, range.endOffset, svgToScreenX);
        }
        if (el === firstEl) {
          return charRangeRect(el, range.startOffset, -1, svgToScreenX);
        }
        if (el === lastEl) {
          return charRangeRect(el, -1, range.endOffset || -1, svgToScreenX);
        }
        return el.getBoundingClientRect(); // middle elements: full width
      });

      // Build ScaledPosition (page-relative CSS pixels)
      const rects: Scaled[] = clientRects.map((r) => {
        const left = r.left - pageRect.left;
        const top  = r.top  - pageRect.top;
        return {
          x1: left,           y1: top,
          x2: left + r.width, y2: top + r.height,
          width: pageWidth, height: pageHeight, pageNumber,
        };
      });

      const bx1 = Math.min(...rects.map((r) => r.x1));
      const by1 = Math.min(...rects.map((r) => r.y1));
      const bx2 = Math.max(...rects.map((r) => r.x2));
      const by2 = Math.max(...rects.map((r) => r.y2));

      const position: ScaledPosition = {
        boundingRect: {
          x1: bx1, y1: by1, x2: bx2, y2: by2,
          width: pageWidth, height: pageHeight, pageNumber,
        },
        rects,
      };

      // Tooltip anchor: horizontally centred on selection, just above its top edge
      const screenLeft  = Math.min(...clientRects.map((r) => r.left));
      const screenRight = Math.max(...clientRects.map((r) => r.right));
      const screenTop   = Math.min(...clientRects.map((r) => r.top));

      setSelection({
        position,
        text,
        screenCenterX: (screenLeft + screenRight) / 2,
        screenTopY: screenTop,
      });
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      // Don't clear when clicking inside the selection tooltip itself
      const target = e.target as HTMLElement;
      if (target.closest(".selection-tooltip")) return;
      setSelection(null);
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  const clearSelection = useCallback(() => {
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  return { selection, clearSelection };
}
