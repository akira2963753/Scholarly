import type { Paper } from "@/types/paper";
import type { PaperHighlight } from "@/types/highlight";
import type { PaperNote } from "@/types/note";

export const MOCK_PAPERS: Paper[] = [
  {
    id: "paper-001",
    title: "Efficient Post-Training Quantization for AI Accelerators",
    author: "A. Smith, B. Johnson",
    school: "MIT CSAIL",
    year: 2026,
    venue: "IEEE Journal of Solid-State Circuits",
    filePath: "/sample.pdf",
    createdAt: "2026-02-01T00:00:00Z",
    updatedAt: "2026-02-01T00:00:00Z",
  },
  {
    id: "paper-002",
    title: "Transformer Architectures for Low-Power Edge Inference",
    author: "C. Lee, D. Wang, E. Patel",
    school: "Stanford University",
    year: 2025,
    venue: "NeurIPS 2025",
    filePath: "/sample.pdf",
    createdAt: "2026-01-15T00:00:00Z",
    updatedAt: "2026-01-15T00:00:00Z",
  },
  {
    id: "paper-003",
    title: "Sparse Attention Mechanisms in Large Language Models",
    author: "F. Chen, G. Kim",
    school: null,
    year: 2025,
    venue: "ACL 2025",
    filePath: "/sample.pdf",
    createdAt: "2025-12-20T00:00:00Z",
    updatedAt: "2025-12-20T00:00:00Z",
  },
];

export const MOCK_HIGHLIGHTS: PaperHighlight[] = [];
export const MOCK_NOTES: PaperNote[] = [];
