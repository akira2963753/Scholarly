"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { PaperCard } from "./PaperCard";

export function PaperGrid() {
  const { papers, folders, fetchAll, addFolder, removeFolder, updateFolder, loading } = useLibraryStore();
  const { data: session, status } = useSession();
  const [search, setSearch] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null); // null = All Papers, "unassigned" = Unassigned, "unread"/"reading"/"done" = status filter, otherwise folder ID
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  // Keep sidebar expanded while user is renaming or creating a folder
  const shouldExpand = sidebarExpanded || editingFolderId !== null || isCreatingFolder;

  // Load data from DB when session is available
  useEffect(() => {
    if (session?.user) {
      fetchAll();
    }
  }, [session, fetchAll]);

  const statusFilters = ["unread", "reading", "done"];

  const filtered = papers.filter((p) => {
    // 1. Folder / status filter
    if (selectedFolderId === "unassigned" && p.folderId) return false;
    if (selectedFolderId === "unread" && (p.status || "unread") !== "unread") return false;
    if (selectedFolderId === "reading" && p.status !== "reading") return false;
    if (selectedFolderId === "done" && p.status !== "done") return false;
    if (selectedFolderId && !statusFilters.includes(selectedFolderId) && selectedFolderId !== "unassigned" && p.folderId !== selectedFolderId) return false;

    // 2. Search filter
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.author.toLowerCase().includes(q) ||
      p.venue.toLowerCase().includes(q);

    return matchesSearch;
  });

  const sortedPapers = [...filtered].sort((a, b) => {
    if (sortOrder === "newest") {
      return b.year - a.year;
    } else {
      return a.year - b.year;
    }
  });

  const submitNewFolder = async () => {
    if (newFolderName.trim()) {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFolderName.trim() }),
      });
      if (res.ok) {
        const folder = await res.json();
        addFolder(folder);
      }
      setNewFolderName("");
      setIsCreatingFolder(false);
    }
  };

  const submitRenameFolder = async (id: string) => {
    if (editingFolderName.trim()) {
      await updateFolder(id, { name: editingFolderName.trim() });
    }
    setEditingFolderId(null);
    setEditingFolderName("");
  };

  const handleCreateFolder = () => {
    setIsCreatingFolder(true);
  };

  // Shared icon button style for collapsed sidebar
  const iconBtnStyle = (active: boolean) => ({
    background: active ? "var(--surface-3)" : "transparent",
    border: "none",
    borderRadius: "6px",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: active ? "var(--text-1)" : "var(--text-2)",
    transition: "background 0.1s",
  } as React.CSSProperties);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar — always rendered, expands on hover */}
      <aside
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
        style={{
          width: shouldExpand ? "240px" : "48px",
          minWidth: shouldExpand ? "240px" : "48px",
          borderRight: "1px solid var(--border)",
          background: "var(--surface)",
          padding: shouldExpand ? "24px 16px" : "24px 8px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          overflow: "hidden",
          transition: "width 0.2s ease, min-width 0.2s ease, padding 0.2s ease",
          flexShrink: 0,
        }}
      >
        {/* Collapsed: icon-only column */}
        {!shouldExpand && (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center" }}>
            {/* All Papers */}
            <button
              onClick={() => setSelectedFolderId(null)}
              style={iconBtnStyle(selectedFolderId === null)}
              title="All Papers"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </button>
            {/* Unread */}
            <button onClick={() => setSelectedFolderId("unread")} style={iconBtnStyle(selectedFolderId === "unread")} title="Unread">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /></svg>
            </button>
            {/* Reading */}
            <button onClick={() => setSelectedFolderId("reading")} style={iconBtnStyle(selectedFolderId === "reading")} title="Reading">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            </button>
            {/* Done */}
            <button onClick={() => setSelectedFolderId("done")} style={iconBtnStyle(selectedFolderId === "done")} title="Done">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </button>
            {/* Unassigned */}
            <button
              onClick={() => setSelectedFolderId("unassigned")}
              style={iconBtnStyle(selectedFolderId === "unassigned")}
              title="Unassigned"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="3" y1="15" x2="21" y2="15" />
              </svg>
            </button>
            {/* Divider */}
            <div style={{ height: "1px", width: "24px", background: "var(--border)", margin: "4px 0" }} />
            {/* Folder icons */}
            {folders.map(f => (
              <button
                key={f.id}
                onClick={() => setSelectedFolderId(f.id)}
                style={iconBtnStyle(selectedFolderId === f.id)}
                title={f.name}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </button>
            ))}
          </div>
        )}

        {/* Expanded: full sidebar content */}
        {shouldExpand && (
          <>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", paddingLeft: "8px" }}>
                Library
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <button
                  onClick={() => setSelectedFolderId(null)}
                  style={{
                    display: "flex", alignItems: "center", width: "100%", padding: "8px", borderRadius: "6px",
                    border: "none", background: selectedFolderId === null ? "var(--surface-3)" : "transparent",
                    color: selectedFolderId === null ? "var(--text-1)" : "var(--text-2)",
                    fontSize: "15px", fontWeight: selectedFolderId === null ? 600 : 500, cursor: "pointer",
                    textAlign: "left", transition: "background 0.1s"
                  }}
                  onMouseEnter={(e) => { if (selectedFolderId !== null) e.currentTarget.style.background = "var(--surface-2)" }}
                  onMouseLeave={(e) => { if (selectedFolderId !== null) e.currentTarget.style.background = "transparent" }}
                >
                  All Papers
                </button>
                {(["unread", "reading", "done"] as const).map((s) => {
                  const dotColor = s === "reading" ? "#1d4ed8" : s === "done" ? "#16a34a" : "var(--text-3)";
                  const label = s === "unread" ? "Unread" : s === "reading" ? "Reading" : "Done";
                  return (
                    <button
                      key={s}
                      onClick={() => setSelectedFolderId(s)}
                      style={{
                        display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "8px", borderRadius: "6px",
                        border: "none", background: selectedFolderId === s ? "var(--surface-3)" : "transparent",
                        color: selectedFolderId === s ? "var(--text-1)" : "var(--text-2)",
                        fontSize: "15px", fontWeight: selectedFolderId === s ? 600 : 500, cursor: "pointer",
                        textAlign: "left", transition: "background 0.1s"
                      }}
                      onMouseEnter={(e) => { if (selectedFolderId !== s) e.currentTarget.style.background = "var(--surface-2)"; }}
                      onMouseLeave={(e) => { if (selectedFolderId !== s) e.currentTarget.style.background = "transparent"; }}
                    >
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: dotColor, flexShrink: 0, opacity: selectedFolderId === s ? 1 : 0.6 }} />
                      {label}
                    </button>
                  );
                })}
                <button
                  onClick={() => setSelectedFolderId("unassigned")}
                  style={{
                    display: "flex", alignItems: "center", width: "100%", padding: "8px", borderRadius: "6px",
                    border: "none", background: selectedFolderId === "unassigned" ? "var(--surface-3)" : "transparent",
                    color: selectedFolderId === "unassigned" ? "var(--text-1)" : "var(--text-2)",
                    fontSize: "15px", fontWeight: selectedFolderId === "unassigned" ? 600 : 500, cursor: "pointer",
                    textAlign: "left", transition: "background 0.1s"
                  }}
                  onMouseEnter={(e) => { if (selectedFolderId !== "unassigned") e.currentTarget.style.background = "var(--surface-2)" }}
                  onMouseLeave={(e) => { if (selectedFolderId !== "unassigned") e.currentTarget.style.background = "transparent" }}
                >
                  Unassigned
                </button>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", paddingLeft: "8px", paddingRight: "4px" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Folders
                </div>
                <button onClick={handleCreateFolder} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", display: "flex", padding: "4px" }} title="New Folder">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {folders.map(f => (
                  <div key={f.id} style={{ display: "flex", alignItems: "center" }}>
                    {editingFolderId === f.id ? (
                      <input
                        autoFocus
                        className="input"
                        style={{ padding: "4px 8px", fontSize: "15px", borderRadius: "4px", minWidth: 0, flex: 1, margin: "4px" }}
                        value={editingFolderName}
                        onChange={(e) => setEditingFolderName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") submitRenameFolder(f.id);
                          if (e.key === "Escape") setEditingFolderId(null);
                        }}
                        onBlur={() => submitRenameFolder(f.id)}
                      />
                    ) : (
                      <>
                        <button
                          onClick={() => setSelectedFolderId(f.id)}
                          style={{
                            flex: 1, display: "flex", alignItems: "center", padding: "8px", borderRadius: "6px",
                            border: "none", background: selectedFolderId === f.id ? "var(--surface-3)" : "transparent",
                            color: selectedFolderId === f.id ? "var(--text-1)" : "var(--text-2)",
                            fontSize: "15px", fontWeight: selectedFolderId === f.id ? 600 : 500, cursor: "pointer",
                            textAlign: "left", transition: "background 0.1s", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                          }}
                          onMouseEnter={(e) => { if (selectedFolderId !== f.id) e.currentTarget.style.background = "var(--surface-2)" }}
                          onMouseLeave={(e) => { if (selectedFolderId !== f.id) e.currentTarget.style.background = "transparent" }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: "8px", opacity: 0.6, flexShrink: 0 }}>
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                          </svg>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                        </button>
                        {selectedFolderId === f.id && (
                          <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
                            <button
                              onClick={() => { setEditingFolderId(f.id); setEditingFolderName(f.name); }}
                              style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: "4px" }} title="Rename Folder">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                            </button>
                            <button
                              onClick={() => { if (confirm("Delete this folder? Papers inside will become unassigned.")) removeFolder(f.id); }}
                              style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: "4px" }} title="Delete Folder">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}

                {isCreatingFolder && (
                  <div style={{ display: "flex", gap: "4px", padding: "4px" }}>
                    <input
                      autoFocus
                      className="input"
                      style={{ padding: "4px 8px", fontSize: "15px", borderRadius: "4px", minWidth: 0, flex: 1 }}
                      placeholder="Folder name..."
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") submitNewFolder();
                        if (e.key === "Escape") {
                          setIsCreatingFolder(false);
                          setNewFolderName("");
                        }
                      }}
                      onBlur={() => {
                        if (newFolderName.trim()) submitNewFolder();
                        else setIsCreatingFolder(false);
                      }}
                    />
                  </div>
                )}

                {folders.length === 0 && !isCreatingFolder && (
                  <p style={{ fontSize: "14px", color: "var(--text-3)", padding: "8px", margin: 0, fontStyle: "italic" }}>No folders yet</p>
                )}
              </div>
            </div>
          </>
        )}
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
        {/* Stats + Search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "24px",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div>
              <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em" }}>
                Library
              </h1>
              <p style={{ margin: "2px 0 0", fontSize: "13px", color: "var(--text-3)" }}>
                {papers.length} paper{papers.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Search & View Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, maxWidth: "400px" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--text-3)"
                strokeWidth="2"
                style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                className="input"
                style={{ paddingLeft: "32px" }}
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Sort Toggle */}
            <select
              className="input"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
              style={{ width: "auto", padding: "5px 8px", fontSize: "13px", appearance: "auto", cursor: "pointer", border: "1px solid var(--border)", background: "var(--surface)" }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>

            {/* View Toggle */}
            <div style={{ display: "flex", background: "var(--surface-2)", borderRadius: "var(--radius-md)", padding: "3px", border: "1px solid var(--border)" }}>
              <button
                onClick={() => setViewMode("grid")}
                style={{
                  padding: "5px 8px",
                  borderRadius: "4px",
                  border: "none",
                  background: viewMode === "grid" ? "var(--surface)" : "transparent",
                  color: viewMode === "grid" ? "var(--text-1)" : "var(--text-3)",
                  boxShadow: viewMode === "grid" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                  cursor: "pointer",
                  transition: "all 0.15s"
                }}
                title="Grid View"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                style={{
                  padding: "5px 8px",
                  borderRadius: "4px",
                  border: "none",
                  background: viewMode === "list" ? "var(--surface)" : "transparent",
                  color: viewMode === "list" ? "var(--text-1)" : "var(--text-3)",
                  boxShadow: viewMode === "list" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                  cursor: "pointer",
                  transition: "all 0.15s"
                }}
                title="List View"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-3)" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: "12px", opacity: 0.4 }}>
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            <p style={{ fontSize: "14px", margin: 0 }}>
              {search
                ? "No papers match your filters."
                : 'No papers yet. Click "Add Paper" to get started.'}
            </p>
          </div>
        ) : (
          <div
            style={{
              display: viewMode === "grid" ? "grid" : "flex",
              flexDirection: viewMode === "grid" ? undefined : "column",
              gridTemplateColumns: viewMode === "grid" ? "repeat(auto-fill, minmax(320px, 1fr))" : undefined,
              gap: viewMode === "grid" ? "16px" : "10px",
            }}
          >
            {sortedPapers.map((paper, i) => (
              <PaperCard key={paper.id} paper={paper} index={i + 1} viewMode={viewMode} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
