import { NextResponse } from "next/server";
import { requireRole } from "@/lib/guard";
import { prisma } from "@/lib/db";

export async function GET() {
  const guard = await requireRole(["ADMIN"]);
  if (!guard.ok) return guard.response;

  const setting = await prisma.setting.findUnique({ where: { id: 1 } });
  return NextResponse.json({ setting });
}

export async function PUT(req: Request) {
  const guard = await requireRole(["ADMIN"]);
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if (typeof body.institution === "string") data.institution = body.institution.trim();
  if (typeof body.faculty === "string") data.faculty = body.faculty.trim();
  if (typeof body.department === "string") data.department = body.department.trim();
  if (typeof body.electionTitle === "string") data.electionTitle = body.electionTitle.trim();
  if (typeof body.votingOpen === "boolean") data.votingOpen = body.votingOpen;
  if (body.votingOpensAt) data.votingOpensAt = new Date(body.votingOpensAt);
  if (body.votingClosesAt) data.votingClosesAt = new Date(body.votingClosesAt);

  const setting = await prisma.setting.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });

  return NextResponse.json({ setting });
}
