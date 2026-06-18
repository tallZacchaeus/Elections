"use client";

import { useEffect, useState } from "react";
import { Reveal } from "@/components/Reveal";
import { PageHeader, StatCard, LivePill, card } from "@/components/admin/ui";

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

  useEffect(() => {
    fetch("/api/overview")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) return <p style={{ color: "#5C6B61" }}>Loading overview…</p>;

  return (
    <Reveal stagger={0.06}>
      <PageHeader
        title="Election overview"
        subtitle="Live status of the PASA Executive Election 2026."
        right={<LivePill open={data.votingOpen} />}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14, marginBottom: 22 }}>
        <StatCard label="Votes cast" value={data.votesCast} color="#0E5A37" />
        <StatCard label="Eligible voters" value={data.totalEligible} />
        <StatCard label="Turnout" value={`${data.turnoutPct}%`} />
        <StatCard label="Flagged attempts" value={data.flaggedCount} color="#B0651F" />
      </div>
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
          <h3 className="font-serif" style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Turnout progress</h3>
          <span style={{ fontSize: 12.5, color: "#5C6B61" }}>{data.votesCast} of {data.totalEligible} voters</span>
        </div>
        <div style={{ height: 14, background: "#EDEADD", borderRadius: 99, overflow: "hidden", marginBottom: 18 }}>
          <div style={{ height: "100%", background: "linear-gradient(90deg,#0E5A37,#2DA05A)", borderRadius: 99, width: `${data.turnoutPct}%`, transition: "width .8s ease" }} />
        </div>
        <div style={{ display: "flex", gap: 22, flexWrap: "wrap", fontSize: 13, color: "#46554C" }}>
          <span>Opened: {fmt(data.opensAt)}</span>
          <span>Closes: {fmt(data.closesAt)}</span>
          <span>Positions: {data.positions}</span>
          <span>Candidates: {data.candidates}</span>
        </div>
      </div>
    </Reveal>
  );
}
