"use client";

import { useEffect, useRef, useState } from "react";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";

const SCALE_STEPS = [0.5, 0.67, 0.75, 0.8, 0.9, 1.0, 1.1, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0];
const MIN_SCALE = SCALE_STEPS[0];
const MAX_SCALE = SCALE_STEPS[SCALE_STEPS.length - 1];

function snapToStep(scale: number, direction: "up" | "down"): number {
    if (direction === "up") {
        return SCALE_STEPS.find((s) => s > scale + 0.001) ?? MAX_SCALE;
    } else {
        return [...SCALE_STEPS].reverse().find((s) => s < scale - 0.001) ?? MIN_SCALE;
    }
}

export function PdfZoomToolbar({ paperId }: { paperId: string }) {
    const pdfUtils = useWorkspaceStore((s) => s.pdfUtils);
    const [scale, setScale] = useState<number | null>(null);

    // Restore saved scale on mount
    useEffect(() => {
        if (!pdfUtils) return;
        const viewer = pdfUtils.getViewer();
        if (!viewer) return;

        try {
            const savedScale = localStorage.getItem(`workspace_zoom_${paperId}`);
            if (savedScale && savedScale !== "page-width") {
                const num = parseFloat(savedScale);
                if (!isNaN(num) && num >= MIN_SCALE && num <= MAX_SCALE) {
                    viewer.currentScaleValue = savedScale;
                    setScale(num);
                }
            }
        } catch { }
    }, [pdfUtils, paperId]);

    // Intercept trackpad pinch-to-zoom (Ctrl+wheel) and redirect to PDF.js
    // so pages are re-rendered at the correct resolution instead of blurry CSS scaling.
    useEffect(() => {
        if (!pdfUtils) return;
        const viewer = pdfUtils.getViewer();
        const container = viewer?.container as HTMLElement | undefined;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            if (!e.ctrlKey) return;
            e.preventDefault();

            const currentViewer = pdfUtils.getViewer();
            if (!currentViewer) return;

            const currentScale = currentViewer.currentScale;
            // deltaMode 1 = line mode (mouse wheel); convert to pixels
            const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
            // Exponential scaling: negative delta = zoom in, positive = zoom out
            const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, currentScale * Math.pow(0.999, delta)));

            currentViewer.currentScaleValue = String(newScale);
            setScale(newScale);
            localStorage.setItem(`workspace_zoom_${paperId}`, String(newScale));
        };

        container.addEventListener("wheel", handleWheel, { passive: false });
        return () => container.removeEventListener("wheel", handleWheel);
    }, [pdfUtils, paperId]);

    // Poll the viewer's current scale so the label stays accurate.
    useEffect(() => {
        if (!pdfUtils) return;
        const tick = () => {
            const viewer = pdfUtils.getViewer();
            if (viewer) setScale(viewer.currentScale);
        };
        tick();
        const id = setInterval(tick, 500);
        return () => clearInterval(id);
    }, [pdfUtils]);

    const setViewerScale = (newScale: number) => {
        const viewer = pdfUtils?.getViewer();
        if (!viewer) return;
        const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
        viewer.currentScaleValue = String(clamped);
        setScale(clamped);
        localStorage.setItem(`workspace_zoom_${paperId}`, String(clamped));
    };

    const zoomIn = () => scale !== null && setViewerScale(snapToStep(scale, "up"));
    const zoomOut = () => scale !== null && setViewerScale(snapToStep(scale, "down"));
    const reset = () => {
        pdfUtils?.getViewer() && (pdfUtils!.getViewer()!.currentScaleValue = "page-width");
        setScale(null);
        localStorage.setItem(`workspace_zoom_${paperId}`, "page-width");
    };

    const pct = scale !== null ? Math.round(scale * 100) : null;
    const atMin = scale !== null && scale <= MIN_SCALE;
    const atMax = scale !== null && scale >= MAX_SCALE;

    if (!pdfUtils) return null;

    return (
        <div
            style={{
                position: "absolute",
                bottom: "20px",
                right: "20px",
                display: "flex",
                alignItems: "center",
                gap: "2px",
                background: "var(--surface)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)",
                padding: "3px",
                zIndex: 10,
                userSelect: "none",
            }}
        >
            {/* Zoom Out */}
            <ZoomBtn onClick={zoomOut} disabled={atMin} title="Zoom out (−)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="15.8" y2="15.8" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
            </ZoomBtn>

            {/* Scale Label — click to reset to page-width */}
            <button
                onClick={reset}
                title="Reset to page width"
                style={{
                    minWidth: "48px",
                    height: "28px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--text-1)",
                    background: "transparent",
                    border: "none",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    padding: "0 4px",
                    transition: "background 0.12s",
                    fontVariantNumeric: "tabular-nums",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-3)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
                {pct !== null ? `${pct}%` : "—"}
            </button>

            {/* Zoom In */}
            <ZoomBtn onClick={zoomIn} disabled={atMax} title="Zoom in (+)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="15.8" y2="15.8" />
                    <line x1="11" y1="8" x2="11" y2="14" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
            </ZoomBtn>
        </div>
    );
}

/* ─── Small button used for + / - ─────────────────────────── */
function ZoomBtn({
    onClick,
    disabled,
    title,
    children,
}: {
    onClick: () => void;
    disabled: boolean;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            style={{
                width: "28px",
                height: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: "none",
                borderRadius: "var(--radius-sm)",
                cursor: disabled ? "default" : "pointer",
                color: disabled ? "var(--text-3)" : "var(--text-1)",
                transition: "background 0.12s, color 0.12s",
                padding: 0,
            }}
            onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = "var(--surface-3)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
            {children}
        </button>
    );
}
