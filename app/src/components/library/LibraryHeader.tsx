"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { UploadModal } from "./UploadModal";
import { SettingsModal } from "./SettingsModal";
import { AuthModal } from "@/components/auth/AuthModal";

export function LibraryHeader() {
  const [showModal, setShowModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const { data: session } = useSession();

  return (
    <>
      <header
        style={{
          padding: "20px 32px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--surface)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              background: "var(--text-1)",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: "22px", letterSpacing: "-0.01em" }}>
            Scholarly
          </span>
        </div>

        {/* Right buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            className="btn btn-ghost"
            onClick={() => setShowSettings(true)}
            title="Settings"
            style={{ padding: "6px 10px" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>

          {session?.user ? (
            <>
              {/* User avatar + name */}
              <div style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "5px 10px", borderRadius: "8px",
                background: "var(--surface-2)", border: "1px solid var(--border)",
                fontSize: "13px", color: "var(--text-2)",
              }}>
                <div style={{
                  width: "24px", height: "24px", borderRadius: "50%",
                  background: "var(--text-1)", display: "flex", alignItems: "center",
                  justifyContent: "center", color: "var(--surface)", fontSize: "11px", fontWeight: 700,
                }}>
                  {(session.user.name?.[0] ?? session.user.email?.[0] ?? "?").toUpperCase()}
                </div>
                <span style={{ maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {session.user.name ?? session.user.email}
                </span>
              </div>

              <button
                className="btn btn-ghost"
                onClick={() => signOut()}
                style={{ fontSize: "13px", padding: "6px 12px" }}
              >
                Sign Out
              </button>

              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Paper
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={() => setShowAuth(true)}>
              Log In / Register
            </button>
          )}
        </div>
      </header>

      {showModal && <UploadModal onClose={() => setShowModal(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
