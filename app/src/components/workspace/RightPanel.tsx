"use client";

import { NotesPanel } from "./NotesPanel";
import { AIChatPanel } from "./AIChatPanel";
import type { Paper } from "@/types/paper";

type Tab = "notes" | "chat";

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
        ) : (
          <AIChatPanel paper={paper} />
        )}
      </div>
    </div>
  );
}
