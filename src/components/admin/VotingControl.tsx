"use client";

import { useState } from "react";
import { Lock, LockOpen, TriangleAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast, Toast } from "@/components/Toast";
import { cn } from "@/lib/utils";

function fmt(dt: string | null): string {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "—";
  }
}

/**
 * Prominent open/close control for the managed election. Flips the election
 * status (OPEN ↔ CLOSED) and surfaces when the scheduled close has elapsed.
 */
export function VotingControl({
  electionId,
  votingOpen,
  closesAt,
  onChange,
}: {
  electionId: string;
  votingOpen: boolean;
  closesAt: string | null;
  onChange: (open: boolean) => void;
}) {
  const { toast, showToast } = useToast();
  const [busy, setBusy] = useState(false);

  const timeUp = !!closesAt && new Date(closesAt).getTime() < Date.now();

  async function toggle() {
    const next = !votingOpen;
    const msg = next
      ? "Open voting? Voters will be able to cast ballots, and any other open election will be closed."
      : "Close voting now? Voters will no longer be able to cast ballots.";
    if (!confirm(msg)) return;

    setBusy(true);
    const res = await fetch(`/api/admin/elections/${electionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next ? "OPEN" : "CLOSED" }),
    });
    setBusy(false);
    if (res.ok) {
      onChange(next);
      showToast(next ? "Voting is now open." : "Voting is now closed.");
    } else {
      showToast("Could not update voting status.");
    }
  }

  return (
    <Card className="mb-6 gap-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex size-11 flex-none items-center justify-center rounded-full",
              votingOpen
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground",
            )}
          >
            {votingOpen ? <LockOpen className="size-5" /> : <Lock className="size-5" />}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-foreground">
                Voting is {votingOpen ? "open" : "closed"}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  votingOpen
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "inline-block size-1.5 rounded-full",
                    votingOpen ? "live-dot bg-primary" : "bg-muted-foreground/60",
                  )}
                />
                {votingOpen ? "Live" : "Paused"}
              </span>
            </div>
            <p className="text-[12.5px] text-muted-foreground">
              Scheduled close: {fmt(closesAt)}
            </p>
          </div>
        </div>

        <Button
          onClick={toggle}
          disabled={busy}
          size="lg"
          variant={votingOpen ? "destructive" : "default"}
          className="gap-2"
        >
          {votingOpen ? <Lock className="size-4" /> : <LockOpen className="size-4" />}
          {busy ? "Updating…" : votingOpen ? "Close voting" : "Open voting"}
        </Button>
      </div>

      {votingOpen && timeUp && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <TriangleAlert className="mt-0.5 size-4 flex-none" />
          <span>
            The scheduled close time has passed, but voting is still open. Close
            voting to stop accepting ballots.
          </span>
        </div>
      )}

      <Toast message={toast} />
    </Card>
  );
}
