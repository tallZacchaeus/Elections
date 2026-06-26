import { cookies } from "next/headers";
import { prisma } from "./db";
import type { Election } from "@prisma/client";

export const MANAGED_ELECTION_COOKIE = "pasa_admin_election";

/** The election currently accepting votes (at most one). */
export function getActiveElection(): Promise<Election | null> {
  return prisma.election.findFirst({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Election shown on voter-facing pages: the open one, otherwise the most
 * recent non-draft election (so closed results still display).
 */
export async function getVoterFacingElection(): Promise<Election | null> {
  const active = await getActiveElection();
  if (active) return active;
  return prisma.election.findFirst({
    where: { status: { in: ["CLOSED", "ARCHIVED"] } },
    orderBy: { updatedAt: "desc" },
  });
}

/**
 * The election the admin is currently managing. Resolved from a cookie, with
 * sensible fallbacks so the console always has a context if any election exists.
 */
export async function getManagedElection(): Promise<Election | null> {
  const store = await cookies();
  const id = store.get(MANAGED_ELECTION_COOKIE)?.value;
  if (id) {
    const found = await prisma.election.findUnique({ where: { id } });
    if (found) return found;
  }
  const active = await getActiveElection();
  if (active) return active;
  return prisma.election.findFirst({ orderBy: { createdAt: "desc" } });
}

export async function setManagedElectionCookie(id: string): Promise<void> {
  const store = await cookies();
  store.set(MANAGED_ELECTION_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}
