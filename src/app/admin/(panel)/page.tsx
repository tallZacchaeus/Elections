"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileDown } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { PageHeader, StatCard, LivePill } from "@/components/admin/ui";
import { VotingControl } from "@/components/admin/VotingControl";
import { ResultsAnalysis, type AnalysisData } from "@/components/results/ResultsAnalysis";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  const [data, setData] = useState<Overview | null>(null);
  const [results, setResults] = useState<AnalysisData | null>(null);

  useEffect(() => {
    fetch("/api/overview")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
    fetch("/api/results")
      .then((r) => r.json())
      .then(setResults)
      .catch(() => {});
  }, []);

  if (!data) return <p className="text-muted-foreground">Loading overview…</p>;

  return (
    <Reveal stagger={0.06}>
      <PageHeader
        title="Election overview"
        subtitle="Live status and result analysis."
        right={<LivePill open={data.votingOpen} />}
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
