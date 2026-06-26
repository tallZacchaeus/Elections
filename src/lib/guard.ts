import { NextResponse } from "next/server";
import type { Election } from "@prisma/client";
import { getSession, type Role, type SessionPayload } from "./auth";
import { getManagedElection } from "./elections";

type GuardResult =
  | { ok: true; session: SessionPayload }
  | { ok: false; response: NextResponse };

type AdminElectionResult =
  | { ok: true; session: SessionPayload; election: Election }
  | { ok: false; response: NextResponse };

/**
 * Guard an API route. `roles` lists the roles allowed; omit to allow any
 * authenticated user (admin or observer).
 */
export async function requireRole(roles?: Role[]): Promise<GuardResult> {
  const session = await getSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Not authenticated." }, { status: 401 }),
    };
  }
  if (roles && !roles.includes(session.role)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden." }, { status: 403 }),
    };
  }
  return { ok: true, session };
}

/**
 * Guard an admin API route AND resolve the election the admin is managing.
 * Returns 409 when no election exists yet (the admin must create one first).
 */
export async function requireAdminElection(): Promise<AdminElectionResult> {
  const guard = await requireRole(["ADMIN"]);
  if (!guard.ok) return guard;

  const election = await getManagedElection();
  if (!election) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "No election yet. Create one to begin.", noElection: true },
        { status: 409 },
      ),
    };
  }
  return { ok: true, session: guard.session, election };
}
