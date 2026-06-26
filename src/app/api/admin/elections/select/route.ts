import { NextResponse } from "next/server";
import { requireRole } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { setManagedElectionCookie } from "@/lib/elections";

/** Set which election the admin console is currently managing. */
export async function POST(req: Request) {
  const guard = await requireRole(["ADMIN"]);
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => ({}));
  const id = (body.id ?? "").trim();
  if (!id) return NextResponse.json({ error: "Election id required." }, { status: 400 });

  const election = await prisma.election.findUnique({ where: { id }, select: { id: true } });
  if (!election) return NextResponse.json({ error: "Election not found." }, { status: 404 });

  await setManagedElectionCookie(id);
  return NextResponse.json({ ok: true });
}
