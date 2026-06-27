"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export interface RescheduleTarget {
  id: string;
  title: string;
  status: string;
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

/**
 * Put an election (back) into Draft with a schedule, so it can open and close
 * itself — without raw SQL. Render conditionally and key by election id so the
 * form initialises fresh each time it opens.
 */
export function RescheduleDialog({
  election,
  onClose,
  onSaved,
}: {
  election: RescheduleTarget;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [opensAt, setOpensAt] = useState(toLocalInput(election.votingOpensAt));
  const [closesAt, setClosesAt] = useState(toLocalInput(election.votingClosesAt));
  const [auto, setAuto] = useState(election.autoSchedule);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (auto && (!opensAt || !closesAt)) {
      setError("Set both an open and a close time to schedule automatically.");
      return;
    }
    if (opensAt && closesAt && new Date(closesAt) <= new Date(opensAt)) {
      setError("The close time must be after the open time.");
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch(`/api/admin/elections/${election.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "DRAFT",
        autoSchedule: auto,
        votingOpensAt: opensAt ? new Date(opensAt).toISOString() : null,
        votingClosesAt: closesAt ? new Date(closesAt).toISOString() : null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      onSaved(
        auto
          ? "Scheduled — the election will open and close automatically."
          : "Reset to draft. Open it manually when ready.",
      );
    } else {
      setError((await res.json().catch(() => ({}))).error ?? "Could not reschedule.");
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reschedule “{election.title}”</DialogTitle>
          <DialogDescription>
            Sets the voting window and returns the election to <strong>Draft</strong> so it can
            run again. Voters see “no active election” until it opens. Votes, candidates and the
            roster are not affected.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-wrap gap-3.5">
            <div className="min-w-[200px] flex-1">
              <Label className="mb-1.5">Voting opens</Label>
              <Input type="datetime-local" value={opensAt} onChange={(e) => setOpensAt(e.target.value)} />
            </div>
            <div className="min-w-[200px] flex-1">
              <Label className="mb-1.5">Voting closes</Label>
              <Input type="datetime-local" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} />
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-md border bg-muted/40 px-3 py-3">
            <Switch id="reschedule-auto" checked={auto} onCheckedChange={setAuto} />
            <div>
              <Label htmlFor="reschedule-auto" className="cursor-pointer text-sm font-semibold text-foreground">
                Open &amp; close automatically at these times
              </Label>
              <p className="mt-1 text-[12.5px] text-muted-foreground">
                On: it opens itself at the open time and closes at the close time. Off: it stays
                in Draft and you open it manually.
              </p>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
