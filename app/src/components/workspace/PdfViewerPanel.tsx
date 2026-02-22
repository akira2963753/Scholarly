"use client";

import { useMemo } from "react";

import {
  PdfLoader,
} from "react-pdf-highlighter-extended";
import { PdfHighlighterView } from "./PdfHighlighterView";
import { PdfZoomToolbar } from "./PdfZoomToolbar";

interface Props {
  pdfUrl: string;
}

export function PdfViewerPanel({ pdfUrl }: Props) {
  // Memoize the document object so PdfLoader's internal useEffect([document])
  // sees a stable reference even when parent components re-render.
  // Without this, adding a highlight causes WorkspaceClient to re-render,
  // PdfViewerPanel to re-render, and PdfLoader to reload the PDF → scroll reset.
  const pdfDocument = useMemo(() => ({ url: pdfUrl }), [pdfUrl]);
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <PdfLoader
        document={pdfDocument}
        workerSrc="/pdf.worker.min.mjs"
        beforeLoad={(progress) => {
          const isParsing = progress.total > 0 && progress.loaded >= progress.total;
          const pct = progress.total > 0
            ? Math.min(Math.round((progress.loaded / progress.total) * 100), 100)
            : null;
          return (
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-3)",
                gap: "12px",
              }}
            >
              {isParsing ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5"
                  style={{ animation: "spin 1s linear infinite" }}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              )}
              <div style={{ fontSize: "13px" }}>
                {isParsing ? "Parsing document…" : pct !== null ? `Loading PDF… ${pct}%` : "Loading PDF…"}
              </div>
              {!isParsing && (
                <div style={{ width: "160px", height: "3px", background: "var(--border)", borderRadius: "2px", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      background: "var(--accent)",
                      borderRadius: "2px",
                      width: pct !== null ? `${pct}%` : "30%",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              )}
            </div>
          );
        }}
        errorMessage={(err) => (
          <div
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-3)",
              gap: "8px",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e03131" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p style={{ margin: 0, fontSize: "13px" }}>Failed to load PDF.</p>
            <p style={{ margin: 0, fontSize: "11px", color: "var(--text-3)" }}>{err.message}</p>
          </div>
        )}
      >
        {(pdfDocument) => (
          <div style={{ position: "relative", height: "100%", overflow: "hidden" }}>
            <PdfHighlighterView pdfDocument={pdfDocument} />
            <PdfZoomToolbar />
          </div>
        )}
      </PdfLoader>
    </div>
  );
}
