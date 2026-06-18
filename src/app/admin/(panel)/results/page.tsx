"use client";

import { useEffect, useState } from "react";
import { Reveal } from "@/components/Reveal";
import { PageHeader, btnGhost } from "@/components/admin/ui";
import { ResultsBars, type ResultPosition } from "@/components/results/ResultsBars";

interface Results {
  positions: ResultPosition[];
  votesCast: number;
  turnoutPct: number;
  flaggedCount: number;
}

export default function AdminResultsPage() {
  const [data, setData] = useState<Results | null>(null);

  useEffect(() => {
    fetch("/api/results")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  function exportAs(format: "csv" | "xls") {
    window.location.href = `/api/export?format=${format}`;
  }

  return (
    <Reveal>
      <PageHeader
        title="Live results"
        subtitle="Tallies update as each ballot is sealed."
        right={
          <div className="no-print" style={{ display: "flex", gap: 8 }}>
            <button onClick={() => exportAs("csv")} style={btnGhost()}>Export CSV</button>
            <button onClick={() => exportAs("xls")} style={btnGhost()}>Export Excel</button>
            <button onClick={() => window.print()} style={btnGhost()}>Export PDF</button>
          </div>
        }
      />
      {!data ? (
        <p style={{ color: "#5C6B61" }}>Loading results…</p>
      ) : (
        <ResultsBars positions={data.positions} />
      )}
    </Reveal>
  );
}
