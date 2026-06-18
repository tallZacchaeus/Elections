"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { StatCard, btnGhost } from "@/components/admin/ui";
import { ResultsBars, type ResultPosition } from "@/components/results/ResultsBars";
import { Eye, Download, LogOut } from "@/components/Icons";

interface Results {
  positions: ResultPosition[];
  votesCast: number;
  turnoutPct: number;
  flaggedCount: number;
}

export default function ObserverPage() {
  const router = useRouter();
  const [data, setData] = useState<Results | null>(null);

  useEffect(() => {
    fetch("/api/results")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  function exportAs(format: "csv" | "xls") {
    window.location.href = `/api/export?format=${format}`;
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F2F0E6" }}>
      <div className="no-print" style={{ background: "#0A3D26", color: "#F4F1E6", padding: "16px 30px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: "#0E5A37", border: "1px solid #C8932A", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
          <Eye width={20} height={20} stroke="#F4F1E6" />
        </div>
        <div style={{ lineHeight: 1.25 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Observer Portal</div>
          <div style={{ fontSize: 11.5, color: "#9FBFAE" }}>Read-only access · accredited monitor</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(45,160,90,.16)", color: "#9FE3B6", padding: "7px 13px", borderRadius: 999, fontSize: 12.5, fontWeight: 700 }}>
            <span className="live-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "#2DA05A" }} />
            Live
          </span>
          <button onClick={logout} style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.18)", color: "#F4F1E6", borderRadius: 9, padding: "7px 13px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
            <LogOut width={14} height={14} /> Sign out
          </button>
        </div>
      </div>

      <Reveal style={{ maxWidth: 920, margin: "0 auto", padding: "30px 24px 60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 14 }}>
          <div>
            <h1 className="font-serif" style={{ fontWeight: 600, fontSize: 26, margin: "0 0 4px" }}>Results monitor</h1>
            <p style={{ fontSize: 13.5, color: "#5C6B61", margin: 0 }}>You may view and export results. Editing is disabled for observers.</p>
          </div>
          <div className="no-print" style={{ display: "flex", gap: 8 }}>
            <button onClick={() => exportAs("csv")} style={{ ...btnGhost(), display: "flex", alignItems: "center", gap: 7 }}><Download width={15} height={15} /> CSV</button>
            <button onClick={() => exportAs("xls")} style={{ ...btnGhost(), display: "flex", alignItems: "center", gap: 7 }}><Download width={15} height={15} /> Excel</button>
            <button onClick={() => window.print()} style={{ ...btnGhost({ background: "#0E5A37", color: "#fff", border: "none" }), display: "flex", alignItems: "center", gap: 7 }}><Download width={15} height={15} /> PDF</button>
          </div>
        </div>

        {!data ? (
          <p style={{ color: "#5C6B61" }}>Loading results…</p>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14, marginBottom: 22 }}>
              <StatCard label="Votes cast" value={data.votesCast} color="#0E5A37" />
              <StatCard label="Turnout" value={`${data.turnoutPct}%`} />
              <StatCard label="Flagged attempts" value={data.flaggedCount} color="#B0651F" />
            </div>
            <ResultsBars positions={data.positions} />
          </>
        )}
        <Link href="/" className="no-print" style={{ display: "inline-block", marginTop: 24, color: "#5C6B61", fontSize: 13, textDecoration: "underline", textUnderlineOffset: 3 }}>
          Return to home
        </Link>
      </Reveal>
    </div>
  );
}
