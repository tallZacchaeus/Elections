import { NextResponse } from "next/server";
import { requireRole } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { parseThresholdPct } from "@/lib/utils";

const STATUSES = ["DRAFT", "OPEN", "CLOSED", "ARCHIVED"] as const;
type Status = (typeof STATUSES)[number];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireRole(["ADMIN"]);
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const data: Record<string, unknown> = {};
  if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
  if (typeof body.institution === "string") data.institution = body.institution.trim();
  if (typeof body.faculty === "string") data.faculty = body.faculty.trim();
  if (typeof body.department === "string") data.department = body.department.trim();
  if ("votingOpensAt" in body) data.votingOpensAt = body.votingOpensAt ? new Date(body.votingOpensAt) : null;
  if ("votingClosesAt" in body) data.votingClosesAt = body.votingClosesAt ? new Date(body.votingClosesAt) : null;
  if ("winThresholdPct" in body) {
    const t = parseThresholdPct(body.winThresholdPct);
    if (t !== null) data.winThresholdPct = t;
  }
  if (typeof body.autoSchedule === "boolean") data.autoSchedule = body.autoSchedule;

  let openingThis = false;
  if (typeof body.status === "string") {
    if (!STATUSES.includes(body.status as Status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    data.status = body.status;
    openingThis = body.status === "OPEN";
  }

  const exists = await prisma.election.findUnique({ where: { id }, select: { id: true } });
  if (!exists) {
    return NextResponse.json({ error: "Election not found." }, { status: 404 });
  }

  // Enforce a single OPEN election: opening this one closes any other open ones.
  const election = await prisma.$transaction(async (tx) => {
    if (openingThis) {
      await tx.election.updateMany({
        where: { status: "OPEN", id: { not: id } },
        data: { status: "CLOSED" },
      });
    }
    return tx.election.update({ where: { id }, data });
  });

  return NextResponse.json({ election });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireRole(["ADMIN"]);
  if (!guard.ok) return guard.response;

  const { id } = await params;
  // Cascades to positions, candidates, voters, votes and flagged attempts.
  await prisma.election.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
