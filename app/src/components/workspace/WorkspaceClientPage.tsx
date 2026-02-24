"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { useAnnotationStore, EMPTY_HIGHLIGHTS, EMPTY_NOTES } from "@/stores/useAnnotationStore";
import { WorkspaceClient } from "./WorkspaceClient";

export function WorkspaceClientPage({ paperId }: { paperId: string }) {
  const router = useRouter();
  const paper = useLibraryStore((s) => s.papers.find((p) => p.id === paperId));

  // Direct selectors using stable empty-array fallbacks so Zustand's
  // Object.is comparison never triggers an infinite re-render loop.
  const highlights = useAnnotationStore((s) => s.byPaper[paperId]?.highlights ?? EMPTY_HIGHLIGHTS);
  const notes = useAnnotationStore((s) => s.byPaper[paperId]?.notes ?? EMPTY_NOTES);
  const fetchAnnotations = useAnnotationStore((s) => s.fetchAnnotations);

  useEffect(() => {
    fetchAnnotations(paperId);
  }, [paperId, fetchAnnotations]);

  useEffect(() => {
    if (paper === undefined) {
      const timer = setTimeout(() => {
        if (!useLibraryStore.getState().papers.find((p) => p.id === paperId)) {
          router.replace("/");
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [paper, paperId, router]);

  if (!paper) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-3)",
          fontSize: "14px",
        }}
      >
        Loading…
      </div>
    );
  }

  return <WorkspaceClient paper={paper} highlights={highlights} notes={notes} />;
}
