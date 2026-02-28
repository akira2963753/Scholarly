"use client";

import { useEffect } from "react";

/**
 * Fixes text selection bleeding in multi-column PDFs.
 *
 * PDF.js applies `scaleX(S)` transforms on text layer spans to stretch
 * transparent text to match PDF glyph widths. When S > 1, the span's
 * visual width (and thus the browser's ::selection highlight) extends
 * beyond the actual rendered text — bleeding into adjacent columns.
 *
 * This hook observes the text layer and caps scaleX at 1.0 for each span.
 * Since the text is invisible (color: transparent), the slight narrowing
 * is imperceptible, but it prevents selection highlights from overflowing.
 */
export function useTextLayerFix() {
    useEffect(() => {
        const container = document.querySelector(".PdfHighlighter");
        if (!container) return;

        const fixSpan = (span: HTMLElement) => {
            const transform = span.style.transform;
            if (!transform) return;

            // Match scaleX(value) — PDF.js uses this to stretch text
            const match = transform.match(/scaleX\(([\d.]+)\)/);
            if (!match) return;

            const scaleX = parseFloat(match[1]);
            // Only fix when text is being stretched (scaleX > 1).
            // When compressed (scaleX < 1), leave as-is — it won't bleed.
            if (scaleX <= 1.0) return;

            // Remove the scaleX part, keep other transforms (rotation, minFontSize scale, etc.)
            const fixed = transform.replace(/scaleX\([\d.]+\)\s*/, "").trim();
            span.style.transform = fixed || "none";
        };

        const processTextLayer = (el: Element) => {
            el.querySelectorAll<HTMLElement>("span").forEach(fixSpan);
        };

        // Process any already-rendered text layers
        container.querySelectorAll(".textLayer").forEach(processTextLayer);

        // Watch for new pages being rendered (PDF.js renders pages on-demand as user scrolls)
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (!(node instanceof HTMLElement)) continue;
                    if (node.classList.contains("textLayer")) {
                        processTextLayer(node);
                    }
                    // Also check children — pages wrap the textLayer
                    node.querySelectorAll?.(".textLayer").forEach(processTextLayer);
                }
            }
        });

        observer.observe(container, { childList: true, subtree: true });
        return () => observer.disconnect();
    }, []);
}
