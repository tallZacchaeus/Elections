"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Candidate {
  id: string;
  name: string;
  votes: number;
  pct: number;
  pctOfEligible: number;
  meetsThreshold: boolean;
  votesNeeded: number;
  leading: boolean;
}
interface Position {
  id: string;
  title: string;
  total: number;
  thresholdVotes: number;
  winnerName: string | null;
  candidates: Candidate[];
}
interface Results {
  positions: Position[];
  votesCast: number;
  totalEligible: number;
  turnoutPct: number;
  flaggedCount: number;
  thresholdPct: number;
  thresholdVotes: number;
}
interface Election {
  institution: string;
  faculty: string;
  department: string;
  title: string;
}

/**
 * The printable official result report, shared by the admin and observer
 * portals. Election identity comes from the public ballot endpoint so it
 * works for any authenticated role.
 */
export function ResultReportDocument({ backHref }: { backHref: string }) {
  const [results, setResults] = useState<Results | null>(null);
  const [election, setElection] = useState<Election | null>(null);
  const [generatedAt, setGeneratedAt] = useState("");

  useEffect(() => {
    setGeneratedAt(
      new Date().toLocaleString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    );
    fetch("/api/results").then((r) => r.json()).then(setResults).catch(() => {});
    fetch("/api/ballot").then((r) => r.json()).then((j) => setElection(j.election)).catch(() => {});
  }, []);

  if (!results || !election) {
    return <p className="text-muted-foreground">Preparing report…</p>;
  }

  const winners = results.positions.filter((p) => p.winnerName);

  return (
    <>
      <style>{`
        @page { size: A4; margin: 16mm; }
        @media print {
          html, body { background: #fff !important; }
          .report-sheet { box-shadow: none !important; border: none !important; margin: 0 !important; padding: 0 !important; }
        }
      `}</style>

      {/* Toolbar (not printed) */}
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link href={backHref}><ArrowLeft className="size-4" /> Back</Link>
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            Tip: choose “Save as PDF” as the destination in the print dialog.
          </span>
          <Button onClick={() => window.print()} className="gap-2">
            <Printer className="size-4" /> Download PDF
          </Button>
        </div>
      </div>

      {/* The printable document */}
      <div className="report-sheet mx-auto max-w-[820px] rounded-lg border border-border bg-white p-10 text-[#1a1a1a] shadow-sm">
        {/* Header */}
        <header className="border-b-2 border-[#0e5a37] pb-5 text-center">
          <h1 className="text-lg font-extrabold uppercase tracking-wide text-[#0e5a37]">
            {election.institution}
          </h1>
          <p className="mt-1 text-sm font-semibold">{election.faculty}</p>
          <p className="text-sm">{election.department}</p>
          <h2 className="mt-4 text-base font-bold">{election.title}</h2>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a6b12]">
            Official Result Report
          </p>
          <p className="mt-1 text-xs text-[#555]">Generated {generatedAt}</p>
        </header>

        {/* Summary */}
        <section className="mt-5 grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm sm:grid-cols-4">
          <Summary label="Eligible voters" value={results.totalEligible} />
          <Summary label="Votes cast" value={results.votesCast} />
          <Summary label="Turnout" value={`${results.turnoutPct}%`} />
          <Summary
            label={`Win line (${results.thresholdPct}%)`}
            value={`${results.thresholdVotes} votes`}
          />
        </section>

        <p className="mt-4 rounded border border-[#e6dabf] bg-[#faf6ec] px-3 py-2 text-xs">
          <strong>Winning rule:</strong> a candidate must obtain at least{" "}
          {results.thresholdPct}% of all {results.totalEligible} eligible voters
          ({results.thresholdVotes} votes) to be declared the winner of their position.
        </p>

        {/* Per-position tables */}
        {results.positions.map((p) => (
          <section key={p.id} className="mt-6 break-inside-avoid">
            <div className="mb-1.5 flex items-baseline justify-between">
              <h3 className="text-sm font-bold text-[#0e5a37]">{p.title}</h3>
              <span className="text-xs text-[#555]">
                {p.total} votes cast · win line {p.thresholdVotes}
              </span>
            </div>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[#0e5a37] text-left text-white">
                  <th className="border border-[#0e5a37] px-2 py-1.5 font-semibold">Candidate</th>
                  <th className="border border-[#0e5a37] px-2 py-1.5 text-right font-semibold">Votes</th>
                  <th className="border border-[#0e5a37] px-2 py-1.5 text-right font-semibold">% of eligible</th>
                  <th className="border border-[#0e5a37] px-2 py-1.5 text-right font-semibold">% of cast</th>
                  <th className="border border-[#0e5a37] px-2 py-1.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {[...p.candidates]
                  .sort((a, b) => b.votes - a.votes)
                  .map((c) => (
                    <tr key={c.id} className={c.meetsThreshold ? "bg-[#eaf3ee] font-semibold" : ""}>
                      <td className="border border-[#d8d2c2] px-2 py-1.5">{c.name}</td>
                      <td className="border border-[#d8d2c2] px-2 py-1.5 text-right tabular-nums">{c.votes}</td>
                      <td className="border border-[#d8d2c2] px-2 py-1.5 text-right tabular-nums">{c.pctOfEligible}%</td>
                      <td className="border border-[#d8d2c2] px-2 py-1.5 text-right tabular-nums">{c.pct}%</td>
                      <td className="border border-[#d8d2c2] px-2 py-1.5">
                        {c.meetsThreshold
                          ? "WINNER — meets threshold"
                          : `Below threshold (needs ${c.votesNeeded} more)`}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </section>
        ))}

        {/* Declared winners */}
        <section className="mt-7 break-inside-avoid">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-[#0e5a37]">
            Declared winners
          </h3>
          {winners.length === 0 ? (
            <p className="text-sm text-[#555]">
              No candidate has reached the {results.thresholdPct}% threshold; no winner can be
              declared at this time.
            </p>
          ) : (
            <ul className="text-sm">
              {results.positions.map((p) => (
                <li key={p.id} className="flex justify-between border-b border-dashed border-[#ddd] py-1">
                  <span>{p.title}</span>
                  <span className="font-semibold">
                    {p.winnerName ?? "— no winner (threshold not met)"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Signatures */}
        <section className="mt-12 grid grid-cols-2 gap-10 break-inside-avoid">
          <SignatureBlock role="Chairman, Electoral Committee" />
          <SignatureBlock role="Secretary, Electoral Committee" />
        </section>

        <p className="mt-10 text-center text-[10px] text-[#888]">
          This document was generated by the PASA Election System. Figures reflect the tally at
          the time of generation ({generatedAt}).
        </p>
      </div>
    </>
  );
}

function Summary({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-[#888]">{label}</div>
      <div className="text-base font-bold tabular-nums">{value}</div>
    </div>
  );
}

function SignatureBlock({ role }: { role: string }) {
  return (
    <div className="text-sm">
      <div className="mt-10 border-t border-[#1a1a1a]" />
      <div className="mt-1 font-semibold">{role}</div>
      <div className="mt-4 flex items-end gap-2 text-xs text-[#555]">
        <span>Name:</span>
        <span className="flex-1 border-b border-dotted border-[#999]" />
      </div>
      <div className="mt-3 flex items-end gap-2 text-xs text-[#555]">
        <span>Sign &amp; Date:</span>
        <span className="flex-1 border-b border-dotted border-[#999]" />
      </div>
    </div>
  );
}
