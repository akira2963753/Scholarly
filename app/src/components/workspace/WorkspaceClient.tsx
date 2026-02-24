"use client";

import { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { ResizableSplitPane } from "./ResizableSplitPane";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { PdfViewerPanel } from "./PdfViewerPanel";
import { RightPanel } from "./RightPanel";
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
  const setAnnotations = useWorkspaceStore((s) => s.setAnnotations);
  const [notesOpen, setNotesOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"notes" | "chat">("notes");

  // Initialise workspace state when paper changes
  useEffect(() => {
    initWorkspace(paper.id, highlights, notes);
  }, [paper.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync notes/highlights into workspace store after async fetchAnnotations completes
  useEffect(() => {
    setAnnotations(highlights, notes);
  }, [highlights, notes, setAnnotations]);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <WorkspaceHeader
        paper={paper}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        notesOpen={notesOpen}
        onToggleNotes={() => setNotesOpen(!notesOpen)}
      />
      <div style={{ flex: 1, overflow: "hidden" }}>
        <ResizableSplitPane
          paperId={paper.id}
          left={<PdfViewerPanel pdfUrl={paper.filePath} paperId={paper.id} />}
          right={<RightPanel paper={paper} activeTab={activeTab} onCollapse={() => setNotesOpen(false)} />}
          notesOpen={notesOpen}
          onOpenNotes={() => setNotesOpen(true)}
        />
      </div>
    </div>
  );
}
