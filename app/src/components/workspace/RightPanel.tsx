"use client";

import { useState } from "react";
import { NotesPanel } from "./NotesPanel";
import { AIChatPanel } from "./AIChatPanel";
import type { Paper } from "@/types/paper";

type Tab = "notes" | "chat";

interface Props {
  paper: Paper;
  onCollapse: () => void;
}

export function RightPanel({ paper, onCollapse }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("notes");

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--surface)" }}>
      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          borderBottom: "1px solid var(--border)",
          padding: "0 4px",
          flexShrink: 0,
          gap: "2px",
        }}
      >
        <TabButton
          label="Notes"
          icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>}
          active={activeTab === "notes"}
          onClick={() => setActiveTab("notes")}
        />
        <TabButton
          label="AI Chat"
          icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>}
          active={activeTab === "chat"}
          onClick={() => setActiveTab("chat")}
        />

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Collapse button */}
        <button
          onClick={onCollapse}
          title="Close panel"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "28px",
            height: "28px",
            background: "transparent",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            color: "var(--text-3)",
            padding: 0,
            transition: "background 0.15s, color 0.15s",
            flexShrink: 0,
            margin: "4px 2px",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-3)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--text-1)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--text-3)";
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      {/* Panel content */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {activeTab === "notes" ? (
          <NotesPanel />
        ) : (
          <AIChatPanel paper={paper} />
        )}
      </div>
    </div>
  );
}

function TabButton({ label, icon, active, onClick }: { label: string; icon: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "10px 12px 9px",
        fontSize: "14.5px",
        fontWeight: active ? 600 : 400,
        color: active ? "var(--text-1)" : "var(--text-3)",
        borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent",
        transition: "color 0.12s",
        flexShrink: 0,
        lineHeight: 1,
        display: "flex",
        alignItems: "center",
        gap: "6px",
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.color = "var(--text-2)";
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.color = "var(--text-3)";
      }}
    >
      {icon}
      {label}
    </button>
  );
}
