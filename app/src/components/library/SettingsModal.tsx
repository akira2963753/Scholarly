"use client";

import { useState } from "react";
import { useSettingsStore, type Theme } from "@/stores/useSettingsStore";

interface Props {
  onClose: () => void;
}

type ValidationStatus = "idle" | "loading" | "ok" | "error";

export function SettingsModal({ onClose }: Props) {
  const { geminiApiKey, setGeminiApiKey, theme, setTheme } = useSettingsStore();
  const [draft, setDraft] = useState(geminiApiKey);
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<ValidationStatus>("idle");
  const [statusMsg, setStatusMsg] = useState("");

  // Reset validation whenever the user edits the key
  const handleDraftChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraft(e.target.value);
    setStatus("idle");
    setStatusMsg("");
  };

  const testKey = async () => {
    const key = draft.trim();
    if (!key) return;
    setStatus("loading");
    setStatusMsg("");
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1/models?key=${key}`
      );
      const data = await res.json();
      if (res.ok) {
        setStatus("ok");
        // Show which generateContent-capable flash models are available
        const names: string[] = (data?.models ?? [])
          .map((m: { name: string }) => m.name.replace("models/", ""))
          .filter((n: string) => n.includes("flash") || n.includes("pro"));
        const modelList = names.length > 0 ? `\nAvailable models: ${names.join(", ")}` : "";
        setStatusMsg(`API Key is valid!${modelList}`);
      } else {
        const msg: string = data?.error?.message ?? "";
        setStatus("error");
        if (res.status === 400 || res.status === 403 || res.status === 401) {
          setStatusMsg(`Invalid API Key: ${msg || "Please check and try again"}`);
        } else if (res.status === 429) {
          setStatus("ok"); // key itself is valid, just rate limited
          setStatusMsg("API Key is valid (rate limit reached, try again later).");
        } else {
          setStatusMsg(`Validation failed (${res.status}): ${msg || "Please try again"}`);
        }
      }
    } catch {
      setStatus("error");
      setStatusMsg("Network error, please check your connection and try again.");
    }
  };

  const handleSave = () => {
    setGeminiApiKey(draft.trim());
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
        {/* Header */}
        <div style={{ padding: "24px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 700 }}>Settings</h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "var(--text-3)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* AI Integration section */}
          <div>
            <p style={{ margin: "0 0 14px", fontSize: "11px", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              AI Integration
            </p>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-2)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Google Gemini API Key
              </label>

              {/* Key input + Test button row */}
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <input
                    className="input"
                    type={showKey ? "text" : "password"}
                    placeholder="AIza..."
                    value={draft}
                    onChange={handleDraftChange}
                    style={{ paddingRight: "40px", fontFamily: draft ? "monospace" : "inherit", fontSize: "13px" }}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-3)",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                    }}
                    title={showKey ? "Hide key" : "Show key"}
                  >
                    {showKey ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Test Key button */}
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={testKey}
                  disabled={!draft.trim() || status === "loading"}
                  style={{ flexShrink: 0, fontSize: "12px", padding: "6px 12px", display: "flex", alignItems: "center", gap: "5px" }}
                >
                  {status === "loading" ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 0.8s linear infinite" }}>
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 11 12 14 22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                  )}
                  {status === "loading" ? "Testing…" : "Test Key"}
                </button>
              </div>

              {/* Validation status badge */}
              {status !== "idle" && status !== "loading" && (
                <div
                  style={{
                    marginTop: "8px",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    lineHeight: 1.5,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "7px",
                    background: status === "ok" ? "#f0fdf4" : "#fff5f5",
                    border: `1px solid ${status === "ok" ? "#bbf7d0" : "#ffc9c9"}`,
                    color: status === "ok" ? "#166534" : "#c92a2a",
                  }}
                >
                  {status === "ok" ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: "1px" }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: "1px" }}>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  )}
                  <span>{statusMsg}</span>
                </div>
              )}

              {/* Helper text */}
              <p style={{ margin: "8px 0 0", fontSize: "12px", color: "var(--text-3)", lineHeight: 1.5 }}>
                Your key is stored locally and never sent to any server other than Google.{" "}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "var(--accent)", textDecoration: "none" }}
                >
                  Get your free API key →
                </a>
              </p>

              {/* Free tier info */}
              <div
                style={{
                  marginTop: "10px",
                  padding: "10px 12px",
                  background: "var(--surface-2)",
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "var(--text-2)",
                  lineHeight: 1.5,
                }}
              >
                <strong style={{ color: "var(--text-1)" }}>Free Tier Info:</strong> Google AI Studio provides Gemini 1.5 Flash for free, with a quota of 15 requests per minute and 1500 per day, which is sufficient for reading papers.
              </div>
            </div>
          </div>

          <div style={{ height: "1px", background: "var(--border)", margin: "4px 0" }} />

          {/* Theme selection section */}
          <div>
            <p style={{ margin: "0 0 14px", fontSize: "11px", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Appearance
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <ThemeOption value="light" label="Light" current={theme} onSelect={setTheme} />
              <ThemeOption value="dark" label="Dark" current={theme} onSelect={setTheme} />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={handleSave}>
              Save
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function ThemeOption({ value, label, current, onSelect }: { value: Theme; label: string; current: Theme; onSelect: (v: Theme) => void }) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      style={{
        flex: 1,
        padding: "12px",
        borderRadius: "8px",
        border: `2px solid ${active ? "var(--accent)" : "var(--border)"}`,
        background: active ? "rgba(47, 109, 224, 0.05)" : "var(--surface-2)",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        transition: "all 0.15s ease",
      }}
    >
      {value === "light" ? (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--accent)" : "var(--text-3)"} strokeWidth="2">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--accent)" : "var(--text-3)"} strokeWidth="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
      <span style={{ fontSize: "13px", fontWeight: 600, color: active ? "var(--text-1)" : "var(--text-2)" }}>{label}</span>
    </button>
  );
}
