"use client";

import { Allotment } from "allotment";
import "allotment/dist/style.css";
import type { ReactNode } from "react";

interface Props {
  paperId: string;
  left: ReactNode;
  right: ReactNode;
  notesOpen: boolean;
  onOpenNotes: () => void;
}

export function AllotmentLayout({ paperId: _paperId, left, right, notesOpen, onOpenNotes }: Props) {
  return (
    <Allotment defaultSizes={[60, 40]} separator={false} className="workspace-split">
      <Allotment.Pane minSize={360}>
        <div style={{ height: "100%", overflow: "hidden", background: "var(--surface-2)", position: "relative" }}>
          {left}
          {/* Floating button to reopen notes panel when collapsed */}
          {!notesOpen && (
            <button
              onClick={onOpenNotes}
              title="Open Notes"
              style={{
                position: "absolute",
                top: "50%",
                right: "0",
                transform: "translateY(-50%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "20px",
                height: "48px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRight: "none",
                borderRadius: "6px 0 0 6px",
                cursor: "pointer",
                color: "var(--text-3)",
                padding: 0,
                transition: "background 0.15s, color 0.15s",
                zIndex: 10,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-3)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-1)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--surface)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-3)";
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </div>
      </Allotment.Pane>
      <Allotment.Pane minSize={280} visible={notesOpen}>
        <div style={{
          height: "100%",
          overflow: "hidden",
          background: "var(--surface)",
          borderLeft: "1px solid var(--border)",
        }}>
          {right}
        </div>
      </Allotment.Pane>
    </Allotment>
  );
}
