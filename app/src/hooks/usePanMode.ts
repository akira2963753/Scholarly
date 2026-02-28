"use client";

import { useEffect, useRef } from "react";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";

/**
 * Enables drag-to-scroll (pan) on the PDF viewer container when
 * pdfInteractionMode is "pan". Left-click drag scrolls the container;
 * releasing or switching back to "select" mode restores normal behavior.
 */
export function usePanMode() {
    const mode = useWorkspaceStore((s) => s.pdfInteractionMode);

    const isDragging = useRef(false);
    const startX = useRef(0);
    const startY = useRef(0);
    const scrollLeftStart = useRef(0);
    const scrollTopStart = useRef(0);

    useEffect(() => {
        if (mode !== "pan") return;

        // Find the scrollable .PdfHighlighter container directly from the DOM.
        // This avoids depending on a potentially stale pdfUtils reference.
        const container = document.querySelector(".PdfHighlighter") as HTMLElement | null;
        if (!container) return;

        container.style.cursor = "grab";

        const onMouseDown = (e: MouseEvent) => {
            if (e.button !== 0) return; // left-click only
            isDragging.current = true;
            startX.current = e.clientX;
            startY.current = e.clientY;
            scrollLeftStart.current = container.scrollLeft;
            scrollTopStart.current = container.scrollTop;
            container.style.cursor = "grabbing";
            container.style.userSelect = "none";
            e.preventDefault(); // prevent text selection
        };

        const onMouseMove = (e: MouseEvent) => {
            if (!isDragging.current) return;
            const dx = e.clientX - startX.current;
            const dy = e.clientY - startY.current;
            container.scrollLeft = scrollLeftStart.current - dx;
            container.scrollTop = scrollTopStart.current - dy;
        };

        const onMouseUp = () => {
            if (!isDragging.current) return;
            isDragging.current = false;
            container.style.cursor = "grab";
            container.style.userSelect = "";
        };

        // capture phase so it fires before the library's text selection handlers
        container.addEventListener("mousedown", onMouseDown, { capture: true });
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);

        return () => {
            container.removeEventListener("mousedown", onMouseDown, { capture: true });
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
            container.style.cursor = "";
            container.style.userSelect = "";
            isDragging.current = false;
        };
    }, [mode]);
}
