"use client";

import { useEffect, useState } from "react";
import { Reveal } from "@/components/Reveal";
import { useToast, Toast } from "@/components/Toast";
import { PageHeader, btnPrimary, inputStyle, labelStyle } from "@/components/admin/ui";

interface Setting {
  institution: string;
  faculty: string;
  department: string;
  electionTitle: string;
  votingOpen: boolean;
  votingOpensAt: string | null;
  votingClosesAt: string | null;
}

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 16);
}

export default function SettingsPage() {
  const { toast, showToast } = useToast();
  const [s, setS] = useState<Setting | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((json) => setS(json.setting))
      .catch(() => {});
  }, []);

  function update<K extends keyof Setting>(key: K, value: Setting[K]) {
    setS((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function save() {
    if (!s) return;
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        institution: s.institution,
        faculty: s.faculty,
        department: s.department,
        electionTitle: s.electionTitle,
        votingOpen: s.votingOpen,
        votingOpensAt: s.votingOpensAt ? new Date(s.votingOpensAt).toISOString() : null,
        votingClosesAt: s.votingClosesAt ? new Date(s.votingClosesAt).toISOString() : null,
      }),
    });
    setSaving(false);
    showToast(res.ok ? "Election settings saved." : "Could not save settings.");
  }

  if (!s) return <p style={{ color: "#5C6B61" }}>Loading settings…</p>;

  return (
    <Reveal style={{ maxWidth: 640 }}>
      <PageHeader
        title="Election settings"
        subtitle="This system is white-label — reuse it for any faculty or department by updating these fields."
      />
      <div style={{ background: "#fff", border: "1px solid #E4E0D4", borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="Election title">
          <input value={s.electionTitle} onChange={(e) => update("electionTitle", e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Institution">
          <input value={s.institution} onChange={(e) => update("institution", e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Faculty">
          <input value={s.faculty} onChange={(e) => update("faculty", e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Department">
          <input value={s.department} onChange={(e) => update("department", e.target.value)} style={inputStyle} />
        </Field>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <Field label="Voting opens" style={{ flex: 1, minWidth: 220 }}>
            <input type="datetime-local" value={toLocalInput(s.votingOpensAt)} onChange={(e) => update("votingOpensAt", e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Voting closes" style={{ flex: 1, minWidth: 220 }}>
            <input type="datetime-local" value={toLocalInput(s.votingClosesAt)} onChange={(e) => update("votingClosesAt", e.target.value)} style={inputStyle} />
          </Field>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#16241C", fontWeight: 600, cursor: "pointer" }}>
          <input type="checkbox" checked={s.votingOpen} onChange={(e) => update("votingOpen", e.target.checked)} style={{ width: 18, height: 18, accentColor: "#0E5A37" }} />
          Voting is currently open
        </label>
        <button onClick={save} disabled={saving} style={btnPrimary({ alignSelf: "flex-start", cursor: saving ? "wait" : "pointer", opacity: saving ? 0.85 : 1 })}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
      <Toast message={toast} />
    </Reveal>
  );
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}
