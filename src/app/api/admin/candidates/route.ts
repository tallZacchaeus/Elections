import { NextResponse } from "next/server";
import { requireRole } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { pickAvatarBg } from "@/lib/theme";
import { candidatePhotoUrl } from "@/lib/utils";

export async function GET() {
  const guard = await requireRole(["ADMIN"]);
  if (!guard.ok) return guard.response;

  const candidates = await prisma.candidate.findMany({
    orderBy: [{ positionId: "asc" }, { order: "asc" }],
    select: {
      id: true,
      name: true,
      nickname: true,
      level: true,
      avatarBg: true,
      manifesto: true,
      positionId: true,
      photoMime: true,
      updatedAt: true,
      position: { select: { title: true } },
    },
  });
  return NextResponse.json({
    candidates: candidates.map((c) => ({
      id: c.id,
      name: c.name,
      nickname: c.nickname,
      level: c.level,
      avatarBg: c.avatarBg,
      manifesto: c.manifesto,
      positionId: c.positionId,
      position: c.position,
      photoUrl: candidatePhotoUrl(c.id, !!c.photoMime, c.updatedAt),
    })),
  });
}

export async function POST(req: Request) {
  const guard = await requireRole(["ADMIN"]);
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => ({}));
  const name = (body.name ?? "").trim();
  const positionId = (body.positionId ?? "").trim();
  if (!name || !positionId) {
    return NextResponse.json(
      { error: "Candidate name and position are required." },
      { status: 400 },
    );
  }

  const position = await prisma.position.findUnique({ where: { id: positionId } });
  if (!position) {
    return NextResponse.json({ error: "Unknown position." }, { status: 400 });
  }

  const count = await prisma.candidate.count({ where: { positionId } });
  const candidate = await prisma.candidate.create({
    data: {
      positionId,
      name,
      nickname: (body.nickname ?? "").trim(),
      level: (body.level ?? "Public Admin").trim() || "Public Admin",
      manifesto: (body.manifesto ?? "Manifesto pending submission to the electoral committee.").trim(),
      avatarBg: pickAvatarBg(count + name.length),
      order: count,
    },
  });
  return NextResponse.json({ candidate }, { status: 201 });
}
