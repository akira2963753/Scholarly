"use client";

import { NotesPanel } from "./NotesPanel";
import { AIChatPanel } from "./AIChatPanel";
import { ReferencesPanel } from "./ReferencesPanel";
import type { Paper } from "@/types/paper";

type Tab = "notes" | "chat" | "references";

interface Props {
  paper: Paper;
  activeTab: Tab;
  onCollapse: () => void;
}

export function RightPanel({ paper, activeTab, onCollapse }: Props) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--surface)" }}>
      {/* Panel content */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {activeTab === "notes" ? (
          <NotesPanel />
        ) : activeTab === "references" ? (
          <ReferencesPanel paper={paper} />
        ) : (
          <AIChatPanel paper={paper} />
        )}
      </div>
    </div>
  );
}
