import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateReceipt } from "@/lib/utils";
import { getBallotTicket, clearBallotCookie } from "@/lib/auth";

export async function POST(req: Request) {
  const ticket = await getBallotTicket();
  if (!ticket) {
    return NextResponse.json(
      { error: "Your voting session has expired. Please verify again." },
      { status: 401 },
    );
  }

  let body: { selections?: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const selections = body.selections ?? {};

  const setting = await prisma.setting.findUnique({ where: { id: 1 } });
  if (setting && !setting.votingOpen) {
    return NextResponse.json({ error: "Voting is closed." }, { status: 423 });
  }

  const voter = await prisma.voter.findUnique({ where: { id: ticket.voterId } });
  if (!voter || voter.matricNumber !== ticket.matric) {
    await clearBallotCookie();
    return NextResponse.json({ error: "Voter not recognised." }, { status: 401 });
  }
  if (voter.hasVoted) {
    await clearBallotCookie();
    return NextResponse.json(
      { error: "This matriculation number has already voted." },
      { status: 409 },
    );
  }

  // Validate every selection against the real ballot.
  const positions = await prisma.position.findMany({
    include: { candidates: { select: { id: true, positionId: true } } },
  });
  const validByPosition = new Map(
    positions.map((p) => [p.id, new Set(p.candidates.map((c) => c.id))]),
  );

  const voteData: { positionId: string; candidateId: string }[] = [];
  for (const [positionId, candidateId] of Object.entries(selections)) {
    if (candidateId === "__abstain__" || !candidateId) continue;
    const valid = validByPosition.get(positionId);
    if (!valid || !valid.has(candidateId)) {
      return NextResponse.json(
        { error: "Your ballot contained an invalid selection." },
        { status: 400 },
      );
    }
    voteData.push({ positionId, candidateId });
  }

  const receipt = generateReceipt();

  try {
    await prisma.$transaction(async (tx) => {
      // Atomically claim the vote: only succeeds if not already voted.
      const claimed = await tx.voter.updateMany({
        where: { id: voter.id, hasVoted: false },
        data: { hasVoted: true, votedAt: new Date(), receipt },
      });
      if (claimed.count !== 1) {
        throw new Error("ALREADY_VOTED");
      }
      if (voteData.length > 0) {
        await tx.vote.createMany({ data: voteData });
      }
    });
  } catch (e) {
    if (e instanceof Error && e.message === "ALREADY_VOTED") {
      await clearBallotCookie();
      return NextResponse.json(
        { error: "This matriculation number has already voted." },
        { status: 409 },
      );
    }
    throw e;
  }

  await clearBallotCookie();
  return NextResponse.json({ receipt, name: voter.fullName });
}
