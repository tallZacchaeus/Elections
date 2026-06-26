"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/Reveal";
import { Avatar } from "@/components/Avatar";
import { useToast, Toast } from "@/components/Toast";
import { PageHeader } from "@/components/admin/ui";
import { NoElection } from "@/components/admin/NoElection";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

interface Candidate {
  id: string;
  name: string;
  nickname: string;
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
  const [noElection, setNoElection] = useState(false);

  const [posId, setPosId] = useState("");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
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
    if (res.status === 409) {
      setNoElection(true);
      setLoading(false);
      return;
    }
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
      body: JSON.stringify({ positionId: posId, name, nickname, level, manifesto }),
    });
    if (res.ok) {
      const created = await res.json();
      if (photoFile && created.candidate?.id) {
        await uploadPhoto(created.candidate.id, photoFile);
      }
      setName("");
      setNickname("");
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

  if (noElection) return <NoElection />;
  if (loading) return <p className="text-muted-foreground">Loading candidates…</p>;

  return (
    <Reveal>
      <PageHeader title="Manage candidates" subtitle="Add or review accredited candidates for each position." />

      {/* Add candidate */}
      <Card className="mb-4.5 grid grid-cols-[1fr_2fr] items-start gap-3 p-5">
        <div>
          <Label className="mb-1.5">Position</Label>
          <Select value={posId} onValueChange={setPosId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a position" />
            </SelectTrigger>
            <SelectContent>
              {positions.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1.5">Candidate name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
        </div>
        <div>
          <Label className="mb-1.5">Nickname (optional)</Label>
          <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="e.g. The Bridge" />
        </div>
        <div>
          <Label className="mb-1.5">Level / standing (optional)</Label>
          <Input value={level} onChange={(e) => setLevel(e.target.value)} placeholder="e.g. HND II · Public Admin" />
        </div>
        <div>
          <Label className="mb-1.5">Manifesto (optional)</Label>
          <Textarea value={manifesto} onChange={(e) => setManifesto(e.target.value)} rows={2} placeholder="Short manifesto…" />
        </div>
        <div className="col-span-full">
          <Label className="mb-1.5">Photo (optional)</Label>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              ref={addFileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              className="max-w-xs text-sm"
            />
            <span className="text-xs text-muted-foreground">
              JPG, PNG, WebP or GIF · up to 4 MB. You can also add a photo after creating the candidate.
            </span>
          </div>
        </div>
        <div className="col-span-full">
          <Button onClick={addCandidate}>Add candidate</Button>
        </div>
      </Card>

      {/* Add position */}
      <div className="mb-6 flex flex-wrap items-center gap-2.5">
        <Input
          value={newPosTitle}
          onChange={(e) => setNewPosTitle(e.target.value)}
          placeholder="New position title"
          className="max-w-[280px]"
        />
        <Button variant="outline" onClick={addPosition}>+ Add position</Button>
      </div>

      <div className="flex flex-col gap-4.5">
        {positions.map((pos) => (
          <Card key={pos.id} className="gap-3.5 p-5">
            <div className="flex items-center justify-between gap-2.5">
              <h3 className="text-base font-semibold text-foreground">{pos.title}</h3>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{pos.candidates.length} candidates</Badge>
                <Button variant="destructive" size="sm" onClick={() => deletePosition(pos.id, pos.title)}>
                  Delete
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {pos.candidates.length === 0 && (
                <span className="text-sm text-muted-foreground">No candidates yet.</span>
              )}
              {pos.candidates.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-2.5 rounded-lg border bg-muted/40 py-2 pr-2.5 pl-2"
                >
                  <Avatar name={c.name} size={34} bg={c.avatarBg} photoUrl={c.photoUrl} fontSize={13} />
                  <div className="leading-tight">
                    <div className="text-[13.5px] font-semibold text-foreground">
                      {c.name}
                      {c.nickname && (
                        <span className="ml-1 font-normal text-muted-foreground">“{c.nickname}”</span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground">{c.level}</div>
                  </div>
                  <div className="ml-1 flex items-center gap-1">
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
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => removePhoto(c.id)}
                        title="Remove photo"
                      >
                        clear
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => deleteCandidate(c.id, c.name)}
                      aria-label={`Remove ${c.name}`}
                      title="Remove candidate"
                      className="text-destructive"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
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
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          if (ref.current) ref.current.value = "";
        }}
      />
      <Button
        variant="outline"
        size="xs"
        onClick={() => ref.current?.click()}
        title={hasPhoto ? "Change photo" : "Add photo"}
      >
        {hasPhoto ? "Change photo" : "Add photo"}
      </Button>
    </>
  );
}
