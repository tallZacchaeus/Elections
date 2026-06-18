"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/Reveal";
import { Avatar } from "@/components/Avatar";
import { useToast, Toast } from "@/components/Toast";
import { PageHeader, btnPrimary, btnGhost, inputStyle, labelStyle } from "@/components/admin/ui";

interface Candidate {
  id: string;
  name: string;
  level: string;
  avatarBg: string;
  manifesto: string;
  photoUrl?: string | null;
}
interface Position {
  id: string;
  title: string;
  candidates: Candidate[];
}

export default function CandidatesPage() {
  const { toast, showToast } = useToast();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  const [posId, setPosId] = useState("");
  const [name, setName] = useState("");
  const [level, setLevel] = useState("");
  const [manifesto, setManifesto] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [newPosTitle, setNewPosTitle] = useState("");
  const addFileRef = useRef<HTMLInputElement>(null);

  async function uploadPhoto(id: string, file: File): Promise<boolean> {
    const fd = new FormData();
    fd.append("photo", file);
    const res = await fetch(`/api/admin/candidates/${id}/photo`, {
      method: "POST",
      body: fd,
    });
    if (!res.ok) {
      showToast((await res.json().catch(() => ({}))).error ?? "Photo upload failed.");
      return false;
    }
    return true;
  }

  async function removePhoto(id: string) {
    const res = await fetch(`/api/admin/candidates/${id}/photo`, { method: "DELETE" });
    if (res.ok) {
      showToast("Photo removed.");
      load();
    }
  }

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/positions");
    const json = await res.json();
    setPositions(json.positions ?? []);
    if (!posId && json.positions?.[0]) setPosId(json.positions[0].id);
    setLoading(false);
  }, [posId]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addCandidate() {
    if (!name.trim()) return showToast("Enter a candidate name first.");
    if (!posId) return showToast("Select a position first.");
    const res = await fetch("/api/admin/candidates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ positionId: posId, name, level, manifesto }),
    });
    if (res.ok) {
      const created = await res.json();
      if (photoFile && created.candidate?.id) {
        await uploadPhoto(created.candidate.id, photoFile);
      }
      setName("");
      setManifesto("");
      setLevel("");
      setPhotoFile(null);
      if (addFileRef.current) addFileRef.current.value = "";
      showToast("Candidate added.");
      load();
    } else {
      showToast((await res.json()).error ?? "Could not add candidate.");
    }
  }

  async function deleteCandidate(id: string, cname: string) {
    if (!confirm(`Remove ${cname}? Their votes will also be removed.`)) return;
    const res = await fetch(`/api/admin/candidates/${id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Candidate removed.");
      load();
    }
  }

  async function addPosition() {
    if (!newPosTitle.trim()) return;
    const res = await fetch("/api/admin/positions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newPosTitle }),
    });
    if (res.ok) {
      setNewPosTitle("");
      showToast("Position added.");
      load();
    }
  }

  async function deletePosition(id: string, title: string) {
    if (!confirm(`Delete the "${title}" position and all its candidates and votes?`)) return;
    const res = await fetch(`/api/admin/positions/${id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Position deleted.");
      if (posId === id) setPosId("");
      load();
    }
  }

  if (loading) return <p style={{ color: "#5C6B61" }}>Loading candidates…</p>;

  return (
    <Reveal>
      <PageHeader title="Manage candidates" subtitle="Add or review accredited candidates for each position." />

      {/* Add candidate */}
      <div style={{ background: "#fff", border: "1px solid #E4E0D4", borderRadius: 13, padding: 18, marginBottom: 18, display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12, alignItems: "start" }}>
        <div>
          <label style={labelStyle}>Position</label>
          <select value={posId} onChange={(e) => setPosId(e.target.value)} style={inputStyle}>
            {positions.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Candidate name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Level / standing (optional)</label>
          <input value={level} onChange={(e) => setLevel(e.target.value)} placeholder="e.g. HND II · Public Admin" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Manifesto (optional)</label>
          <textarea value={manifesto} onChange={(e) => setManifesto(e.target.value)} rows={2} placeholder="Short manifesto…" style={{ ...inputStyle, resize: "vertical" }} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Photo (optional)</label>
          <input
            ref={addFileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
            style={{ fontSize: 13, color: "#46554C" }}
          />
          <span style={{ fontSize: 12, color: "#8A968C", marginLeft: 8 }}>
            JPG, PNG, WebP or GIF · up to 4 MB. You can also add a photo after creating the candidate.
          </span>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <button onClick={addCandidate} style={btnPrimary()}>Add candidate</button>
        </div>
      </div>

      {/* Add position */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 22, flexWrap: "wrap" }}>
        <input value={newPosTitle} onChange={(e) => setNewPosTitle(e.target.value)} placeholder="New position title" style={{ ...inputStyle, maxWidth: 280 }} />
        <button onClick={addPosition} style={btnGhost()}>+ Add position</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {positions.map((pos) => (
          <div key={pos.id} style={{ background: "#fff", border: "1px solid #E4E0D4", borderRadius: 13, padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 10 }}>
              <h3 className="font-serif" style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>{pos.title}</h3>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#8A968C", background: "#F2F0E6", padding: "4px 10px", borderRadius: 99 }}>{pos.candidates.length} candidates</span>
                <button onClick={() => deletePosition(pos.id, pos.title)} style={{ ...btnGhost({ color: "#A12B2B", borderColor: "#E7C9C9" }) }}>Delete</button>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {pos.candidates.length === 0 && (
                <span style={{ fontSize: 13, color: "#8A968C" }}>No candidates yet.</span>
              )}
              {pos.candidates.map((c) => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "#F7F5EC", border: "1px solid #EAE6D8", borderRadius: 10, padding: "8px 10px 8px 8px" }}>
                  <Avatar name={c.name} size={34} bg={c.avatarBg} photoUrl={c.photoUrl} fontSize={13} />
                  <div style={{ lineHeight: 1.25 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: "#8A968C" }}>{c.level}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 2, marginLeft: 4 }}>
                    <PhotoButton
                      hasPhoto={!!c.photoUrl}
                      onPick={async (file) => {
                        if (await uploadPhoto(c.id, file)) {
                          showToast("Photo updated.");
                          load();
                        }
                      }}
                    />
                    {c.photoUrl && (
                      <button onClick={() => removePhoto(c.id)} title="Remove photo" style={{ background: "transparent", border: "none", color: "#8A968C", cursor: "pointer", fontSize: 11, padding: 4 }}>
                        clear
                      </button>
                    )}
                    <button onClick={() => deleteCandidate(c.id, c.name)} aria-label={`Remove ${c.name}`} title="Remove candidate" style={{ background: "transparent", border: "none", color: "#B0651F", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 4 }}>×</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Toast message={toast} />
    </Reveal>
  );
}

function PhotoButton({
  hasPhoto,
  onPick,
}: {
  hasPhoto: boolean;
  onPick: (file: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          if (ref.current) ref.current.value = "";
        }}
      />
      <button
        onClick={() => ref.current?.click()}
        title={hasPhoto ? "Change photo" : "Add photo"}
        style={{ background: "transparent", border: "1px solid #D8D3C4", color: "#0E5A37", borderRadius: 7, padding: "4px 9px", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}
      >
        {hasPhoto ? "Change photo" : "Add photo"}
      </button>
    </>
  );
}
