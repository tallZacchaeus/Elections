"use client";

import { Card } from "@/components/ui/card";
import type { LevelStat } from "@/components/results/ResultsAnalysis";

const LABELS: Record<string, string> = {
  ND: "ND (National Diploma)",
  HND: "HND (Higher National Diploma)",
  OTHER: "Other",
};

/**
 * Electorate breakdown by programme level (ND / HND): how many voters of each
 * level are eligible and how many have voted. Derived from matric prefixes;
 * ballots remain anonymous so this is not tied to candidate choices.
 */
export function LevelBreakdown({ levels }: { levels: LevelStat[] }) {
  if (!levels || levels.length === 0) return null;

  return (
    <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
      {levels.map((l) => {
        const notVoted = l.eligible - l.voted;
        return (
          <Card key={l.level} className="gap-3 p-5">
            <div className="flex items-baseline justify-between">
              <h4 className="font-display text-base font-bold text-foreground">
                {LABELS[l.level] ?? l.level}
              </h4>
              <span className="text-xs font-semibold text-muted-foreground">
                {l.turnoutPct}% turnout
              </span>
            </div>
            <div className="text-3xl font-bold tabular-nums text-foreground">
              {l.eligible.toLocaleString()}
              <span className="ml-1 text-sm font-medium text-muted-foreground">eligible</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-700"
                style={{ width: `${l.turnoutPct}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-primary">{l.voted.toLocaleString()} voted</span>
              <span className="text-muted-foreground">{notVoted.toLocaleString()} not voted</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
