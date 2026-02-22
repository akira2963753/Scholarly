"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

interface AuthModalProps {
    onClose: () => void;
}

export function AuthModal({ onClose }: AuthModalProps) {
    const [tab, setTab] = useState<"login" | "register">("login");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const result = await signIn("credentials", { email, password, redirect: false });
            if (result?.error) {
                setError("Invalid email or password.");
            } else {
                onClose();
                window.location.reload();
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error ?? "Registration failed.");
                return;
            }
            // Auto-login after register
            await signIn("credentials", { email, password, redirect: false });
            onClose();
            window.location.reload();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                position: "fixed", inset: 0, zIndex: 9999,
                background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
                display: "flex", alignItems: "center", justifyContent: "center",
            }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div style={{
                background: "var(--surface)", borderRadius: "16px",
                padding: "36px", width: "100%", maxWidth: "400px",
                boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
                border: "1px solid var(--border)",
            }}>
                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: "28px" }}>
                    <div style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-1)" }}>
                        📚 Scholarly
                    </div>
                    <p style={{ margin: "6px 0 0", fontSize: "14px", color: "var(--text-3)" }}>
                        Your personal academic library
                    </p>
                </div>

                {/* Tabs */}
                <div style={{ display: "flex", gap: "4px", background: "var(--surface-2)", borderRadius: "10px", padding: "4px", marginBottom: "24px" }}>
                    {(["login", "register"] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => { setTab(t); setError(""); }}
                            style={{
                                flex: 1, padding: "8px", borderRadius: "8px", border: "none",
                                fontWeight: 600, fontSize: "14px", cursor: "pointer",
                                background: tab === t ? "var(--surface)" : "transparent",
                                color: tab === t ? "var(--text-1)" : "var(--text-3)",
                                boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                                transition: "all 0.15s",
                            }}
                        >
                            {t === "login" ? "Log In" : "Register"}
                        </button>
                    ))}
                </div>

                {/* Form */}
                <form onSubmit={tab === "login" ? handleLogin : handleRegister}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        {tab === "register" && (
                            <div>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-2)", marginBottom: "6px" }}>
                                    Name
                                </label>
                                <input
                                    className="input"
                                    type="text"
                                    placeholder="Your name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    style={{ width: "100%", boxSizing: "border-box" }}
                                />
                            </div>
                        )}
                        <div>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-2)", marginBottom: "6px" }}>
                                Email
                            </label>
                            <input
                                className="input"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{ width: "100%", boxSizing: "border-box" }}
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-2)", marginBottom: "6px" }}>
                                Password
                            </label>
                            <input
                                className="input"
                                type="password"
                                placeholder="At least 6 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                style={{ width: "100%", boxSizing: "border-box" }}
                            />
                        </div>

                        {error && (
                            <p style={{ margin: 0, padding: "10px 14px", borderRadius: "8px", background: "#fef2f2", color: "#dc2626", fontSize: "13px" }}>
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                            style={{ width: "100%", padding: "12px", fontSize: "15px", fontWeight: 600, marginTop: "4px", justifyContent: "center" }}
                        >
                            {loading ? "Please wait…" : tab === "login" ? "Log In" : "Create Account"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
