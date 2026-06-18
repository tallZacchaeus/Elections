import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signSession, setSessionCookie, type Role } from "@/lib/auth";

export async function POST(req: Request) {
  let body: { email?: string; password?: string; portal?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const portal = body.portal === "observer" ? "observer" : "admin";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  const user = await prisma.adminUser.findUnique({ where: { email } });
  // Always run a hash comparison to avoid leaking whether the email exists.
  const hash = user?.passwordHash ?? "$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidin";
  const ok = await bcrypt.compare(password, hash);

  if (!user || !ok) {
    return NextResponse.json(
      { error: "Incorrect email or password." },
      { status: 401 },
    );
  }

  // Admins may access either portal; observers are read-only and cannot reach admin.
  if (portal === "admin" && user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "This account does not have administrator access." },
      { status: 403 },
    );
  }

  const token = await signSession({
    sub: user.id,
    name: user.name,
    role: user.role as Role,
  });
  await setSessionCookie(token);

  return NextResponse.json({ role: user.role, name: user.name });
}
