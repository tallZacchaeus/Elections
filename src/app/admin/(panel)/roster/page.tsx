"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/Reveal";
import { useToast, Toast } from "@/components/Toast";
import { PageHeader, btnGhost } from "@/components/admin/ui";
import { Upload, FileText } from "@/components/Icons";

interface Voter {
  matricNumber: string;
  fullName: string;
  hasVoted: boolean;
}

export default function RosterPage() {
  const { toast, showToast } = useToast();
  const [voters, setVoters] = useState<Voter[]>([]);
  const [total, setTotal] = useState(0);
  const [votedCount, setVotedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await fetch("/api/admin/roster");
    const json = await res.json();
    setVoters(json.voters ?? []);
    setTotal(json.total ?? 0);
    setVotedCount(json.votedCount ?? 0);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const text = await file.text();
      const res = await fetch("/api/admin/roster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: text, replace: true }),
      });
      const json = await res.json();
      if (res.ok) {
        showToast(`Roster uploaded · ${json.imported} voters validated.`);
        load();
      } else {
        showToast(json.error ?? "Upload failed.");
      }
    } catch {
      showToast("Could not read that file.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function downloadTemplate() {
    const csv = "matric_number,full_name\nPUB/22/014,Chinedu Okeke\nPUB/22/027,Fatima Bello\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "roster_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const shown = voters.slice(0, 12);

  return (
    <Reveal>
      <PageHeader
        title="Voter roster"
        subtitle="Upload the eligibility dataset. Only matriculation numbers on this list may vote."
        right={<button onClick={downloadTemplate} style={btnGhost()}>Download CSV template</button>}
      />

      <input ref={fileRef} type="file" accept=".csv,text/csv,.xlsx" onChange={onFile} style={{ display: "none" }} />

      <div
        onClick={() => !uploading && fileRef.current?.click()}
        role="button"
        tabIndex={0}
        style={{ background: "#fff", border: "2px dashed #C9C3B0", borderRadius: 15, padding: "40px 24px", textAlign: "center", cursor: uploading ? "wait" : "pointer", marginBottom: 22 }}
      >
        <div style={{ width: 54, height: 54, borderRadius: 12, background: "#E2F0E7", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
          <Upload width={26} height={26} stroke="#0E5A37" />
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#16241C", marginBottom: 6 }}>
          {uploading ? "Uploading…" : "Drop your CSV file here, or click to browse"}
        </div>
        <div style={{ fontSize: 13, color: "#7A887E" }}>
          accepts .csv · columns: <code>matric_number</code>, <code>full_name</code> · uploading replaces the current roster
        </div>
      </div>

      {loading ? (
        <p style={{ color: "#5C6B61" }}>Loading roster…</p>
      ) : total === 0 ? (
        <p style={{ color: "#8A968C" }}>No voters loaded yet. Upload a roster to begin.</p>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #E4E0D4", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #EFEBDE", background: "#F7F5EC", gap: 10, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <FileText width={20} height={20} stroke="#0E5A37" />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Current roster</div>
                <div style={{ fontSize: 12, color: "#8A968C" }}>{total} eligible voters · {votedCount} have voted</div>
              </div>
            </div>
            <button onClick={() => fileRef.current?.click()} style={btnGhost()}>Replace file</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.6fr .8fr", padding: "11px 20px", background: "#FBFAF3", borderBottom: "1px solid #EFEBDE", fontSize: 11.5, letterSpacing: ".05em", textTransform: "uppercase", color: "#8A968C", fontWeight: 700 }}>
            <span>Matric number</span>
            <span>Full name</span>
            <span>Status</span>
          </div>
          {shown.map((v) => (
            <div key={v.matricNumber} style={{ display: "grid", gridTemplateColumns: "1.2fr 1.6fr .8fr", padding: "12px 20px", borderBottom: "1px solid #F2EEE2", fontSize: 13.5, alignItems: "center" }}>
              <span style={{ fontWeight: 600, letterSpacing: ".02em" }}>{v.matricNumber}</span>
              <span style={{ color: "#46554C" }}>{v.fullName}</span>
              <span>
                <span style={{ fontSize: 11.5, fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: v.hasVoted ? "#E2F0E7" : "#F2EFE4", color: v.hasVoted ? "#0E5A37" : "#8A968C" }}>
                  {v.hasVoted ? "Voted" : "Not voted"}
                </span>
              </span>
            </div>
          ))}
          {total > shown.length && (
            <div style={{ padding: "12px 20px", fontSize: 12, color: "#8A968C", textAlign: "center" }}>
              Showing first {shown.length} of {total} records
            </div>
          )}
        </div>
      )}
      <Toast message={toast} />
    </Reveal>
  );
}
