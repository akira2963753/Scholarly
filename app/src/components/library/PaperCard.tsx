"use client";

import { useState } from "react";
import Link from "next/link";
import type { PaperData } from "@/stores/useLibraryStore";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { CitationCopyButton } from "./CitationCopyButton";
import { UploadModal } from "./UploadModal";

const venueColors: Record<string, { bg: string; text: string }> = {
  IEEE: { bg: "#e8f0fe", text: "#1a56db" },
  ACL: { bg: "#fef3c7", text: "#92400e" },
  NeurIPS: { bg: "#f3e8ff", text: "#6b21a8" },
  ICML: { bg: "#dcfce7", text: "#14532d" },
};

function getVenueStyle(venue: string) {
  for (const [key, style] of Object.entries(venueColors)) {
    if (venue.includes(key)) return style;
  }
  return { bg: "#f1f0ec", text: "#6b6863" };
}

export function PaperCard({ paper, index, viewMode = "grid" }: { paper: PaperData; index: number; viewMode?: "grid" | "list" }) {
  const { folders, updatePaper } = useLibraryStore();
  const venueStyle = getVenueStyle(paper.venue);
  const [showEdit, setShowEdit] = useState(false);
  const [hovered, setHovered] = useState(false);

  if (viewMode === "list") {
    return (
      <>
        {showEdit && <UploadModal mode="edit" initialPaper={paper} onClose={() => setShowEdit(false)} />}
        <div className="card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "16px" }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>

          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "8px" }}>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <Link href={`/workspace/${paper.id}`} className="hover:text-accent" style={{ fontWeight: 600, fontSize: "14.5px", color: "var(--text-1)", textDecoration: "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {paper.title}
              </Link>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", color: "var(--text-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                <span style={{ fontWeight: 500 }}>{paper.author}</span>
                <span style={{ color: "var(--border-strong)" }}>|</span>
                <span style={{ color: "var(--text-3)" }}>{paper.venue}</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <select
                value={paper.folderId || ""}
                onChange={(e) => updatePaper(paper.id, { folderId: e.target.value || null })}
                style={{ fontSize: "12px", padding: "3px 8px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text-3)", outline: "none", cursor: "pointer", maxWidth: "120px", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              >
                <option value="">No Folder</option>
                {folders.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>

            </div>

          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexShrink: 0 }}>
            <span className="badge" style={{ background: "var(--surface-2)", color: "var(--text-2)", fontSize: "13px", border: "1px solid var(--border)" }}>{paper.year}</span>
            <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0, borderLeft: "1px solid var(--border)", paddingLeft: "12px" }}>
              {/* Star Button */}
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); updatePaper(paper.id, { starred: !paper.starred }); }}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "6px", borderRadius: "6px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", color: paper.starred ? "#f59e0b" : "var(--text-3)", opacity: paper.starred || hovered ? 1 : 0, transition: "opacity 0.15s, color 0.15s" }}
                title={paper.starred ? "Unstar" : "Star this paper"}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill={paper.starred ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
              {/* Open Button */}
              <Link
                href={`/workspace/${paper.id}`}
                className="btn btn-primary"
                style={{ padding: "6px", borderRadius: "6px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}
                title="Open Workspace"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </Link>

              {/* Edit Button */}
              <button
                className="btn btn-ghost"
                style={{ padding: "6px", borderRadius: "6px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}
                onClick={() => setShowEdit(true)}
                title="Edit Details"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>

              {/* Download Button */}
              <a
                href={`/api/uploads/${paper.id}.pdf`}
                download={`${paper.title}.pdf`}
                className="btn btn-ghost"
                style={{ padding: "6px", borderRadius: "6px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}
                title="Download PDF"
                onClick={(e) => e.stopPropagation()}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </a>

              {/* Cite Button */}
              <CitationCopyButton paper={paper} index={index} />
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {showEdit && <UploadModal mode="edit" initialPaper={paper} onClose={() => setShowEdit(false)} />}
      <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        {/* Title + venue badge row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
          <Link
            href={`/workspace/${paper.id}`}
            style={{
              fontWeight: 600,
              fontSize: "14.5px",
              color: "var(--text-1)",
              lineHeight: 1.4,
              textDecoration: "none",
              flex: 1,
            }}
            className="hover:text-accent"
          >
            {paper.title}
          </Link>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
            {/* Star Button */}
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); updatePaper(paper.id, { starred: !paper.starred }); }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center", color: paper.starred ? "#f59e0b" : "var(--text-3)", opacity: paper.starred || hovered ? 1 : 0, transition: "opacity 0.15s, color 0.15s" }}
              title={paper.starred ? "Unstar" : "Star this paper"}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill={paper.starred ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>
            <select
              value={paper.folderId || ""}
              onChange={(e) => updatePaper(paper.id, { folderId: e.target.value || null })}
              style={{
                fontSize: "13px",
                padding: "4px 8px",
                borderRadius: "4px",
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
                color: "var(--text-3)",
                outline: "none",
                cursor: "pointer",
                maxWidth: "100px",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}
            >
              <option value="">No Folder</option>
              {folders.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            <span
              className="badge"
              style={{ background: "var(--surface-2)", color: "var(--text-2)", fontSize: "13px", border: "1px solid var(--border)" }}
            >
              {paper.year}
            </span>
          </div>
        </div>

        {/* Author & venue */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <p style={{ fontSize: "13px", color: "var(--text-2)", margin: 0 }}>{paper.author}</p>
          <p style={{ fontSize: "12px", color: "var(--text-3)", margin: 0 }}>{paper.venue}</p>
          {paper.school && (
            <p style={{ fontSize: "12px", color: "var(--text-3)", margin: 0 }}>{paper.school}</p>
          )}
        </div>

        {/* Actions row */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px", flexWrap: "wrap", justifyContent: "flex-end" }}>

          {/* Open Button */}
          <Link
            href={`/workspace/${paper.id}`}
            className="btn btn-primary"
            style={{ padding: "6px", borderRadius: "6px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}
            title="Open Workspace"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </Link>

          {/* Edit Button */}
          <button
            className="btn btn-ghost"
            style={{ padding: "6px", borderRadius: "6px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setShowEdit(true)}
            title="Edit Details"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>

          {/* Download Button */}
          <a
            href={`/api/uploads/${paper.id}.pdf`}
            download={`${paper.title}.pdf`}
            className="btn btn-ghost"
            style={{ padding: "6px", borderRadius: "6px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}
            title="Download PDF"
            onClick={(e) => e.stopPropagation()}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </a>

          {/* Cite Button */}
          <CitationCopyButton paper={paper} index={index} />
        </div>
      </div>
    </>
  );
}
