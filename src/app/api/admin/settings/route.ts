import { NextResponse } from "next/server";
import { requireAdminElection } from "@/lib/guard";
import { prisma } from "@/lib/db";

export async function GET() {
  const guard = await requireAdminElection();
  if (!guard.ok) return guard.response;
  const { election } = guard;

  return NextResponse.json({
    election: {
      id: election.id,
      title: election.title,
      institution: election.institution,
      faculty: election.faculty,
      department: election.department,
      status: election.status,
      votingOpensAt: election.votingOpensAt,
      votingClosesAt: election.votingClosesAt,
    },
  });
}

export async function PUT(req: Request) {
  const guard = await requireAdminElection();
  if (!guard.ok) return guard.response;
  const { election } = guard;

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
  if (typeof body.institution === "string") data.institution = body.institution.trim();
  if (typeof body.faculty === "string") data.faculty = body.faculty.trim();
  if (typeof body.department === "string") data.department = body.department.trim();
  if ("votingOpensAt" in body) data.votingOpensAt = body.votingOpensAt ? new Date(body.votingOpensAt) : null;
  if ("votingClosesAt" in body) data.votingClosesAt = body.votingClosesAt ? new Date(body.votingClosesAt) : null;

  const updated = await prisma.election.update({ where: { id: election.id }, data });
  return NextResponse.json({ election: updated });
}
