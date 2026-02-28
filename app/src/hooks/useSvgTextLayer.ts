"use client";

import { useEffect } from "react";
import { type PDFDocumentProxy } from "pdfjs-dist";

// Multiply two 6-element PDF matrices: m1 * m2
function matMul(m1: number[], m2: number[]): number[] {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ];
}

/**
 * SVG-based text selection layer.
 *
 * WHY THIS EXISTS
 * ───────────────────────────────────────────────────────────────────────────
 * PDF.js renders text as invisible <span> elements and applies scaleX()
 * transforms to stretch each glyph to its exact PDF width.  When scaleX > 1
 * the browser's ::selection highlight bleeds beyond the visual column
 * boundary.
 *
 * This hook bypasses the PDF.js text layer entirely for pointer/selection
 * purposes.  For every rendered page it:
 *   1. Reads the text items via page.getTextContent()
 *   2. Builds a transparent SVG overlay where each item is a <text> element
 *      positioned using the exact PDF → viewport transform matrix
 *   3. Uses SVG's native `textLength` attribute to constrain the selection
 *      area to the actual glyph width — no scaleX overflow possible
 *   4. Disables pointer events on the original text layer so the SVG
 *      receives all mouse/touch events
 *
 * The visual rendering (canvas) is untouched.
 */
export function useSvgTextLayer(pdfDocument: PDFDocumentProxy | null) {
  useEffect(() => {
    if (!pdfDocument) return;

    const container = document.querySelector(".PdfHighlighter");
    if (!container) return;

    // Track the canvas.width at the time each page's SVG was last built.
    // Using width (not a boolean) lets us detect when PDF.js re-renders a page
    // at a different scale (e.g. when a side panel opens/closes and the viewer
    // resizes), so the SVG overlay is rebuilt to match the new dimensions.
    const processedPages = new WeakMap<Element, number>();

    const buildSvgForPage = async (pageEl: HTMLElement) => {
      const textLayerEl = pageEl.querySelector<HTMLElement>(".textLayer");
      if (!textLayerEl) return;

      // Only proceed once PDF.js has populated the text layer
      if (textLayerEl.querySelectorAll("span").length === 0) return;

      const canvas = pageEl.querySelector<HTMLCanvasElement>("canvas");
      if (!canvas || canvas.width === 0) return;

      // Skip if already built for this exact canvas width (prevents redundant
      // rebuilds on unrelated DOM mutations while still catching resizes).
      if (processedPages.get(pageEl) === canvas.width) return;

      const pageNum = parseInt(pageEl.dataset.pageNumber ?? "0", 10);
      if (!pageNum) return;

      // Mark immediately (with current width) to prevent concurrent builds
      processedPages.set(pageEl, canvas.width);

      try {
        const page = await pdfDocument.getPage(pageNum);
        const scale = canvas.width / page.getViewport({ scale: 1 }).width;
        const viewport = page.getViewport({ scale });

        const textContent = await page.getTextContent();

        // Remove stale overlay if the page was re-rendered
        pageEl.querySelector(".svg-text-overlay")?.remove();

        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.classList.add("svg-text-overlay");
        // viewBox matches the physical canvas pixel dimensions
        svg.setAttribute("viewBox", `0 0 ${canvas.width} ${canvas.height}`);
        Object.assign(svg.style, {
          position: "absolute",
          inset: "0",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          pointerEvents: "all",
          // Sit above the canvas wrapper but below the highlight layer
          zIndex: "3",
        } as Partial<CSSStyleDeclaration>);

        for (const item of textContent.items) {
          // Skip TextMarkedContent markers (they have no `str` field)
          if (!("str" in item) || !item.str) continue;

          // Map PDF content-space coordinates → viewport pixel coordinates
          const tx = matMul(viewport.transform, item.transform);
          const x = tx[4];
          const y = tx[5];
          // Font height in viewport pixels (absolute value handles y-axis flip)
          const fontSize = Math.abs(tx[3]);
          if (fontSize < 1) continue;

          const textEl = document.createElementNS(svgNS, "text");
          textEl.setAttribute("x", String(x));
          textEl.setAttribute("y", String(y));
          textEl.setAttribute("font-size", String(fontSize));

          // ── textLength: the key advantage over PDF.js spans ──────────────
          // SVG's textLength constrains the selection area to the actual glyph
          // width — the browser will never select beyond this boundary, solving
          // the column-bleed problem that scaleX() caused in HTML text layers.
          if (item.width > 0) {
            const textWidthPx = item.width * scale;
            textEl.setAttribute("textLength", String(textWidthPx));
            textEl.setAttribute("lengthAdjust", "spacingAndGlyphs");
          }

          textEl.style.fill = "transparent";
          textEl.style.cursor = "text";
          textEl.textContent = item.str;
          svg.appendChild(textEl);
        }

        // Neutralise the original text layer so it doesn't compete for events
        textLayerEl.style.pointerEvents = "none";
        textLayerEl.style.userSelect = "none";

        pageEl.appendChild(svg);
      } catch (err) {
        console.warn("[useSvgTextLayer] Page", pageNum, "failed:", err);
        // Allow retry on next mutation by clearing the cached width
        processedPages.delete(pageEl);
      }
    };

    const tryProcessAll = () => {
      container
        .querySelectorAll<HTMLElement>(".page[data-page-number]")
        .forEach(buildSvgForPage);
    };

    requestAnimationFrame(tryProcessAll);

    // Watch for newly rendered pages (lazy rendering on scroll) and for
    // text-layer style mutations (PDF.js setting transforms on spans)
    const observer = new MutationObserver(() => {
      requestAnimationFrame(tryProcessAll);
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style"],
    });

    return () => {
      observer.disconnect();
      document.querySelectorAll(".svg-text-overlay").forEach((el) => el.remove());
      document.querySelectorAll<HTMLElement>(".textLayer").forEach((el) => {
        el.style.pointerEvents = "";
        el.style.userSelect = "";
      });
    };
  }, [pdfDocument]);
}
