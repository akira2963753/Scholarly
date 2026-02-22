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

  if (viewMode === "list") {
    return (
      <>
        {showEdit && <UploadModal mode="edit" initialPaper={paper} onClose={() => setShowEdit(false)} />}
        <div className="card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "16px" }}>

          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
            <Link href={`/workspace/${paper.id}`} className="hover:text-accent" style={{ fontWeight: 600, fontSize: "14.5px", color: "var(--text-1)", textDecoration: "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {paper.title}
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", color: "var(--text-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              <span style={{ fontWeight: 500 }}>{paper.author}</span>
              <span style={{ color: "var(--border-strong)" }}>|</span>
              <span style={{ color: "var(--text-3)" }}>{paper.venue}</span>
            </div>
          </div>

          {(paper.tags ?? []).length > 0 && (
            <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
              {(paper.tags ?? []).slice(0, 2).map((tag) => (
                <span key={tag} style={{ padding: "3px 10px", borderRadius: "999px", background: "#eef2ff", color: "#3730a3", fontSize: "13px", fontWeight: 500 }}>
                  {tag.toUpperCase()}
                </span>
              ))}
              {(paper.tags ?? []).length > 2 && <span style={{ fontSize: "13px", color: "var(--text-3)", alignSelf: "center", fontWeight: 600 }}>+{paper.tags!.length - 2}</span>}
            </div>
          )}

          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
            <select
              value={paper.folderId || ""}
              onChange={(e) => updatePaper(paper.id, { folderId: e.target.value || null })}
              style={{ fontSize: "13px", padding: "4px 8px", borderRadius: "4px", border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text-3)", outline: "none", cursor: "pointer", maxWidth: "110px", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              <option value="">No Folder</option>
              {folders.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            <span className="badge" style={{ background: venueStyle.bg, color: venueStyle.text, fontSize: "13px" }}>{paper.year}</span>
          </div>

          <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0, borderLeft: "1px solid var(--border)", paddingLeft: "12px", marginLeft: "4px" }}>
            <Link href={`/workspace/${paper.id}`} className="btn btn-primary" style={{ fontSize: "14px", padding: "4px 10px" }}>Open</Link>
            <button className="btn btn-ghost" style={{ fontSize: "14px", padding: "4px 8px" }} onClick={() => setShowEdit(true)}>Edit</button>
            <CitationCopyButton paper={paper} index={index} />
          </div>

        </div>
      </>
    );
  }

  return (
    <>
      {showEdit && <UploadModal mode="edit" initialPaper={paper} onClose={() => setShowEdit(false)} />}
      <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
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
              style={{ background: venueStyle.bg, color: venueStyle.text, fontSize: "13px" }}
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

        {/* Tags */}
        {(paper.tags ?? []).length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
            {(paper.tags ?? []).map((tag) => (
              <span
                key={tag}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "3px 11px",
                  borderRadius: "999px",
                  background: "#eef2ff",
                  color: "#3730a3",
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                {tag.toUpperCase()}
              </span>
            ))}
          </div>
        )}

        {/* Actions row */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px", flexWrap: "wrap" }}>
          <Link href={`/workspace/${paper.id}`} className="btn btn-primary" style={{ fontSize: "14px", padding: "4px 12px" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Open
          </Link>
          <button className="btn btn-ghost" style={{ fontSize: "14px", padding: "4px 10px" }} onClick={() => setShowEdit(true)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit
          </button>
          <CitationCopyButton paper={paper} index={index} />
        </div>
      </div>
    </>
  );
}
