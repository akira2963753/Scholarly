"use client";

import { useState } from "react";
import Link from "next/link";
import type { Paper } from "@/types/paper";
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

export function PaperCard({ paper, index }: { paper: Paper; index: number }) {
  const venueStyle = getVenueStyle(paper.venue);
  const [showEdit, setShowEdit] = useState(false);

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
        <span
          className="badge"
          style={{ background: venueStyle.bg, color: venueStyle.text, flexShrink: 0 }}
        >
          {paper.year}
        </span>
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
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px", flexWrap: "wrap" }}>
        <Link href={`/workspace/${paper.id}`} className="btn btn-primary" style={{ fontSize: "12px", padding: "4px 12px" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Open
        </Link>
        <button className="btn btn-ghost" style={{ fontSize: "12px", padding: "4px 10px" }} onClick={() => setShowEdit(true)}>
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
