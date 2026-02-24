"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

// Dynamically import the Allotment wrapper to avoid SSR DOM issues
const AllotmentLayout = dynamic(
  () => import("./AllotmentLayout").then((m) => m.AllotmentLayout),
  { ssr: false }
);

interface Props {
  paperId: string;
  left: ReactNode;
  right: ReactNode;
  notesOpen: boolean;
  onOpenNotes: () => void;
}

export function ResizableSplitPane({ paperId, left, right, notesOpen, onOpenNotes }: Props) {
  return (
    <div style={{ height: "100%", overflow: "hidden" }}>
      <AllotmentLayout paperId={paperId} left={left} right={right} notesOpen={notesOpen} onOpenNotes={onOpenNotes} />
    </div>
  );
}
