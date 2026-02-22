"use client";

import { useState, useRef, useEffect } from "react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import type { Paper } from "@/types/paper";
import type { PaperHighlight } from "@/types/highlight";

interface Message {
  role: "user" | "model";
  text: string;
}

interface Props {
  paper: Paper;
}

function buildSystemPrompt(paper: Paper, highlights: PaperHighlight[]): string {
  const highlightLines = highlights
    .slice(0, 10)
    .map((h) => {
      const page = h.position.boundingRect.pageNumber ?? "?";
      return `- "${h.selectedText}" (p. ${page})`;
    })
    .join("\n");

  return `You are a research assistant helping the user read and understand an academic paper.

Paper details:
Title: "${paper.title}"
Authors: ${paper.author}
Venue: ${paper.venue}, ${paper.year}
${paper.school ? `Institution: ${paper.school}` : ""}

${highlightLines
      ? `User's current highlights from this paper:\n${highlightLines}\n`
      : ""
    }
Answer questions about this paper concisely and accurately. If asked about something not explicitly in the paper, draw on your general knowledge but clearly note the distinction. Keep answers focused and academic in tone.`;
}

export function AIChatPanel({ paper }: Props) {
  const geminiApiKey = useSettingsStore((s) => s.geminiApiKey);
  const highlights = useWorkspaceStore((s) => s.highlights);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      text: `Hi! I'm your AI research assistant for **"${paper.title}"**. Ask me anything about this paper.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setLoading(true);

    try {
      const systemText = buildSystemPrompt(paper, highlights);

      const firstUserIdx = nextMessages.findIndex((m) => m.role === "user");
      const apiContents = nextMessages.slice(firstUserIdx).map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemText }] },
            contents: apiContents,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        const code = res.status;
        const msg: string = data?.error?.message ?? "";
        const detail = msg ? `\nDetails: ${msg}` : "";
        if (code === 400 && msg.toLowerCase().includes("api key")) {
          setError("Invalid API Key, please go to Library → Settings ⚙ to reconfigure.");
        } else if (code === 400) {
          setError(`Bad Request Format: ${msg || "Please try again"}`);
        } else if (code === 401 || code === 403) {
          setError("Invalid API Key or unauthorized, please go to Library → Settings ⚙ to reconfigure.");
        } else if (code === 429) {
          setError(`API Key rate limit reached (429). If you have shared this key publicly, please immediately generate a new key at aistudio.google.com/apikey, then update it in Settings ⚙.${detail}`);
        } else {
          setError(`Error occurred (${code}): ${msg || "Please try again"}`);
        }
        return;
      }

      const reply =
        data.candidates?.[0]?.content?.parts?.[0]?.text ??
        "(No response, please try again)";

      setMessages((prev) => [...prev, { role: "model", text: reply }]);
    } catch {
      setError("Network error, please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // No API key — show setup prompt
  if (!geminiApiKey) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 24px",
          textAlign: "center",
          gap: "12px",
          color: "var(--text-3)",
        }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ opacity: 0.4 }}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <div>
          <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: 600, color: "var(--text-2)" }}>
            API Key Not Set
          </p>
          <p style={{ margin: "0 0 14px", fontSize: "12px", lineHeight: 1.6 }}>
            Go to the Library page and click the ⚙ gear icon in the top right corner to enter your Gemini API Key.
          </p>
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: "12px",
              color: "var(--accent)",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Get your free API Key →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Message list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                maxWidth: "85%",
                padding: "10px 14px",
                borderRadius: "12px 12px 12px 2px",
                background: "var(--surface-2)",
                fontSize: "13px",
                color: "var(--text-3)",
              }}
            >
              <ThinkingDots />
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              background: "#fff5f5",
              border: "1px solid #ffc9c9",
              fontSize: "12px",
              color: "#c92a2a",
              lineHeight: 1.5,
            }}
          >
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div
        style={{
          borderTop: "1px solid var(--border)",
          padding: "10px 14px 12px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          background: "var(--surface)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this paper…"
            rows={1}
            style={{
              flex: 1,
              resize: "none",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "8px 10px",
              fontSize: "13px",
              fontFamily: "inherit",
              color: "var(--text-1)",
              background: "var(--surface)",
              outline: "none",
              lineHeight: 1.5,
              minHeight: "36px",
              maxHeight: "100px",
              overflow: "auto",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="btn btn-primary"
            style={{ padding: "7px 12px", flexShrink: 0, alignSelf: "flex-end" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p style={{ margin: 0, fontSize: "11px", color: "var(--text-3)" }}>
          Enter to send · Shift+Enter to break line
        </p>
      </div>
    </div>
  );
}

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
      <div
        style={{
          maxWidth: "88%",
          padding: "9px 13px",
          borderRadius: isUser ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
          background: isUser ? "var(--accent)" : "var(--surface-2)",
          color: isUser ? "#fff" : "var(--text-1)",
          fontSize: "13px",
          lineHeight: 1.55,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
        className="markdown-body"
      >
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {message.text}
        </ReactMarkdown>
      </div>
    </div>
  );
}

function ThinkingDots() {
  return (
    <span style={{ display: "inline-flex", gap: "3px", alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            background: "var(--text-3)",
            display: "inline-block",
            animation: `thinking-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes thinking-dot {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </span>
  );
}
