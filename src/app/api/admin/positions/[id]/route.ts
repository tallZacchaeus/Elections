import { NextResponse } from "next/server";
import { requireRole } from "@/lib/guard";
import { prisma } from "@/lib/db";

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
  if (typeof body.order === "number") data.order = body.order;

  const position = await prisma.position.update({ where: { id }, data });
  return NextResponse.json({ position });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireRole(["ADMIN"]);
  if (!guard.ok) return guard.response;

  const { id } = await params;
  // Cascade removes candidates and their votes.
  await prisma.position.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
