"use client";

import { useState } from "react";
import Link from "next/link";
import type { PaperData } from "@/stores/useLibraryStore";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { CitationCopyButton } from "./CitationCopyButton";
import { UploadModal } from "./UploadModal";

type ReadStatus = "unread" | "reading" | "done";

function cycleStatus(current?: string): ReadStatus {
  if (!current || current === "unread") return "reading";
  if (current === "reading") return "done";
  return "unread";
}

function statusStyle(status?: string): React.CSSProperties {
  if (status === "reading") return { background: "#dbeafe", color: "#1d4ed8", border: "1px solid #bfdbfe" };
  if (status === "done") return { background: "#dcfce7", color: "#16a34a", border: "1px solid #bbf7d0" };
  return { background: "var(--surface-2)", color: "var(--text-3)", border: "1px solid var(--border)" };
}

function statusLabel(status?: string): string {
  if (status === "reading") return "Reading";
  if (status === "done") return "Done";
  return "Unread";
}

function truncateAuthors(authors: string, max = 3): string {
  const parts = authors.split(",").map((a) => a.trim()).filter(Boolean);
  if (parts.length <= max) return authors;
  return parts.slice(0, max).join(", ") + ", ...";
}


export function PaperCard({ paper, index, viewMode = "grid" }: { paper: PaperData; index: number; viewMode?: "grid" | "list" }) {
  const { updatePaper } = useLibraryStore();
  const [showEdit, setShowEdit] = useState(false);

  if (viewMode === "list") {
    return (
      <>
        {showEdit && <UploadModal mode="edit" initialPaper={paper} onClose={() => setShowEdit(false)} />}
        <div className="card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "16px" }}>

          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "8px" }}>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <Link href={`/workspace/${paper.id}`} className="hover:text-accent" style={{ fontWeight: 600, fontSize: "14.5px", color: "var(--text-1)", textDecoration: "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {paper.title}
              </Link>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", color: "var(--text-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                <span style={{ fontWeight: 500 }}>{truncateAuthors(paper.author)}</span>
                <span style={{ color: "var(--border-strong)" }}>|</span>
                <span style={{ color: "var(--text-3)" }}>{paper.venue}</span>
              </div>
            </div>

          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexShrink: 0 }}>
            {/* Status Badge */}
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); updatePaper(paper.id, { status: cycleStatus(paper.status) }); }}
              style={{ ...statusStyle(paper.status), fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "12px", cursor: "pointer", letterSpacing: "0.02em", whiteSpace: "nowrap" }}
              title="Click to change status"
            >
              {statusLabel(paper.status)}
            </button>
            <span className="badge" style={{ background: "var(--surface-2)", color: "var(--text-2)", fontSize: "13px", border: "1px solid var(--border)" }}>{paper.year}</span>
            <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0, borderLeft: "1px solid var(--border)", paddingLeft: "12px" }}>
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
      <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Title + status/year row */}
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
          <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0 }}>
            {/* Status Badge */}
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); updatePaper(paper.id, { status: cycleStatus(paper.status) }); }}
              style={{ ...statusStyle(paper.status), fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "12px", cursor: "pointer", letterSpacing: "0.02em", whiteSpace: "nowrap" }}
              title="Click to change status"
            >
              {statusLabel(paper.status)}
            </button>
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
          <p style={{ fontSize: "13px", color: "var(--text-2)", margin: 0 }}>{truncateAuthors(paper.author)}</p>
          <p style={{ fontSize: "12px", color: "var(--text-3)", margin: 0 }}>{paper.venue}</p>
          {paper.school && (
            <p style={{ fontSize: "12px", color: "var(--text-3)", margin: 0 }}>{paper.school}</p>
          )}
        </div>

        {/* Actions row */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px", flexWrap: "wrap", justifyContent: "flex-end" }}>

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
