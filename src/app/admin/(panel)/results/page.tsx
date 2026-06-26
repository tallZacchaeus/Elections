"use client";

import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { PageHeader } from "@/components/admin/ui";
import { NoElection } from "@/components/admin/NoElection";
import { Button } from "@/components/ui/button";
import { ResultsBars, type ResultPosition } from "@/components/results/ResultsBars";
import { useLiveData } from "@/hooks/useLiveData";

interface Results {
  election: { id: string; title: string; status: string } | null;
  positions: ResultPosition[];
  votesCast: number;
  turnoutPct: number;
  flaggedCount: number;
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
        <ResultsBars positions={data.positions} />
      )}
    </Reveal>
  );
}
