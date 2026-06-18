import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeMatric, generateFlagRef } from "@/lib/utils";
import { signBallotTicket, setBallotCookie } from "@/lib/auth";

export async function POST(req: Request) {
  let body: { matric?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: "error" }, { status: 400 });
  }

  const matric = normalizeMatric(body.matric ?? "");
  if (!matric) {
    return NextResponse.json(
      { status: "empty", message: "Please enter your matriculation number." },
      { status: 400 },
    );
  }

  const setting = await prisma.setting.findUnique({ where: { id: 1 } });
  if (setting && !setting.votingOpen) {
    return NextResponse.json(
      { status: "closed", message: "Voting is currently closed." },
      { status: 423 },
    );
  }

  const voter = await prisma.voter.findUnique({ where: { matricNumber: matric } });

  if (!voter) {
    return NextResponse.json(
      {
        status: "notfound",
        message:
          "This matriculation number is not on the eligible voter roster. Confirm it matches your student record.",
      },
      { status: 404 },
    );
  }

  if (voter.hasVoted) {
    const reference = generateFlagRef();
    await prisma.flaggedAttempt.create({
      data: { matricNumber: matric, reference },
    });
    return NextResponse.json({ status: "flagged", matric, reference });
  }

  // Eligible — issue a short-lived ballot ticket.
  const token = await signBallotTicket({ matric, voterId: voter.id });
  await setBallotCookie(token);

  return NextResponse.json({ status: "ok", voter: { name: voter.fullName } });
}
