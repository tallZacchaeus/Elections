"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Reveal } from "@/components/Reveal";
import { useToast, Toast } from "@/components/Toast";
import { PageHeader } from "@/components/admin/ui";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface ElectionRow {
  id: string;
  title: string;
  institution: string;
  faculty: string;
  department: string;
  status: "DRAFT" | "OPEN" | "CLOSED" | "ARCHIVED";
  autoSchedule: boolean;
  votingOpensAt: string | null;
  votingClosesAt: string | null;
  positions: number;
  voters: number;
  votesCast: number;
  createdAt: string;
}

function fmt(dt: string | null): string {
  if (!dt) return "";
  try {
    return new Date(dt).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}

const DEFAULTS = {
  institution: "Oyo State College of Agriculture and Technology",
  faculty: "Faculty of Management & Communication Studies",
  department: "Department of Public Administration",
};

export default function ElectionsPage() {
  const router = useRouter();
  const { toast, showToast } = useToast();
  const [rows, setRows] = useState<ElectionRow[]>([]);
  const [managedId, setManagedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [title, setTitle] = useState("");
  const [institution, setInstitution] = useState(DEFAULTS.institution);
  const [faculty, setFaculty] = useState(DEFAULTS.faculty);
  const [department, setDepartment] = useState(DEFAULTS.department);

  async function load() {
    const res = await fetch("/api/admin/elections");
    const json = await res.json();
    setRows(json.elections ?? []);
    setManagedId(json.managedId ?? null);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function createElection() {
    if (!title.trim()) return showToast("Enter an election title.");
    setCreating(true);
    const res = await fetch("/api/admin/elections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, institution, faculty, department }),
    });
    setCreating(false);
    if (res.ok) {
      setTitle("");
      showToast("Election created — now managing it. Add positions, candidates and a roster, then open it.");
      await load();
      router.refresh();
    } else {
      showToast((await res.json()).error ?? "Could not create election.");
    }
  }

  async function manage(id: string) {
    const res = await fetch("/api/admin/elections/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setManagedId(id);
      showToast("Now managing this election.");
      router.refresh();
    }
  }

  async function setStatus(id: string, status: string, note: string) {
    if (status === "OPEN") {
      if (!confirm("Open this election for voting? Any other open election will be closed automatically.")) return;
    }
    const res = await fetch(`/api/admin/elections/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      showToast(note);
      await load();
      router.refresh();
    } else {
      showToast((await res.json()).error ?? "Could not update election.");
    }
  }

  async function remove(id: string, t: string) {
    if (!confirm(`Permanently delete "${t}" and ALL its candidates, roster and votes? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/elections/${id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Election deleted.");
      await load();
      router.refresh();
    }
  }

  return (
    <Reveal>
      <PageHeader
        title="Elections"
        subtitle="Create and run multiple elections over time. Open one for voting, close it when done, then start the next."
      />

      {/* Create */}
      <Card className="mb-6 gap-4 p-6">
        <h3 className="text-lg font-semibold text-foreground">Start a new election</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label className="mb-1.5">Election title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. PASA Executive Election 2027" />
          </div>
          <div>
            <Label className="mb-1.5">Institution</Label>
            <Input value={institution} onChange={(e) => setInstitution(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5">Faculty</Label>
            <Input value={faculty} onChange={(e) => setFaculty(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5">Department</Label>
            <Input value={department} onChange={(e) => setDepartment(e.target.value)} />
          </div>
        </div>
        <Button onClick={createElection} disabled={creating} className="self-start">
          {creating ? "Creating…" : "Create election"}
        </Button>
      </Card>

      {/* List */}
      {loading ? (
        <p className="text-muted-foreground">Loading elections…</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground">No elections yet. Create your first one above.</p>
      ) : (
        <div className="flex flex-col gap-3.5">
          {rows.map((e) => {
            const isManaged = e.id === managedId;
            return (
              <Card key={e.id} className={`gap-0 p-5 ${isManaged ? "border-2 border-primary" : ""}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-lg font-semibold text-foreground">{e.title}</h3>
                      <StatusBadge status={e.status} />
                      {isManaged && <Badge variant="secondary">Managing</Badge>}
                      {e.autoSchedule && <Badge variant="outline">Auto-scheduled</Badge>}
                    </div>
                    <div className="mt-1.5 text-[12.5px] text-muted-foreground">
                      {e.department} · {e.positions} positions · {e.voters} voters · {e.votesCast} votes cast
                    </div>
                    {e.autoSchedule && e.status === "DRAFT" && e.votingOpensAt && (
                      <div className="mt-1 text-[12.5px] font-medium text-primary">
                        Opens automatically {fmt(e.votingOpensAt)}
                      </div>
                    )}
                    {e.autoSchedule && e.status === "OPEN" && e.votingClosesAt && (
                      <div className="mt-1 text-[12.5px] font-medium text-primary">
                        Closes automatically {fmt(e.votingClosesAt)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {!isManaged && (
                      <Button variant="outline" size="sm" onClick={() => manage(e.id)}>Manage</Button>
                    )}
                    {(e.status === "DRAFT" || e.status === "CLOSED") && (
                      <Button size="sm" onClick={() => setStatus(e.id, "OPEN", "Election is now open for voting.")}>
                        {e.status === "CLOSED" ? "Re-open" : "Open voting"}
                      </Button>
                    )}
                    {e.status === "OPEN" && (
                      <Button variant="destructive" size="sm" onClick={() => setStatus(e.id, "CLOSED", "Voting closed.")}>
                        Close voting
                      </Button>
                    )}
                    {e.status === "CLOSED" && (
                      <Button variant="outline" size="sm" onClick={() => setStatus(e.id, "ARCHIVED", "Election archived.")}>
                        Archive
                      </Button>
                    )}
                    {e.status === "ARCHIVED" && (
                      <Button variant="outline" size="sm" onClick={() => setStatus(e.id, "CLOSED", "Election unarchived.")}>
                        Unarchive
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => remove(e.id, e.title)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <Toast message={toast} />
    </Reveal>
  );
}
