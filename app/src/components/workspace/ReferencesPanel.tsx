"use client";

import { useState } from "react";
import Link from "next/link";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { useLibraryStore } from "@/stores/useLibraryStore";
import type { Paper, Reference } from "@/types/paper";

interface Props {
  paper: Paper;
}

export function ReferencesPanel({ paper }: Props) {
  const geminiApiKey = useSettingsStore((s) => s.geminiApiKey);
  const { paperFileUri, setPaperFileUri } = useWorkspaceStore();
  const { updatePaper, papers } = useLibraryStore();
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const references = paper.references as Reference[] | null | undefined;

  // Find a matching paper in the library by title similarity
  const findInLibrary = (ref: Reference) => {
    if (!ref.title || ref.title.length < 10) return null;
    const refTitle = ref.title.toLowerCase().trim();
    return (
      papers.find(
        (p) =>
          p.id !== paper.id &&
          p.title.toLowerCase().trim().includes(refTitle.slice(0, 35))
      ) ?? null
    );
  };

  const handleExtract = async () => {
    if (!geminiApiKey) {
      setError("Please configure your Gemini API Key in Settings first.");
      return;
    }

    setExtracting(true);
    setError(null);

    try {
      // Reuse existing PDF file URI if already uploaded via AI Chat
      let fileUri = paperFileUri;

      if (!fileUri) {
        const pdfRes = await fetch(paper.filePath);
        const pdfBlob = await pdfRes.blob();

        const uploadRes = await fetch(
          `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: {
              "X-Goog-Upload-Command": "start, upload, finalize",
              "X-Goog-Upload-Header-Content-Length": pdfBlob.size.toString(),
              "X-Goog-Upload-Header-Content-Type": "application/pdf",
              "Content-Type": "application/pdf",
            },
            body: pdfBlob,
          }
        );

        const uploadData = await uploadRes.json();
        if (!uploadData.file?.uri) {
          throw new Error("Failed to upload PDF to Gemini.");
        }
        fileUri = uploadData.file.uri;
        setPaperFileUri(fileUri);
      }

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: {
              parts: [
                {
                  text: `You are an academic reference extractor. Extract ALL references from the bibliography/reference list section of this paper. Return ONLY a valid JSON array with no extra text, markdown, or code blocks. Each item must have exactly these fields: {"index": 1, "authors": "A. Smith, B. Jones", "title": "Paper Title Here", "venue": "NeurIPS 2023", "year": "2023"}. If a field is missing, use an empty string. Return ALL references found.`,
                },
              ],
            },
            contents: [
              {
                role: "user",
                parts: [
                  {
                    fileData: {
                      mimeType: "application/pdf",
                      fileUri,
                    },
                  },
                  {
                    text: "Extract all references from the bibliography/references section of this paper. Return only the JSON array.",
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Gemini API request failed.");
      }

      const textReply = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textReply) throw new Error("No response from AI.");

      let parsed: Reference[];
      try {
        parsed = JSON.parse(textReply);
        if (!Array.isArray(parsed)) throw new Error("Response is not an array.");
      } catch {
        throw new Error("Failed to parse AI response as JSON.");
      }

      await updatePaper(paper.id, { references: parsed } as any);
    } catch (err: any) {
      setError(err.message || "Extraction failed. Please try again.");
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--surface)" }}>
      {/* Header */}
      <div
        style={{
          padding: "14px 16px 12px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-1)" }}>
            References
            {references && references.length > 0 && (
              <span style={{ fontWeight: 400, color: "var(--text-3)", marginLeft: "6px" }}>
                {references.length}
              </span>
            )}
          </span>
        </div>

        {/* Re-extract button */}
        {references && references.length > 0 && (
          <button
            onClick={handleExtract}
            disabled={extracting}
            title="Re-extract references"
            style={{
              background: "none",
              border: "none",
              cursor: extracting ? "default" : "pointer",
              color: "var(--text-3)",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              borderRadius: "4px",
              transition: "color 0.15s",
              opacity: extracting ? 0.5 : 1,
            }}
            className="hover:text-primary"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ animation: extracting ? "spin 0.8s linear infinite" : "none" }}
            >
              <path d="M23 4v6h-6" />
              <path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div
          style={{
            margin: "12px 16px 0",
            padding: "10px 12px",
            background: "#fff5f5",
            border: "1px solid #fecaca",
            borderRadius: "6px",
            fontSize: "12px",
            color: "#e03131",
            flexShrink: 0,
          }}
        >
          {error}
        </div>
      )}

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {/* Empty state */}
        {!references && !extracting && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: "16px",
              textAlign: "center",
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 600, color: "var(--text-1)" }}>
                No references extracted
              </p>
              <p style={{ margin: 0, fontSize: "12px", color: "var(--text-3)" }}>
                Use AI to extract citations from this paper&apos;s bibliography
              </p>
            </div>
            {!geminiApiKey ? (
              <p style={{ margin: 0, fontSize: "12px", color: "var(--text-3)", background: "var(--surface-2)", padding: "8px 12px", borderRadius: "6px" }}>
                Configure your Gemini API Key in Settings to use this feature
              </p>
            ) : (
              <button
                onClick={handleExtract}
                className="btn btn-primary"
                style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                Extract References with AI
              </button>
            )}
          </div>
        )}

        {/* Loading state */}
        {extracting && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: "12px",
              color: "var(--text-3)",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" style={{ animation: "spin 0.8s linear infinite" }}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            <p style={{ margin: 0, fontSize: "13px" }}>Extracting references&hellip;</p>
          </div>
        )}

        {/* References list */}
        {!extracting && references && references.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {references.map((ref, i) => {
              const match = findInLibrary(ref);
              return (
                <div
                  key={i}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "6px",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    gap: "10px",
                  }}
                >
                  {/* Index */}
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--text-3)",
                      flexShrink: 0,
                      minWidth: "22px",
                      paddingTop: "2px",
                    }}
                  >
                    [{ref.index ?? i + 1}]
                  </span>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 3px", fontSize: "13px", fontWeight: 600, color: "var(--text-1)", lineHeight: 1.4 }}>
                      {ref.title || "(untitled)"}
                    </p>
                    {ref.authors && (
                      <p style={{ margin: "0 0 5px", fontSize: "12px", color: "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {ref.authors}
                      </p>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      {(ref.venue || ref.year) && (
                        <span style={{ fontSize: "11px", color: "var(--text-3)" }}>
                          {[ref.venue, ref.year].filter(Boolean).join(" · ")}
                        </span>
                      )}
                      {match && (
                        <Link
                          href={`/workspace/${match.id}`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "#2f9e44",
                            textDecoration: "none",
                            background: "#f0fff4",
                            border: "1px solid #b2f2bb",
                            borderRadius: "4px",
                            padding: "1px 6px",
                          }}
                          title={`Open in workspace`}
                        >
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          In Library
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Extracted but empty */}
        {!extracting && references && references.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-3)" }}>
            <p style={{ fontSize: "14px", margin: "0 0 12px" }}>No references found in this paper.</p>
            <button onClick={handleExtract} className="btn btn-ghost" style={{ fontSize: "12px" }}>
              Try again
            </button>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
