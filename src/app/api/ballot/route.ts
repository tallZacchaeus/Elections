import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { candidatePhotoUrl } from "@/lib/utils";
import { getVoterFacingElection } from "@/lib/elections";

/** Public ballot data for the current election. */
export async function GET() {
  const election = await getVoterFacingElection();

  if (!election) {
    return NextResponse.json({ active: false, votingOpen: false });
  }

  const [positions, eligibleCount] = await Promise.all([
    prisma.position.findMany({
      where: { electionId: election.id },
      orderBy: { order: "asc" },
      include: {
        candidates: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            name: true,
            nickname: true,
            level: true,
            avatarBg: true,
            manifesto: true,
            photoMime: true,
            updatedAt: true,
          },
        },
      },
    }),
    prisma.voter.count({ where: { electionId: election.id } }),
  ]);

  const candidatesCount = positions.reduce((a, p) => a + p.candidates.length, 0);

  return NextResponse.json({
    active: true,
    votingOpen: election.status === "OPEN",
    stats: {
      positions: positions.length,
      candidates: candidatesCount,
      eligible: eligibleCount,
    },
    election: {
      institution: election.institution,
      faculty: election.faculty,
      department: election.department,
      title: election.title,
      opensAt: election.votingOpensAt,
      closesAt: election.votingClosesAt,
    },
    positions: positions.map((p) => ({
      id: p.id,
      title: p.title,
      candidates: p.candidates.map((c) => ({
        id: c.id,
        name: c.name,
        nickname: c.nickname,
        level: c.level,
        avatarBg: c.avatarBg,
        manifesto: c.manifesto,
        photoUrl: candidatePhotoUrl(c.id, !!c.photoMime, c.updatedAt),
      })),
    })),
  });
}
