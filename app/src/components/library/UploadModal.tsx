"use client";

import { useState, useRef } from "react";
import { useLibraryStore } from "@/stores/useLibraryStore";
import type { Paper } from "@/types/paper";

interface FormData {
  title: string;
  author: string;
  school: string;
  year: string;
  venue: string;
}

interface Props {
  onClose: () => void;
  mode?: "add" | "edit";
  initialPaper?: Paper;
}

export function UploadModal({ onClose, mode = "add", initialPaper }: Props) {
  const isEdit = mode === "edit";
  const { addPaper, updatePaper, removePaper } = useLibraryStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormData>({
    title: initialPaper?.title ?? "",
    author: initialPaper?.author ?? "",
    school: initialPaper?.school ?? "",
    year: initialPaper?.year?.toString() ?? new Date().getFullYear().toString(),
    venue: initialPaper?.venue ?? "",
  });
  const [errors, setErrors] = useState<Partial<FormData & { file: string }>>({});

  const validate = () => {
    const e: Partial<FormData & { file: string }> = {};
    if (!isEdit && !file) e.file = "Please select a PDF file";
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.author.trim()) e.author = "Author is required";
    if (!form.venue.trim()) e.venue = "Venue is required";
    const yr = parseInt(form.year);
    if (!form.year || isNaN(yr) || yr < 1900 || yr > 2100) e.year = "Enter a valid year";
    return e;
  };

  const handleFile = (f: File) => {
    if (f.type !== "application/pdf") {
      setErrors((prev) => ({ ...prev, file: "Only PDF files are accepted" }));
      return;
    }
    setFile(f);
    setErrors((prev) => ({ ...prev, file: undefined }));
    if (!form.title) {
      const name = f.name.replace(/\.pdf$/i, "").replace(/[-_]/g, " ");
      setForm((prev) => ({ ...prev, title: name }));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      if (isEdit && initialPaper) {
        // Edit mode: update metadata only, keep existing filePath
        updatePaper(initialPaper.id, {
          title: form.title.trim(),
          author: form.author.trim(),
          school: form.school.trim() || null,
          year: parseInt(form.year),
          venue: form.venue.trim(),
        });
        onClose();
      } else {
        // Add mode: upload file first
        const fd = new FormData();
        fd.append("file", file!);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const { filePath } = await res.json();

        const paper: Paper = {
          id: crypto.randomUUID(),
          title: form.title.trim(),
          author: form.author.trim(),
          school: form.school.trim() || null,
          year: parseInt(form.year),
          venue: form.venue.trim(),
          filePath,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        addPaper(paper);
        onClose();
      }
    } catch {
      setErrors({ file: "Operation failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const field = (
    label: string,
    key: keyof FormData,
    opts?: { placeholder?: string; type?: string; required?: boolean }
  ) => (
    <div>
      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-2)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label} {opts?.required !== false && <span style={{ color: "#e03131" }}>*</span>}
      </label>
      <input
        className="input"
        type={opts?.type || "text"}
        placeholder={opts?.placeholder || label}
        value={form[key]}
        onChange={(ev) => setForm((prev) => ({ ...prev, [key]: ev.target.value }))}
      />
      {errors[key] && <p style={{ fontSize: "12px", color: "#e03131", marginTop: "4px" }}>{errors[key]}</p>}
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: "24px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 700 }}>{isEdit ? "Edit Paper" : "Add Paper"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "var(--text-3)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Drop zone — only shown in add mode */}
          {!isEdit && (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2px dashed ${dragging ? "var(--accent)" : file ? "#2f9e44" : "var(--border-strong)"}`,
                  borderRadius: "8px",
                  padding: "24px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: dragging ? "#f0f4ff" : file ? "#f6fef9" : "var(--surface-2)",
                  transition: "all 0.15s ease",
                }}
              >
                <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                {file ? (
                  <div>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2f9e44" strokeWidth="2" style={{ marginBottom: "6px" }}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#2f9e44" }}>{file.name}</p>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-3)" }}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB · Click to change
                    </p>
                  </div>
                ) : (
                  <div>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.5" style={{ marginBottom: "8px" }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 500, color: "var(--text-2)" }}>
                      Drop PDF here or <span style={{ color: "var(--accent)", textDecoration: "underline" }}>browse</span>
                    </p>
                  </div>
                )}
              </div>
              {errors.file && <p style={{ margin: "-8px 0 0", fontSize: "12px", color: "#e03131" }}>{errors.file}</p>}
            </>
          )}

          {/* Metadata fields */}
          {field("Title", "title", { placeholder: "e.g. Attention Is All You Need" })}
          {field("Author(s)", "author", { placeholder: "e.g. A. Vaswani, N. Shazeer" })}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {field("Year", "year", { type: "number", placeholder: "2026" })}
            {field("School / Institution", "school", { required: false, placeholder: "Optional" })}
          </div>
          {field("Venue / Journal", "venue", { placeholder: "e.g. NeurIPS 2025" })}

          {/* Submit */}
          <div style={{ display: "flex", gap: "10px", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
            {isEdit && initialPaper ? (
              <button
                type="button"
                onClick={() => { removePaper(initialPaper.id); onClose(); }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#e03131",
                  fontSize: "13px",
                  cursor: "pointer",
                  padding: "4px 6px",
                  borderRadius: "var(--radius-sm)",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#fff5f5")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
                Delete Paper
              </button>
            ) : <span />}
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Saving…" : isEdit ? "Save Changes" : "Add Paper"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
