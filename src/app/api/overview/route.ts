import { NextResponse } from "next/server";
import { requireAdminElection } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { pct } from "@/lib/utils";

export async function GET() {
  const guard = await requireAdminElection();
  if (!guard.ok) return guard.response;
  const { election } = guard;

  const [totalEligible, votesCast, flaggedCount, positions, candidates] =
    await Promise.all([
      prisma.voter.count({ where: { electionId: election.id } }),
      prisma.voter.count({ where: { electionId: election.id, hasVoted: true } }),
      prisma.flaggedAttempt.count({ where: { electionId: election.id } }),
      prisma.position.count({ where: { electionId: election.id } }),
      prisma.candidate.count({ where: { position: { electionId: election.id } } }),
    ]);

  return NextResponse.json({
    election: { id: election.id, title: election.title, status: election.status },
    votesCast,
    totalEligible,
    turnoutPct: pct(votesCast, totalEligible),
    flaggedCount,
    positions,
    candidates,
    votingOpen: election.status === "OPEN",
    opensAt: election.votingOpensAt,
    closesAt: election.votingClosesAt,
  });
}
