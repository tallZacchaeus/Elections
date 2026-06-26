import { NextResponse } from "next/server";
import { requireAdminElection } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { candidatePhotoUrl } from "@/lib/utils";

export async function GET() {
  const guard = await requireAdminElection();
  if (!guard.ok) return guard.response;
  const { election } = guard;

  const positions = await prisma.position.findMany({
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
  });

  return NextResponse.json({
    election: { id: election.id, title: election.title, status: election.status },
    positions: positions.map((p) => ({
      id: p.id,
      title: p.title,
      order: p.order,
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

export async function POST(req: Request) {
  const guard = await requireAdminElection();
  if (!guard.ok) return guard.response;
  const { election } = guard;

  const body = await req.json().catch(() => ({}));
  const title = (body.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "Position title is required." }, { status: 400 });
  }
  const count = await prisma.position.count({ where: { electionId: election.id } });
  const position = await prisma.position.create({
    data: { electionId: election.id, title, order: count },
  });
  return NextResponse.json({ position }, { status: 201 });
}
