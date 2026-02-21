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
  highlightId: string;   // the highlight this note annotates
  blocks: NoteBlock[];
  createdAt: string;
  updatedAt: string;
}
