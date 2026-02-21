"use client";

import { useState } from "react";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { PaperCard } from "./PaperCard";

export function PaperGrid() {
  const papers = useLibraryStore((s) => s.papers);
  const [search, setSearch] = useState("");

  const filtered = papers.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.author.toLowerCase().includes(q) ||
      p.venue.toLowerCase().includes(q)
    );
  });

  return (
    <main style={{ padding: "28px 32px", maxWidth: "1280px", margin: "0 auto" }}>
      {/* Stats + Search */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            Library
          </h1>
          <p style={{ margin: "2px 0 0", fontSize: "13px", color: "var(--text-3)" }}>
            {papers.length} paper{papers.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Search */}
        <div style={{ position: "relative", maxWidth: "320px", flex: 1 }}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-3)"
            strokeWidth="2"
            style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="input"
            style={{ paddingLeft: "32px" }}
            type="text"
            placeholder="Search by title, author, venue…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-3)" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: "12px", opacity: 0.4 }}>
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          <p style={{ fontSize: "14px", margin: 0 }}>
            {search ? "No papers match your search." : 'No papers yet. Click "Add Paper" to get started.'}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "16px",
          }}
        >
          {filtered.map((paper, i) => (
            <PaperCard key={paper.id} paper={paper} index={i + 1} />
          ))}
        </div>
      )}
    </main>
  );
}
