import { NextResponse } from "next/server";
import { requireRole } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { pct } from "@/lib/utils";

export async function GET() {
  const guard = await requireRole(["ADMIN"]);
  if (!guard.ok) return guard.response;

  const [totalEligible, votesCast, flaggedCount, positions, candidates, setting] =
    await Promise.all([
      prisma.voter.count(),
      prisma.voter.count({ where: { hasVoted: true } }),
      prisma.flaggedAttempt.count(),
      prisma.position.count(),
      prisma.candidate.count(),
      prisma.setting.findUnique({ where: { id: 1 } }),
    ]);

  return NextResponse.json({
    votesCast,
    totalEligible,
    turnoutPct: pct(votesCast, totalEligible),
    flaggedCount,
    positions,
    candidates,
    votingOpen: setting?.votingOpen ?? true,
    opensAt: setting?.votingOpensAt ?? null,
    closesAt: setting?.votingClosesAt ?? null,
  });
}
