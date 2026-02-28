"use client";

import { useEffect, useState, useCallback } from "react";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";

const SECTIONS = [
  { id: "introduction", title: "Introduction / Background", icon: "📖" },
  { id: "contribution", title: "Contribution", icon: "💡" },
  { id: "experiment", title: "Experiment Results", icon: "🔬" },
  { id: "summary", title: "Summary", icon: "📝" },
];

function parseNoteToSections(rawText: string) {
  const result: Record<string, string> = { introduction: "", contribution: "", experiment: "", summary: "" };
  let currentKey = "introduction";

  const lines = rawText.split("\n");
  const buffer: string[] = [];

  for (const line of lines) {
    const match = SECTIONS.find(s => line.trim() === `### ${s.title}`);
    if (match) {
      if (buffer.length > 0) result[currentKey] = buffer.join("\n").trim();
      buffer.length = 0;
      currentKey = match.id;
    } else {
      buffer.push(line);
    }
  }
  if (buffer.length > 0) result[currentKey] = buffer.join("\n").trim();

  // Clean up initial preamble if empty
  if (!rawText.includes("### Introduction / Background") && result.introduction === rawText.trim()) {
    // Legacy mode: everything is in summary if no headers exist
  }

  return result;
}

function stringifySections(sections: Record<string, string>) {
  return SECTIONS.map(s => `### ${s.title}\n${sections[s.id] || ""}`).join("\n\n");
}

export function NotesPanel() {
  const notes = useWorkspaceStore((s) => s.notes);
  const addNote = useWorkspaceStore((s) => s.addNote);
  const updateNoteContent = useWorkspaceStore((s) => s.updateNoteContent);
  const paperId = useWorkspaceStore((s) => s.paperId);

  const globalNote = notes.find((n) => !n.highlightId) || notes[0];
  const textBlock = globalNote?.blocks.find((b) => b.data.type === "text");
  const extractedText = textBlock && textBlock.data.type === "text" ? textBlock.data.content : "";

  const [sections, setSections] = useState(() => parseNoteToSections(extractedText));
  const [expandedId, setExpandedId] = useState<string>("");

  useEffect(() => {
    setSections(parseNoteToSections(extractedText));
  }, [extractedText]);

  const handleBlur = useCallback(() => {
    if (!paperId) return;

    const newRawText = stringifySections(sections);
    console.log("NotesPanel handleBlur triggered:", {
      newRawText,
      extractedText,
      hasGlobalNote: !!globalNote
    });

    // Prevent useless saves
    if (newRawText === extractedText) {
      console.log("NotesPanel: Content unchanged, skipping save.");
      return;
    }
    if (!newRawText.replace(/###.*?\n/g, "").trim() && !extractedText) {
      console.log("NotesPanel: Content is essentially empty, skipping save.");
      return;
    }

    if (globalNote) {
      console.log("NotesPanel: Updating existing note", globalNote.id);
      updateNoteContent(globalNote.id, newRawText);
    } else {
      console.log("NotesPanel: Adding new note for paper", paperId);
      addNote({
        id: crypto.randomUUID(),
        paperId,
        highlightId: null,
        blocks: [{ id: crypto.randomUUID(), data: { type: "text", content: newRawText } }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }, [paperId, globalNote, sections, extractedText, updateNoteContent, addNote]);

  const updateSection = (id: string, text: string) => {
    setSections(prev => ({ ...prev, [id]: text }));
  };

  // Helper: switch to the card view or toggle back to list view
  const toggleExpanded = (id: string) => {
    setExpandedId(prev => prev === id ? "" : id);
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--surface)", padding: "16px", gap: "10px", overflowY: "auto" }}>
      {/* 
        If nothing is expanded, show all headers. 
        If something IS expanded, show ONLY that card, and make it flex: 1
      */}
      {SECTIONS.map((sec) => {
        const isExpanded = expandedId === sec.id;
        const hasContent = sections[sec.id].trim().length > 0;

        // Peak focus mode: If a card is expanded, hide all the other cards completely
        if (expandedId && !isExpanded) return null;

        return (
          <div
            key={sec.id}
            style={{
              background: "var(--surface)",
              border: isExpanded ? "1px solid var(--accent)" : "1px solid var(--border)",
              borderRadius: "10px",
              overflow: "hidden",
              transition: "all 0.2s ease",
              boxShadow: isExpanded ? "0 4px 12px rgba(0,0,0,0.05)" : "none",
              // Critical: Let the focused card fill all available vertical space!
              display: "flex",
              flexDirection: "column",
              flex: isExpanded ? 1 : "none",
            }}
          >
            {/* Header / Trigger */}
            <div
              onClick={() => toggleExpanded(sec.id)}
              style={{
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
                background: isExpanded ? "var(--surface-2)" : "transparent",
                borderBottom: isExpanded ? "1px solid var(--border)" : "none",
              }}
            >
              <span style={{ fontSize: "16px", lineHeight: 1, flexShrink: 0 }}>{sec.icon}</span>
              <span style={{ fontSize: "14px", fontWeight: 600, color: isExpanded ? "var(--accent)" : "var(--text-2)", flex: 1 }}>
                {sec.title}
              </span>
              {!isExpanded && hasContent && (
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />
              )}
            </div>

            {/* Subtle content preview when collapsed */}
            {!isExpanded && hasContent && (
              <div
                style={{
                  padding: "0 16px 14px",
                  fontSize: "12.5px", // Slightly increased font size for better readability with more lines
                  color: "var(--text-3)",
                  lineHeight: 1.5,
                  display: "-webkit-box",
                  WebkitLineClamp: 5, // Increased to 5 lines
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  pointerEvents: "none",
                }}
              >
                {sections[sec.id]}
              </div>
            )}

            {/* Content Area */}
            {isExpanded && (
              <div style={{ padding: "12px", background: "var(--surface)", flex: 1, display: "flex", flexDirection: "column" }}>
                <textarea
                  value={sections[sec.id]}
                  onChange={(e) => updateSection(sec.id, e.target.value)}
                  onBlur={handleBlur}
                  placeholder="Type your notes here..."
                  style={{
                    width: "100%",
                    height: "100%",
                    padding: "4px",
                    fontSize: "14px",
                    lineHeight: 1.6,
                    fontFamily: "var(--font-ui-zh, 'Noto Serif TC'), Georgia, serif",
                    border: "none",
                    background: "transparent",
                    color: "var(--text-1)",
                    resize: "none",
                    outline: "none",
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
