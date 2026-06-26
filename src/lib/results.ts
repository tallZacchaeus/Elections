import { prisma } from "./db";
import { BAR_PALETTE } from "./theme";
import { pct, classifyLevel, type StudentLevel } from "./utils";

/**
 * Default winning rule: a candidate must reach this share of ALL eligible
 * voters (not merely of votes cast) before being declared the winner.
 * Each election can override this via `Election.winThresholdPct`.
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

export interface LevelStat {
  level: StudentLevel;
  eligible: number;
  voted: number;
  turnoutPct: number;
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
  /** Electorate split by programme level (ND / HND), eligible vs voted. */
  levels: LevelStat[];
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Compute the full tally from anonymous Vote rows.
 * `votesCast` is the number of voters who have voted (one ballot per voter),
 * which is more meaningful than counting individual position votes.
 */
export async function computeResults(electionId: string): Promise<ResultsPayload> {
  const [election, positions, voteGroups, totalEligible, votesCast, flaggedCount, voterLevels] =
    await Promise.all([
      prisma.election.findUnique({
        where: { id: electionId },
        select: { winThresholdPct: true },
      }),
      prisma.position.findMany({
        where: { electionId },
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
        where: { electionId },
        _count: { _all: true },
      }),
      prisma.voter.count({ where: { electionId } }),
      prisma.voter.count({ where: { electionId, hasVoted: true } }),
      prisma.flaggedAttempt.count({ where: { electionId } }),
      prisma.voter.findMany({
        where: { electionId },
        select: { matricNumber: true, hasVoted: true },
      }),
    ]);

  // Electorate split by programme level (ND / HND).
  const levelAgg: Record<StudentLevel, { eligible: number; voted: number }> = {
    ND: { eligible: 0, voted: 0 },
    HND: { eligible: 0, voted: 0 },
    OTHER: { eligible: 0, voted: 0 },
  };
  for (const v of voterLevels) {
    const lvl = classifyLevel(v.matricNumber);
    levelAgg[lvl].eligible += 1;
    if (v.hasVoted) levelAgg[lvl].voted += 1;
  }
  const levels: LevelStat[] = (["ND", "HND", "OTHER"] as StudentLevel[])
    .filter((l) => levelAgg[l].eligible > 0)
    .map((l) => ({
      level: l,
      eligible: levelAgg[l].eligible,
      voted: levelAgg[l].voted,
      turnoutPct: pct(levelAgg[l].voted, levelAgg[l].eligible),
    }));

  const tally = new Map<string, number>();
  for (const g of voteGroups) tally.set(g.candidateId, g._count._all);

  // Per-election win threshold (falls back to the default if unset).
  const thresholdPct = election?.winThresholdPct ?? WIN_THRESHOLD_PCT;
  // Absolute votes needed to win: thresholdPct% of all eligible voters, rounded up.
  const thresholdVotes = Math.ceil((totalEligible * thresholdPct) / 100);

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
    thresholdPct,
    thresholdVotes,
    levels,
  };
}
