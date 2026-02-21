import { LibraryHeader } from "@/components/library/LibraryHeader";
import { PaperGrid } from "@/components/library/PaperGrid";

export default function LibraryPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--surface-2)" }}>
      <LibraryHeader />
      <PaperGrid />
    </div>
  );
}
