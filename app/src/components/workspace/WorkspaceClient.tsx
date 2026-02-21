"use client";

import { useEffect } from "react";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { ResizableSplitPane } from "./ResizableSplitPane";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { PdfViewerPanel } from "./PdfViewerPanel";
import { NotesPanel } from "./NotesPanel";
import type { Paper } from "@/types/paper";
import type { PaperHighlight } from "@/types/highlight";
import type { PaperNote } from "@/types/note";

interface Props {
  paper: Paper;
  highlights: PaperHighlight[];
  notes: PaperNote[];
}

export function WorkspaceClient({ paper, highlights, notes }: Props) {
  const initWorkspace = useWorkspaceStore((s) => s.initWorkspace);

  // Initialise workspace state when paper changes
  useEffect(() => {
    initWorkspace(paper.id, highlights, notes);
  }, [paper.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <WorkspaceHeader paper={paper} />
      <div style={{ flex: 1, overflow: "hidden" }}>
        <ResizableSplitPane
          left={<PdfViewerPanel pdfUrl={paper.filePath} />}
          right={<NotesPanel />}
        />
      </div>
    </div>
  );
}
