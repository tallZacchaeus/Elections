import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { candidatePhotoUrl } from "@/lib/utils";

/** Public ballot data: positions, candidates and election status. */
export async function GET() {
  const [positions, setting, eligibleCount] = await Promise.all([
    prisma.position.findMany({
      orderBy: { order: "asc" },
      include: {
        candidates: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            name: true,
            level: true,
            avatarBg: true,
            manifesto: true,
            photoMime: true,
            updatedAt: true,
          },
        },
      },
    }),
    prisma.setting.findUnique({ where: { id: 1 } }),
    prisma.voter.count(),
  ]);

  const candidatesCount = positions.reduce((a, p) => a + p.candidates.length, 0);

  return NextResponse.json({
    votingOpen: setting?.votingOpen ?? true,
    stats: {
      positions: positions.length,
      candidates: candidatesCount,
      eligible: eligibleCount,
    },
    election: {
      institution: setting?.institution ?? "",
      faculty: setting?.faculty ?? "",
      department: setting?.department ?? "",
      title: setting?.electionTitle ?? "",
      opensAt: setting?.votingOpensAt ?? null,
      closesAt: setting?.votingClosesAt ?? null,
    },
    positions: positions.map((p) => ({
      id: p.id,
      title: p.title,
      candidates: p.candidates.map((c) => ({
        id: c.id,
        name: c.name,
        level: c.level,
        avatarBg: c.avatarBg,
        manifesto: c.manifesto,
        photoUrl: candidatePhotoUrl(c.id, !!c.photoMime, c.updatedAt),
      })),
    })),
  });
}
