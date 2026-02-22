export interface Folder {
  id: string;
  name: string;
  createdAt: string;
}

export interface Paper {
  id: string;
  title: string;
  author: string;        // e.g. "A. Smith, B. Johnson"
  school: string | null;
  year: number;
  venue: string;
  tags: string[];        // user-defined type / topic tags
  filePath: string;      // e.g. "/uploads/uuid-filename.pdf"
  createdAt: string;     // ISO 8601
  updatedAt: string;
  folderId?: string | null;     // ID of the folder this paper belongs to
}

export function formatIeeeCitation(paper: Paper, index = 1): string {
  return `[${index}] ${paper.author}, "${paper.title}," ${paper.venue}, ${paper.year}.`;
}
