"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FileDown, Flag, Download } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { PageHeader, StatCard, LivePill } from "@/components/admin/ui";
import { VotingControl } from "@/components/admin/VotingControl";
import { ResultsAnalysis, type AnalysisData } from "@/components/results/ResultsAnalysis";
import { useLiveData } from "@/hooks/useLiveData";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Overview {
  votesCast: number;
  totalEligible: number;
  turnoutPct: number;
  flaggedCount: number;
  positions: number;
  candidates: number;
  votingOpen: boolean;
  opensAt: string | null;
  closesAt: string | null;
}

interface FlaggedAttempt {
  id: string;
  matricNumber: string;
  reference: string;
  reason: string;
  createdAt: string;
}

function fmt(dt: string | null): string {
  if (!dt) return "—";
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
    return "—";
  }
}

export default function OverviewPage() {
  // Overview keeps local state so the voting toggle reflects instantly; it is
  // also polled so other figures stay live.
  const [data, setData] = useState<Overview | null>(null);

  const loadOverview = useCallback(() => {
    fetch("/api/overview")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setData(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadOverview();
    const id = setInterval(loadOverview, 8000);
    const onVisible = () => document.visibilityState === "visible" && loadOverview();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadOverview]);

  const results = useLiveData<AnalysisData>("/api/results");
  const flaggedData = useLiveData<{ attempts: FlaggedAttempt[] }>("/api/admin/flagged");
  const flagged = useMemo(() => flaggedData?.attempts ?? [], [flaggedData]);

  // Aggregate by matric number: how many times each tried to vote again.
  const flaggedByMatric = useMemo(() => {
    const map = new Map<string, { matricNumber: string; attempts: number; lastAt: string }>();
    for (const f of flagged) {
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
  }, [flagged]);

  function exportFlaggedCsv() {
    const header = ["Matric number", "Repeat attempts", "Last attempt"];
    const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
    const lines = [header.map(esc).join(",")];
    for (const r of flaggedByMatric) {
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

  if (!data) return <p className="text-muted-foreground">Loading overview…</p>;

  return (
    <Reveal stagger={0.06}>
      <PageHeader
        title="Election overview"
        subtitle="Live status and result analysis."
        right={
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1.5">
              <span className="live-dot inline-block size-1.5 rounded-full bg-primary" />
              Live
            </Badge>
            <LivePill open={data.votingOpen} />
          </div>
        }
      />
      <VotingControl
        votingOpen={data.votingOpen}
        closesAt={data.closesAt}
        onChange={(open) => setData((prev) => (prev ? { ...prev, votingOpen: open } : prev))}
      />
      <div className="mb-6 grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
        <StatCard label="Votes cast" value={data.votesCast} />
        <StatCard label="Eligible voters" value={data.totalEligible} />
        <StatCard label="Turnout" value={`${data.turnoutPct}%`} />
        <StatCard label="Flagged attempts" value={data.flaggedCount} />
      </div>
      <Card className="mb-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-foreground">Turnout progress</h3>
          <span className="text-[12.5px] text-muted-foreground">{data.votesCast} of {data.totalEligible} voters</span>
        </div>
        <div className="mb-1 h-3.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-700"
            style={{ width: `${data.turnoutPct}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
          <span>Opened: {fmt(data.opensAt)}</span>
          <span>Closes: {fmt(data.closesAt)}</span>
          <span>Positions: {data.positions}</span>
          <span>Candidates: {data.candidates}</span>
        </div>
      </Card>

      {/* Flagged attempts — matric numbers that tried to vote more than once */}
      <Card className="mb-6 gap-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Flag className="size-4 text-destructive" />
            Flagged attempts
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant={flagged.length ? "default" : "secondary"}>
              {flaggedByMatric.length} matric{flaggedByMatric.length === 1 ? "" : "s"} · {flagged.length} attempt{flagged.length === 1 ? "" : "s"}
            </Badge>
            {flaggedByMatric.length > 0 && (
              <Button size="sm" variant="outline" className="gap-2" onClick={exportFlaggedCsv}>
                <Download className="size-3.5" /> Export CSV
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Matric numbers that attempted to vote after already casting a ballot, and how many times
          each tried. The first ballot stands; every repeat attempt is blocked.
        </p>
        {flaggedByMatric.length === 0 ? (
          <p className="text-sm text-muted-foreground">No flagged attempts so far.</p>
        ) : (
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Matric number</th>
                  <th className="py-2 pr-3 font-medium">Repeat attempts</th>
                  <th className="py-2 font-medium">Last attempt</th>
                </tr>
              </thead>
              <tbody>
                {flaggedByMatric.map((r) => (
                  <tr key={r.matricNumber} className="border-b border-border/60 last:border-0">
                    <td className="py-2 pr-3 font-semibold tracking-wide text-foreground">{r.matricNumber}</td>
                    <td className="py-2 pr-3">
                      <Badge variant={r.attempts > 1 ? "default" : "secondary"}>
                        {r.attempts}&times;
                      </Badge>
                    </td>
                    <td className="py-2 text-muted-foreground">{fmt(r.lastAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Result analysis (60% of eligible voters win rule) */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-bold text-foreground">Result analysis</h3>
          <p className="text-sm text-muted-foreground">
            Each candidate&apos;s standing against the {results?.thresholdPct ?? 60}% win threshold.
          </p>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/admin/results/report" target="_blank">
            <FileDown className="size-4" />
            Download PDF report
          </Link>
        </Button>
      </div>
      {results ? (
        <ResultsAnalysis data={results} />
      ) : (
        <p className="text-sm text-muted-foreground">Loading analysis…</p>
      )}
    </Reveal>
  );
}
