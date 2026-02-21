"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { WorkspaceClient } from "./WorkspaceClient";

export function WorkspaceClientPage({ paperId }: { paperId: string }) {
  const router = useRouter();
  const paper = useLibraryStore((s) => s.papers.find((p) => p.id === paperId));

  useEffect(() => {
    if (paper === undefined) {
      // Paper not in store → go back to library
      // (give store a moment to hydrate from localStorage first)
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

  return <WorkspaceClient paper={paper} highlights={[]} notes={[]} />;
}
