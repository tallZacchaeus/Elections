import { cookies } from "next/headers";
import { prisma } from "./db";
import type { Election } from "@prisma/client";

export const MANAGED_ELECTION_COOKIE = "pasa_admin_election";

/**
 * Apply scheduled open/close transitions for elections that opted into
 * `autoSchedule`. Runs lazily on reads (no background worker required) and is
 * idempotent — the time-bounded WHERE clauses make it a no-op until a window
 * actually starts or ends. Manual elections (autoSchedule = false) are never
 * touched, and once CLOSED an election is not reopened.
 */
export async function reconcileElectionSchedules(): Promise<void> {
  const now = new Date();
  try {
    // 1. Auto-close: open elections whose close time has passed.
    await prisma.election.updateMany({
      where: { autoSchedule: true, status: "OPEN", votingClosesAt: { lte: now } },
      data: { status: "CLOSED" },
    });

    // 2. Missed window: a scheduled draft whose entire window is already past
    //    goes straight to CLOSED (never opened in time).
    await prisma.election.updateMany({
      where: {
        autoSchedule: true,
        status: "DRAFT",
        votingClosesAt: { not: null, lte: now },
      },
      data: { status: "CLOSED" },
    });

    // 3. Auto-open: a scheduled draft whose window is now active opens, and any
    //    other open election is closed to preserve the single-open invariant.
    const toOpen = await prisma.election.findFirst({
      where: {
        autoSchedule: true,
        status: "DRAFT",
        votingOpensAt: { not: null, lte: now },
        OR: [{ votingClosesAt: null }, { votingClosesAt: { gt: now } }],
      },
      orderBy: { votingOpensAt: "desc" },
      select: { id: true },
    });
    if (toOpen) {
      await prisma.$transaction([
        prisma.election.updateMany({
          where: { status: "OPEN", id: { not: toOpen.id } },
          data: { status: "CLOSED" },
        }),
        prisma.election.update({ where: { id: toOpen.id }, data: { status: "OPEN" } }),
      ]);
    }
  } catch {
    // Never let schedule reconciliation break a page/request.
  }
}

/** The election currently accepting votes (at most one). */
export async function getActiveElection(): Promise<Election | null> {
  await reconcileElectionSchedules();
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
  await reconcileElectionSchedules();
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
