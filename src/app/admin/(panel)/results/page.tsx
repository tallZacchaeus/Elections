"use client";

import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { PageHeader } from "@/components/admin/ui";
import { NoElection } from "@/components/admin/NoElection";
import { Button } from "@/components/ui/button";
import { ResultsBars, type ResultPosition } from "@/components/results/ResultsBars";
import { ResultsCharts } from "@/components/results/ResultsCharts";
import { useLiveData } from "@/hooks/useLiveData";

interface Results {
  election: { id: string; title: string; status: string } | null;
  positions: ResultPosition[];
  votesCast: number;
  totalEligible: number;
  turnoutPct: number;
  flaggedCount: number;
  levels: { level: string; eligible: number; voted: number; turnoutPct: number }[];
  timeline: { label: string; count: number; cumulative: number }[];
}

export default function AdminResultsPage() {
  const data = useLiveData<Results>("/api/results");

  function exportAs(format: "csv" | "xls") {
    window.location.href = `/api/export?format=${format}`;
  }

  if (data && !data.election) return <NoElection />;

  return (
    <Reveal>
      <PageHeader
        title="Live results"
        subtitle="Tallies update as each ballot is sealed."
        right={
          <div className="no-print flex gap-2">
            <Button variant="outline" size="sm" onClick={() => exportAs("csv")}>Export CSV</Button>
            <Button variant="outline" size="sm" onClick={() => exportAs("xls")}>Export Excel</Button>
            <Button asChild size="sm">
              <Link href="/admin/results/report" target="_blank">PDF report</Link>
            </Button>
          </div>
        }
      />
      {!data ? (
        <p className="text-muted-foreground">Loading results…</p>
      ) : (
        <div className="flex flex-col gap-6">
          <ResultsCharts
            votesCast={data.votesCast}
            totalEligible={data.totalEligible}
            levels={data.levels}
            timeline={data.timeline}
          />
          <div>
            <h2 className="mb-3 font-display text-xl font-bold text-foreground">Per-position results</h2>
            <ResultsBars positions={data.positions} />
          </div>
        </div>
      )}
    </Reveal>
  );
}
