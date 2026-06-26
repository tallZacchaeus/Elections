"use client";

import { useEffect, useState } from "react";
import { Reveal } from "@/components/Reveal";
import { PageHeader, StatCard, LivePill } from "@/components/admin/ui";
import { VotingControl } from "@/components/admin/VotingControl";
import { NoElection } from "@/components/admin/NoElection";
import { Card } from "@/components/ui/card";

interface Overview {
  election: { id: string; title: string; status: string };
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
  const [noElection, setNoElection] = useState(false);

  useEffect(() => {
    fetch("/api/overview")
      .then(async (r) => {
        if (r.status === 409) return setNoElection(true);
        setData(await r.json());
      })
      .catch(() => {});
  }, []);

  if (noElection) return <NoElection />;
  if (!data) return <p className="text-muted-foreground">Loading overview…</p>;

  return (
    <Reveal stagger={0.06}>
      <PageHeader
        title="Election overview"
        subtitle={`Live status of ${data.election.title}.`}
        right={<LivePill open={data.votingOpen} />}
      />
      <VotingControl
        electionId={data.election.id}
        votingOpen={data.votingOpen}
        closesAt={data.closesAt}
        onChange={(open) =>
          setData((prev) =>
            prev
              ? { ...prev, votingOpen: open, election: { ...prev.election, status: open ? "OPEN" : "CLOSED" } }
              : prev,
          )
        }
      />
      <div className="mb-6 grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
        <StatCard label="Votes cast" value={data.votesCast} />
        <StatCard label="Eligible voters" value={data.totalEligible} />
        <StatCard label="Turnout" value={`${data.turnoutPct}%`} />
        <StatCard label="Flagged attempts" value={data.flaggedCount} />
      </div>
      <Card className="p-5">
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
    </Reveal>
  );
}
