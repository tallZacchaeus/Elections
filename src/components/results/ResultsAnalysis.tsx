"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface AnalysisCandidate {
  id: string;
  name: string;
  votes: number;
  pct: number;
  pctOfEligible: number;
  meetsThreshold: boolean;
  votesNeeded: number;
  leading: boolean;
}
export interface AnalysisPosition {
  id: string;
  title: string;
  total: number;
  thresholdVotes: number;
  winnerId: string | null;
  winnerName: string | null;
  candidates: AnalysisCandidate[];
}
export interface LevelStat {
  level: string;
  eligible: number;
  voted: number;
  turnoutPct: number;
}
export interface AnalysisData {
  positions: AnalysisPosition[];
  votesCast: number;
  totalEligible: number;
  turnoutPct: number;
  thresholdPct: number;
  thresholdVotes: number;
  levels: LevelStat[];
}

/**
 * Detailed per-candidate result analysis built around the win rule:
 * a candidate must reach `thresholdPct`% of ALL eligible voters to win.
 */
export function ResultsAnalysis({ data }: { data: AnalysisData }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Rule banner */}
      <div className="rounded-lg border border-secondary bg-secondary/40 px-4 py-3 text-sm">
        <span className="font-semibold text-foreground">Winning rule:</span>{" "}
        a candidate must secure at least{" "}
        <span className="font-semibold text-foreground">{data.thresholdPct}%</span>{" "}
        of all eligible voters —{" "}
        <span className="font-semibold text-primary">
          {data.thresholdVotes} vote{data.thresholdVotes === 1 ? "" : "s"}
        </span>{" "}
        out of {data.totalEligible} — to be declared winner.
      </div>

      {data.positions.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No positions or candidates have been added yet.
        </p>
      )}

      {data.positions.map((p) => {
        const ranked = [...p.candidates].sort((a, b) => b.votes - a.votes);
        return (
          <Card key={p.id} className="gap-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-base font-bold text-foreground">
                  {p.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {p.total} vote{p.total === 1 ? "" : "s"} cast · win line {p.thresholdVotes}
                </p>
              </div>
              {p.winnerName ? (
                <Badge className="bg-primary text-primary-foreground">
                  Winner: {p.winnerName}
                </Badge>
              ) : (
                <Badge variant="secondary" className="font-medium">
                  No winner yet — threshold not reached
                </Badge>
              )}
            </div>

            <div className="flex flex-col gap-3.5">
              {ranked.map((c) => (
                <CandidateRow key={c.id} c={c} thresholdPct={data.thresholdPct} />
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function CandidateRow({
  c,
  thresholdPct,
}: {
  c: AnalysisCandidate;
  thresholdPct: number;
}) {
  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {c.name}
          {c.meetsThreshold ? (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
              Winner
            </span>
          ) : c.leading ? (
            <span className="rounded-full bg-[#c8932a] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#16241c]">
              Leading
            </span>
          ) : null}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {c.votes} votes · {c.pctOfEligible}% of eligible · {c.pct}% of cast
        </span>
      </div>

      {/* Progress toward the win line (scaled to % of eligible voters) */}
      <div className="relative h-3 rounded-full bg-muted">
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-[width] duration-700",
            c.meetsThreshold ? "bg-primary" : "bg-[#c8932a]",
          )}
          style={{ width: `${Math.min(100, c.pctOfEligible)}%` }}
        />
        {/* The 60% win line marker */}
        <div
          className="absolute -inset-y-1 w-px bg-foreground/70"
          style={{ left: `${thresholdPct}%` }}
          title={`${thresholdPct}% win line`}
        />
      </div>

      <div className="mt-1 text-xs">
        {c.meetsThreshold ? (
          <span className="font-medium text-primary">
            ✓ Meets the {thresholdPct}% threshold
          </span>
        ) : (
          <span className="text-muted-foreground">
            Needs {c.votesNeeded} more vote{c.votesNeeded === 1 ? "" : "s"} to reach the win line
          </span>
        )}
      </div>
    </div>
  );
}
