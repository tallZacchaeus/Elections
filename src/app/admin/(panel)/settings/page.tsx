"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { useToast, Toast } from "@/components/Toast";
import { PageHeader } from "@/components/admin/ui";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { NoElection } from "@/components/admin/NoElection";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface ElectionSettings {
  id: string;
  title: string;
  institution: string;
  faculty: string;
  department: string;
  status: string;
  winThresholdPct: number;
  autoSchedule: boolean;
  votingOpensAt: string | null;
  votingClosesAt: string | null;
}

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export default function SettingsPage() {
  const { toast, showToast } = useToast();
  const [s, setS] = useState<ElectionSettings | null>(null);
  const [noElection, setNoElection] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(async (r) => {
        if (r.status === 409) return setNoElection(true);
        const json = await r.json();
        setS(json.election);
      })
      .catch(() => {});
  }, []);

  function update<K extends keyof ElectionSettings>(key: K, value: ElectionSettings[K]) {
    setS((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function save() {
    if (!s) return;
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: s.title,
        institution: s.institution,
        faculty: s.faculty,
        department: s.department,
        winThresholdPct: s.winThresholdPct,
        autoSchedule: s.autoSchedule,
        votingOpensAt: s.votingOpensAt ? new Date(s.votingOpensAt).toISOString() : null,
        votingClosesAt: s.votingClosesAt ? new Date(s.votingClosesAt).toISOString() : null,
      }),
    });
    setSaving(false);
    showToast(res.ok ? "Election settings saved." : "Could not save settings.");
  }

  if (noElection) return <NoElection />;
  if (!s) return <p className="text-muted-foreground">Loading settings…</p>;

  return (
    <Reveal style={{ maxWidth: 640 }}>
      <PageHeader
        title="Election settings"
        subtitle="Editing the election you are currently managing. White-label these fields for any faculty or department."
        right={<StatusBadge status={s.status} />}
      />
      <Card className="gap-4 p-6">
        <Field label="Election title">
          <Input value={s.title} onChange={(e) => update("title", e.target.value)} />
        </Field>
        <Field label="Institution">
          <Input value={s.institution} onChange={(e) => update("institution", e.target.value)} />
        </Field>
        <Field label="Faculty">
          <Input value={s.faculty} onChange={(e) => update("faculty", e.target.value)} />
        </Field>
        <Field label="Department">
          <Input value={s.department} onChange={(e) => update("department", e.target.value)} />
        </Field>
        <Field label="Winning threshold (% of eligible voters)">
          <Input
            type="number"
            min={1}
            max={100}
            value={s.winThresholdPct}
            onChange={(e) => update("winThresholdPct", Number(e.target.value))}
            className="max-w-[160px]"
          />
          <p className="mt-1.5 text-[12.5px] text-muted-foreground">
            A candidate must reach this share of <strong>all eligible voters</strong> to be
            declared the winner (e.g. 60 for a two-thirds-style rule, 50 for a simple majority).
            Applies only to this election.
          </p>
        </Field>
        <div className="flex flex-wrap gap-3.5">
          <Field label="Voting opens" className="min-w-[220px] flex-1">
            <Input type="datetime-local" value={toLocalInput(s.votingOpensAt)} onChange={(e) => update("votingOpensAt", e.target.value)} />
          </Field>
          <Field label="Voting closes" className="min-w-[220px] flex-1">
            <Input type="datetime-local" value={toLocalInput(s.votingClosesAt)} onChange={(e) => update("votingClosesAt", e.target.value)} />
          </Field>
        </div>
        <div className="flex items-start gap-3 rounded-md border bg-muted/40 px-3 py-3">
          <Switch
            id="autoSchedule"
            checked={s.autoSchedule}
            onCheckedChange={(c) => update("autoSchedule", c)}
          />
          <div>
            <Label htmlFor="autoSchedule" className="cursor-pointer text-sm font-semibold text-foreground">
              Open &amp; close automatically at the scheduled times
            </Label>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              When on, this election opens itself at <strong>Voting opens</strong> and closes at{" "}
              <strong>Voting closes</strong> — no manual action needed. Set the times above, leave the
              election in <strong>Draft</strong>, and it will go live on schedule. When off, you open and
              close it manually from the{" "}
              <Link href="/admin/elections" className="font-semibold text-primary">Elections</Link> page.
            </p>
          </div>
        </div>
        <Button onClick={save} disabled={saving} className="self-start">
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </Card>
      <Toast message={toast} />
    </Reveal>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="mb-1.5">{label}</Label>
      {children}
    </div>
  );
}
