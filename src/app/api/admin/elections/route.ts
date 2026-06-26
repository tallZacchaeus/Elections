import { NextResponse } from "next/server";
import { requireRole } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { getManagedElection, setManagedElectionCookie } from "@/lib/elections";
import { parseThresholdPct } from "@/lib/utils";

const DEFAULTS = {
  institution: "Oyo State College of Agriculture and Technology",
  faculty: "Faculty of Management & Communication Studies",
  department: "Department of Public Administration",
};

export async function GET() {
  const guard = await requireRole(["ADMIN"]);
  if (!guard.ok) return guard.response;

  const [elections, managed] = await Promise.all([
    prisma.election.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { positions: true, voters: true } },
      },
    }),
    getManagedElection(),
  ]);

  // votesCast (voters who voted) per election
  const voted = await prisma.voter.groupBy({
    by: ["electionId"],
    where: { hasVoted: true },
    _count: { _all: true },
  });
  const votedMap = new Map(voted.map((v) => [v.electionId, v._count._all]));

  return NextResponse.json({
    managedId: managed?.id ?? null,
    elections: elections.map((e) => ({
      id: e.id,
      title: e.title,
      institution: e.institution,
      faculty: e.faculty,
      department: e.department,
      status: e.status,
      autoSchedule: e.autoSchedule,
      votingOpensAt: e.votingOpensAt,
      votingClosesAt: e.votingClosesAt,
      positions: e._count.positions,
      voters: e._count.voters,
      votesCast: votedMap.get(e.id) ?? 0,
      createdAt: e.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  const guard = await requireRole(["ADMIN"]);
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => ({}));
  const title = (body.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "Election title is required." }, { status: 400 });
  }

  const threshold = parseThresholdPct(body.winThresholdPct);

  const election = await prisma.election.create({
    data: {
      title,
      institution: (body.institution ?? DEFAULTS.institution).trim() || DEFAULTS.institution,
      faculty: (body.faculty ?? DEFAULTS.faculty).trim() || DEFAULTS.faculty,
      department: (body.department ?? DEFAULTS.department).trim() || DEFAULTS.department,
      status: "DRAFT",
      ...(threshold !== null ? { winThresholdPct: threshold } : {}),
      ...(typeof body.autoSchedule === "boolean" ? { autoSchedule: body.autoSchedule } : {}),
      votingOpensAt: body.votingOpensAt ? new Date(body.votingOpensAt) : null,
      votingClosesAt: body.votingClosesAt ? new Date(body.votingClosesAt) : null,
    },
  });

  // Start managing the new election immediately.
  await setManagedElectionCookie(election.id);

  return NextResponse.json({ election }, { status: 201 });
}
