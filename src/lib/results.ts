import { prisma } from "./db";
import { BAR_PALETTE } from "./theme";
import { pct } from "./utils";

/**
 * Winning rule: a candidate must reach this share of ALL eligible voters
 * (not merely of votes cast) before they can be declared the winner.
 */
export const WIN_THRESHOLD_PCT = 60;

export interface ResultCandidate {
  id: string;
  name: string;
  votes: number;
  /** Percentage within the position's cast votes (whole number). */
  pct: number;
  /** Percentage of ALL eligible voters (one decimal) — basis of the win rule. */
  pctOfEligible: number;
  /** True once votes ≥ the win line (60% of eligible). */
  meetsThreshold: boolean;
  /** Votes still required to reach the win line (0 once met). */
  votesNeeded: number;
  leading: boolean;
  barColor: string;
}

export interface ResultPosition {
  id: string;
  title: string;
  total: number;
  /** Votes required to win this position (60% of eligible voters). */
  thresholdVotes: number;
  /** Id of the candidate who has reached the win line, if any. */
  winnerId: string | null;
  /** Name of the declared winner, if any. */
  winnerName: string | null;
  candidates: ResultCandidate[];
}

export interface ResultsPayload {
  positions: ResultPosition[];
  votesCast: number;
  totalEligible: number;
  turnoutPct: number;
  flaggedCount: number;
  /** The configured win threshold as a percentage of eligible voters. */
  thresholdPct: number;
  /** Absolute votes required to win (ceil of thresholdPct% of eligible). */
  thresholdVotes: number;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
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

  // Absolute votes needed to win: 60% of all eligible voters, rounded up.
  const thresholdVotes = Math.ceil((totalEligible * WIN_THRESHOLD_PCT) / 100);

  const resultPositions: ResultPosition[] = positions.map((p) => {
    const counts = p.candidates.map((c) => tally.get(c.id) ?? 0);
    const total = counts.reduce((a, b) => a + b, 0);
    const max = Math.max(0, ...counts);

    let winnerId: string | null = null;
    let winnerName: string | null = null;

    const candidates = p.candidates.map((c, i) => {
      const votes = tally.get(c.id) ?? 0;
      const leading = votes === max && total > 0;
      const meetsThreshold = totalEligible > 0 && votes >= thresholdVotes;
      if (meetsThreshold && votes === max) {
        winnerId = c.id;
        winnerName = c.name;
      }
      return {
        id: c.id,
        name: c.name,
        votes,
        pct: pct(votes, total),
        pctOfEligible: totalEligible > 0 ? round1((votes / totalEligible) * 100) : 0,
        meetsThreshold,
        votesNeeded: Math.max(0, thresholdVotes - votes),
        leading,
        barColor: leading ? "#c8932a" : BAR_PALETTE[i % BAR_PALETTE.length],
      };
    });

    return {
      id: p.id,
      title: p.title,
      total,
      thresholdVotes,
      winnerId,
      winnerName,
      candidates,
    };
  });

  return {
    positions: resultPositions,
    votesCast,
    totalEligible,
    turnoutPct: pct(votesCast, totalEligible),
    flaggedCount,
    thresholdPct: WIN_THRESHOLD_PCT,
    thresholdVotes,
  };
}
