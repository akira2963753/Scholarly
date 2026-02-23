export interface QuoteBlock {
  type: "quote";
  highlightId: string;
  quotedText: string;
  pageNumber: number;
}

export interface TextBlock {
  type: "text";
  content: string;
}

export type NoteBlock = {
  id: string;
  data: QuoteBlock | TextBlock;
};

export interface PaperNote {
  id: string;
  paperId: string;
  highlightId?: string | null;   // the highlight this note annotates (null for global note)
  blocks: NoteBlock[];
  createdAt: string;
  updatedAt: string;
}
