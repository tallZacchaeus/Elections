import { NextResponse } from "next/server";
import { requireAdminElection } from "@/lib/guard";
import { prisma } from "@/lib/db";

/** Flagged attempts = matric numbers that tried to vote more than once. */
export async function GET() {
  const guard = await requireAdminElection();
  if (!guard.ok) return guard.response;
  const { election } = guard;

  const attempts = await prisma.flaggedAttempt.findMany({
    where: { electionId: election.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      matricNumber: true,
      reference: true,
      reason: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ attempts });
}
