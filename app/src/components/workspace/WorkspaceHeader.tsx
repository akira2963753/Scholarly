"use client";

import Link from "next/link";
import type { Paper } from "@/types/paper";

type Tab = "notes" | "chat";

interface Props {
  paper: Paper;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  notesOpen: boolean;
  onToggleNotes: () => void;
}

export function WorkspaceHeader({ paper, activeTab, setActiveTab, notesOpen, onToggleNotes }: Props) {
  return (
    <header
      style={{
        height: "52px",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        gap: "16px",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, minWidth: 0 }}>
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
      </div>

      {/* Tabs and Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
          <TabButton
            label="Notes"
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>}
            active={activeTab === "notes" && notesOpen}
            onClick={() => {
              setActiveTab("notes");
              if (!notesOpen) onToggleNotes();
            }}
          />
          <TabButton
            label="AI Chat"
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>}
            active={activeTab === "chat" && notesOpen}
            onClick={() => {
              setActiveTab("chat");
              if (!notesOpen) onToggleNotes();
            }}
          />
        </div>

        <div style={{ width: "1px", height: "20px", background: "var(--border)" }} />

        {/* Collapse button */}
        <button
          onClick={onToggleNotes}
          title={notesOpen ? "Close panel" : "Open panel"}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            cursor: "pointer",
            color: notesOpen ? "var(--accent)" : "var(--text-3)",
            padding: 0,
            transition: "all 0.15s",
          }}
          className="hover:bg-surface-2 hover:text-primary"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: notesOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>
    </header>
  );
}

function TabButton({ label, icon, active, onClick }: { label: string; icon: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? "var(--surface-2)" : "transparent",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        padding: "6px 12px",
        fontSize: "13px",
        fontWeight: active ? 600 : 500,
        color: active ? "var(--text-1)" : "var(--text-3)",
        transition: "all 0.15s",
        display: "flex",
        alignItems: "center",
        gap: "6px",
      }}
      className="hover:text-primary hover:bg-surface-2"
    >
      {icon}
      {label}
    </button>
  );
}
