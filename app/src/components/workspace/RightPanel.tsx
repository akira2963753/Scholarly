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
        <TabButton label="Notes" active={activeTab === "notes"} onClick={() => setActiveTab("notes")} />
        <TabButton label="AI Chat" active={activeTab === "chat"} onClick={() => setActiveTab("chat")} />

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

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "10px 12px 9px",
        fontSize: "13px",
        fontWeight: active ? 600 : 400,
        color: active ? "var(--text-1)" : "var(--text-3)",
        borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent",
        transition: "color 0.12s",
        flexShrink: 0,
        lineHeight: 1,
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.color = "var(--text-2)";
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.color = "var(--text-3)";
      }}
    >
      {label}
    </button>
  );
}
