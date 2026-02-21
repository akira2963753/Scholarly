"use client";

import { useState } from "react";
import type { Paper } from "@/types/paper";
import { formatIeeeCitation } from "@/types/paper";

export function CitationCopyButton({ paper, index = 1 }: { paper: Paper; index?: number }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const citation = formatIeeeCitation(paper, index);
    await navigator.clipboard.writeText(citation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="btn btn-ghost"
      style={{ fontSize: "12px", padding: "4px 10px" }}
      title={`Copy: ${formatIeeeCitation(paper, index)}`}
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Cite IEEE
        </>
      )}
    </button>
  );
}
