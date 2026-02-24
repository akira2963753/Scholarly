"use client";

import { memo, useEffect, useLayoutEffect, useRef } from "react";
import { type PDFDocumentProxy } from "pdfjs-dist";
import {
    PdfHighlighter,
    type PdfHighlighterUtils,
} from "react-pdf-highlighter-extended";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";

interface Props {
    pdfDocument: PDFDocumentProxy;
    paperId: string;
}

/**
 * Isolated, memoized wrapper around PdfHighlighter.
 *
 * WHY THIS EXISTS / THE SCROLL RESET BUG
 * ─────────────────────────────────────────────────────────────────────────────
 * PdfHighlighter (library) has this internal useLayoutEffect:
 *
 *   useLayoutEffect(() => {
 *     resizeObserverRef.current = new ResizeObserver(handleScaleValue);
 *     resizeObserverRef.current.observe(containerNodeRef.current); // ← fires immediately
 *     ...
 *   }, [selectionTip, highlights, ...]);   // ← re-runs on every highlights change
 *
 * When `highlights` changes, the ResizeObserver is recreated and `.observe()`
 * fires the callback synchronously, calling:
 *
 *   viewer.currentScaleValue = "page-width";   // ← PDF.js scrolls back to top!
 *
 * SOLUTION — save & restore scroll position with useLayoutEffect
 * ─────────────────────────────────────────────────────────────────────────────
 * React's commit phase runs layout effects child-first, parent-last:
 *
 *   1. cleanup of PdfHighlighterView's effect → saves scrollTop
 *   2. PdfHighlighter's effect runs → ResizeObserver fires → scroll resets
 *   3. PdfHighlighterView's effect runs → restores saved scrollTop  ✓
 *
 * Also: `utilsRef` is called directly during PdfHighlighter's render (not in
 * an effect), so we must never call setState inside it. We store utils in a
 * local ref and sync to Zustand via a separate useEffect.
 */
export const PdfHighlighterView = memo(function PdfHighlighterView({ pdfDocument, paperId }: Props) {
    const setPdfUtils = useWorkspaceStore((s) => s.setPdfUtils);

    // Holds the PdfHighlighterUtils — never written during render (no setState).
    const utilsRef = useRef<PdfHighlighterUtils | null>(null);

    // Saves the PDF scroll position across re-renders caused by highlight changes.
    const savedScrollTop = useRef<number | null>(null);

    // utilsRef callback: store in local ref only (safe during render).
    // PdfHighlighter calls this during its own render, so we must NOT call
    // setState (setPdfUtils) here — that would trigger the React warning
    // "Cannot update a component while rendering a different component".
    const handleUtilsRef = (utils: PdfHighlighterUtils) => {
        utilsRef.current = utils;
    };

    // Load initial scroll from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(`workspace_scroll_${paperId}`);
            if (saved) {
                savedScrollTop.current = parseFloat(saved);
            }
        } catch { }

        // Setup a listener to persist scroll on scroll end
        const container = utilsRef.current?.getViewer()?.container as HTMLElement | undefined;
        if (!container) return;

        let scrollTimeout: ReturnType<typeof setTimeout>;
        const onScroll = () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                if (container) {
                    localStorage.setItem(`workspace_scroll_${paperId}`, String(container.scrollTop));
                    savedScrollTop.current = container.scrollTop;
                }
            }, 500); // 500ms debounce
        };

        container.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            container.removeEventListener("scroll", onScroll);
            clearTimeout(scrollTimeout);
            // Save on unmount
            if (container) localStorage.setItem(`workspace_scroll_${paperId}`, String(container.scrollTop));
        };
    }, [paperId]);

    // Sync utils into Zustand store after the render cycle completes (safe timing).
    useEffect(() => {
        if (utilsRef.current) {
            setPdfUtils(utilsRef.current);
        }
    });

    // ── Scroll-position preservation ──────────────────────────────────────────
    // React commit order (child-first):
    //   cleanup (this) → PdfHighlighter effect → this effect
    //
    // The cleanup runs BEFORE PdfHighlighter's new layout effect, so we can
    // capture the current scrollTop there. After PdfHighlighter's effect has
    // reset the scroll, our effect body runs and restores it.
    useLayoutEffect(() => {
        // Step 3: restore the saved position (this runs after PdfHighlighter's effect)
        const viewer = utilsRef.current?.getViewer();
        const container = viewer?.container as HTMLElement | undefined;
        if (container && savedScrollTop.current !== null && savedScrollTop.current > 0) {
            container.scrollTop = savedScrollTop.current;
        }

        return () => {
            // Step 1: save current scroll before the next round of layout effects
            const viewer = utilsRef.current?.getViewer();
            const container = viewer?.container as HTMLElement | undefined;
            if (container) {
                savedScrollTop.current = container.scrollTop;
            }
        };
    }, []);

    return (
        <div
            style={{ height: "100%" }}
            onPointerDownCapture={(e) => {
                // Prevent PdfHighlighter from clearing text selection when user right-clicks to copy
                if (e.button === 2) {
                    e.stopPropagation();
                }
            }}
        >
            <PdfHighlighter
                pdfDocument={pdfDocument}
                highlights={[]}
                utilsRef={handleUtilsRef}
                pdfScaleValue="page-width"
                style={{ height: "100%", background: "var(--surface-2)" }}
                textSelectionColor="rgba(47, 109, 224, 0.15)"
            >
                {null}
            </PdfHighlighter>
        </div>
    );
});
