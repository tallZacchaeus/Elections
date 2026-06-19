"use client";

import { useMemo } from "react";
import { Flag, Download } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { PageHeader } from "@/components/admin/ui";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLiveData } from "@/hooks/useLiveData";

interface FlaggedAttempt {
  id: string;
  matricNumber: string;
  reference: string;
  reason: string;
  createdAt: string;
}

function fmt(dt: string): string {
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

export default function FlaggedPage() {
  const flaggedData = useLiveData<{ attempts: FlaggedAttempt[] }>("/api/admin/flagged");
  const attempts = useMemo(() => flaggedData?.attempts ?? [], [flaggedData]);

  const byMatric = useMemo(() => {
    const map = new Map<string, { matricNumber: string; attempts: number; lastAt: string }>();
    for (const f of attempts) {
      const cur = map.get(f.matricNumber);
      if (cur) {
        cur.attempts += 1;
        if (f.createdAt > cur.lastAt) cur.lastAt = f.createdAt;
      } else {
        map.set(f.matricNumber, { matricNumber: f.matricNumber, attempts: 1, lastAt: f.createdAt });
      }
    }
    return [...map.values()].sort(
      (a, b) => b.attempts - a.attempts || a.matricNumber.localeCompare(b.matricNumber),
    );
  }, [attempts]);

  function exportCsv() {
    const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
    const lines = [["Matric number", "Repeat attempts", "Last attempt"].map(esc).join(",")];
    for (const r of byMatric) {
      lines.push([r.matricNumber, String(r.attempts), fmt(r.lastAt)].map(esc).join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flagged-attempts-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Reveal>
      <PageHeader
        title="Flagged attempts"
        subtitle="Matric numbers that tried to vote again after already casting a ballot. The first ballot stands; every repeat attempt is blocked."
        right={
          byMatric.length > 0 ? (
            <Button size="sm" className="gap-2" onClick={exportCsv}>
              <Download className="size-3.5" /> Export CSV
            </Button>
          ) : undefined
        }
      />

      {!flaggedData ? (
        <p className="text-muted-foreground">Loading flagged attempts…</p>
      ) : (
        <Card className="gap-0 overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <Flag className="size-5 text-destructive" />
              <div>
                <div className="text-sm font-semibold text-foreground">Repeat-vote attempts</div>
                <div className="text-xs text-muted-foreground">
                  {byMatric.length} matric{byMatric.length === 1 ? "" : "s"} · {attempts.length} attempt{attempts.length === 1 ? "" : "s"} total
                </div>
              </div>
            </div>
          </div>

          {byMatric.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">
              No flagged attempts so far.
            </p>
          ) : (
            <div className="max-h-[600px] overflow-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-5 py-2.5 font-medium">Matric number</th>
                    <th className="px-5 py-2.5 font-medium">Repeat attempts</th>
                    <th className="px-5 py-2.5 font-medium">Last attempt</th>
                  </tr>
                </thead>
                <tbody>
                  {byMatric.map((r) => (
                    <tr key={r.matricNumber} className="border-b border-border/60 last:border-0">
                      <td className="px-5 py-2.5 font-semibold tracking-wide text-foreground">{r.matricNumber}</td>
                      <td className="px-5 py-2.5">
                        <Badge variant={r.attempts > 1 ? "default" : "secondary"}>{r.attempts}&times;</Badge>
                      </td>
                      <td className="px-5 py-2.5 text-muted-foreground">{fmt(r.lastAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </Reveal>
  );
}
