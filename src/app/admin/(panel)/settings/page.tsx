"use client";

import { useEffect, useState } from "react";
import { Reveal } from "@/components/Reveal";
import { useToast, Toast } from "@/components/Toast";
import { PageHeader } from "@/components/admin/ui";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

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

  if (!s) return <p className="text-muted-foreground">Loading settings…</p>;

  return (
    <Reveal style={{ maxWidth: 640 }}>
      <PageHeader
        title="Election settings"
        subtitle="This system is white-label — reuse it for any faculty or department by updating these fields."
      />
      <Card className="gap-4 p-6">
        <Field label="Election title">
          <Input value={s.electionTitle} onChange={(e) => update("electionTitle", e.target.value)} />
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
        <div className="flex flex-wrap gap-3.5">
          <Field label="Voting opens" className="min-w-[220px] flex-1">
            <Input type="datetime-local" value={toLocalInput(s.votingOpensAt)} onChange={(e) => update("votingOpensAt", e.target.value)} />
          </Field>
          <Field label="Voting closes" className="min-w-[220px] flex-1">
            <Input type="datetime-local" value={toLocalInput(s.votingClosesAt)} onChange={(e) => update("votingClosesAt", e.target.value)} />
          </Field>
        </div>
        <div className="flex items-center gap-3">
          <Switch
            id="votingOpen"
            checked={s.votingOpen}
            onCheckedChange={(checked) => update("votingOpen", checked)}
          />
          <Label htmlFor="votingOpen" className="cursor-pointer text-sm font-semibold text-foreground">
            Voting is currently open
          </Label>
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
