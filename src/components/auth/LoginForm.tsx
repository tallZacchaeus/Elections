"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Reveal } from "@/components/Reveal";
import { LeafMark } from "@/components/Logo";
import { AlertCircle } from "@/components/Icons";

interface LoginFormProps {
  portal: "admin" | "observer";
  title: string;
  subtitle: string;
  redirectTo: string;
  hint?: string;
}

export function LoginForm({ portal, title, subtitle, redirectTo, hint }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, portal }),
      });
      const json = await res.json();
      if (res.ok) {
        router.push(redirectTo);
        router.refresh();
      } else {
        setError(json.error ?? "Login failed.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 22px", background: "radial-gradient(120% 100% at 50% -20%, #114D33 0%, #0A3D26 60%, #082E1D 100%)" }}>
      <Reveal style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#0A3D26", border: "1.5px solid #C8932A", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <LeafMark size={30} />
          </div>
          <h1 className="font-serif" style={{ fontWeight: 600, fontSize: 25, color: "#F4F1E6", margin: "0 0 6px" }}>{title}</h1>
          <p style={{ fontSize: 13.5, color: "#9FBFAE", margin: 0 }}>{subtitle}</p>
        </div>
        <form onSubmit={submit} style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 20px 50px rgba(0,0,0,.35)" }}>
          <label htmlFor="email" style={labelStyle}>Email address</label>
          <input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} placeholder="you@oyscatech.edu.ng" />

          <label htmlFor="password" style={{ ...labelStyle, marginTop: 14 }}>Password</label>
          <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} placeholder="••••••••" />

          {error && (
            <div style={{ display: "flex", gap: 9, alignItems: "flex-start", marginTop: 12, background: "#FBEAEA", border: "1px solid #F0CFCF", color: "#A12B2B", padding: "11px 13px", borderRadius: 9, fontSize: 13, lineHeight: 1.45 }}>
              <AlertCircle width={16} height={16} strokeWidth={2.2} style={{ flex: "none", marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" disabled={loading} className="focus-ring" style={{ width: "100%", marginTop: 18, background: "#0E5A37", color: "#fff", border: "none", borderRadius: 10, padding: 14, fontSize: 15, fontWeight: 700, cursor: loading ? "wait" : "pointer", opacity: loading ? 0.85 : 1 }}>
            {loading ? "Signing in…" : "Sign in"}
          </button>

          {hint && (
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px dashed #E0DBCC", fontSize: 12, color: "#7A887E", lineHeight: 1.6 }}>
              {hint}
            </div>
          )}
        </form>
        <Link href="/" style={{ display: "block", textAlign: "center", marginTop: 18, color: "#9FBFAE", fontSize: 13, textDecoration: "underline", textUnderlineOffset: 3 }}>
          Return to home
        </Link>
      </Reveal>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "#3A483F",
  marginBottom: 8,
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 15px",
  border: "1.5px solid #D8D3C4",
  borderRadius: 10,
  fontSize: 15,
  outline: "none",
};
