"use client";

import Link from "next/link";
import type { Paper } from "@/types/paper";



export function WorkspaceHeader({ paper }: { paper: Paper }) {
  return (
    <header
      style={{
        height: "52px",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: "16px",
        flexShrink: 0,
      }}
    >
      {/* Back link */}
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          color: "var(--text-3)",
          textDecoration: "none",
          fontSize: "13px",
          flexShrink: 0,
          transition: "color 0.15s",
        }}
        className="hover:text-primary"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Library
      </Link>

      <span style={{ color: "var(--border)", flexShrink: 0 }}>·</span>

      {/* Paper title */}
      <p
        style={{
          flex: 1,
          margin: 0,
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--text-1)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={paper.title}
      >
        {paper.title}
      </p>


    </header>
  );
}
