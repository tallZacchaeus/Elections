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
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body.nickname === "string") data.nickname = body.nickname.trim();
  if (typeof body.level === "string") data.level = body.level.trim();
  if (typeof body.manifesto === "string") data.manifesto = body.manifesto.trim();
  if (typeof body.avatarBg === "string") data.avatarBg = body.avatarBg.trim();
  if (typeof body.order === "number") data.order = body.order;

  const candidate = await prisma.candidate.update({ where: { id }, data });
  return NextResponse.json({ candidate });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireRole(["ADMIN"]);
  if (!guard.ok) return guard.response;

  const { id } = await params;
  await prisma.candidate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
