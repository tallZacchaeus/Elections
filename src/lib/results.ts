import { prisma } from "./db";
import { BAR_PALETTE } from "./theme";
import { pct } from "./utils";

export interface ResultCandidate {
  id: string;
  name: string;
  votes: number;
  pct: number;
  leading: boolean;
  barColor: string;
}

export interface ResultPosition {
  id: string;
  title: string;
  total: number;
  candidates: ResultCandidate[];
}

export interface ResultsPayload {
  positions: ResultPosition[];
  votesCast: number;
  totalEligible: number;
  turnoutPct: number;
  flaggedCount: number;
}

/**
 * Compute the full tally from anonymous Vote rows.
 * `votesCast` is the number of voters who have voted (one ballot per voter),
 * which is more meaningful than counting individual position votes.
 */
export async function computeResults(): Promise<ResultsPayload> {
  const [positions, voteGroups, totalEligible, votesCast, flaggedCount] =
    await Promise.all([
      prisma.position.findMany({
        orderBy: { order: "asc" },
        include: {
          candidates: {
            orderBy: { order: "asc" },
            select: { id: true, name: true },
          },
        },
      }),
      prisma.vote.groupBy({
        by: ["candidateId"],
        _count: { _all: true },
      }),
      prisma.voter.count(),
      prisma.voter.count({ where: { hasVoted: true } }),
      prisma.flaggedAttempt.count(),
    ]);

  const tally = new Map<string, number>();
  for (const g of voteGroups) tally.set(g.candidateId, g._count._all);

  const resultPositions: ResultPosition[] = positions.map((p) => {
    const counts = p.candidates.map((c) => tally.get(c.id) ?? 0);
    const total = counts.reduce((a, b) => a + b, 0);
    const max = Math.max(0, ...counts);
    return {
      id: p.id,
      title: p.title,
      total,
      candidates: p.candidates.map((c, i) => {
        const votes = tally.get(c.id) ?? 0;
        const leading = votes === max && total > 0;
        return {
          id: c.id,
          name: c.name,
          votes,
          pct: pct(votes, total),
          leading,
          barColor: leading ? "#c8932a" : BAR_PALETTE[i % BAR_PALETTE.length],
        };
      }),
    };
  });

  return {
    positions: resultPositions,
    votesCast,
    totalEligible,
    turnoutPct: pct(votesCast, totalEligible),
    flaggedCount,
  };
}
