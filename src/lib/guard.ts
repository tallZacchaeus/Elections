import { NextResponse } from "next/server";
import { getSession, type Role, type SessionPayload } from "./auth";

type GuardResult =
  | { ok: true; session: SessionPayload }
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
