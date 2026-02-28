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
 *
 * Timing: PDF.js adds spans to the DOM first, then sets transforms in a
 * separate layout pass. We use both:
 *   1. requestAnimationFrame delay after childList mutations (new pages)
 *   2. style attribute mutation observer (catches transform being set)
 */
export function useTextLayerFix() {
    useEffect(() => {
        const container = document.querySelector(".PdfHighlighter");
        if (!container) return;

        const fixSpan = (span: HTMLElement) => {
            const transform = span.style.transform;
            if (!transform) return;

            const match = transform.match(/scaleX\(([\d.]+)\)/);
            if (!match) return;

            const scaleX = parseFloat(match[1]);
            if (scaleX <= 1.0) return;

            const fixed = transform.replace(/scaleX\([\d.]+\)\s*/, "").trim();
            span.style.transform = fixed || "none";
        };

        const processTextLayer = (el: Element) => {
            el.querySelectorAll<HTMLElement>("span").forEach(fixSpan);
        };

        // Process any already-rendered text layers (with delay for transforms)
        requestAnimationFrame(() => {
            container.querySelectorAll(".textLayer").forEach(processTextLayer);
        });

        // Watch for both:
        // - childList: new pages/text layers being added
        // - attributes (style): PDF.js setting transforms on existing spans
        const observer = new MutationObserver((mutations) => {
            const textLayersToProcess = new Set<Element>();

            for (const mutation of mutations) {
                // New nodes added (new pages rendered)
                if (mutation.type === "childList") {
                    for (const node of mutation.addedNodes) {
                        if (!(node instanceof HTMLElement)) continue;
                        if (node.classList.contains("textLayer")) {
                            textLayersToProcess.add(node);
                        }
                        node.querySelectorAll?.(".textLayer").forEach((tl) =>
                            textLayersToProcess.add(tl)
                        );
                    }
                }

                // Style attribute changed on a span (PDF.js setting transform)
                if (mutation.type === "attributes" && mutation.target instanceof HTMLElement) {
                    const target = mutation.target;
                    // Only process spans inside textLayer
                    if (target.tagName === "SPAN" && target.closest(".textLayer")) {
                        fixSpan(target);
                    }
                }
            }

            // Process newly added text layers after PDF.js finishes layout
            if (textLayersToProcess.size > 0) {
                requestAnimationFrame(() => {
                    textLayersToProcess.forEach(processTextLayer);
                });
            }
        });

        observer.observe(container, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["style"],
        });

        return () => observer.disconnect();
    }, []);
}
