import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export type Role = "ADMIN" | "OBSERVER";

export const SESSION_COOKIE = "pasa_session";
export const BALLOT_COOKIE = "pasa_ballot";

const SESSION_TTL = "8h";
const BALLOT_TTL = "30m";

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET is missing or too short. Set a long random value in your environment.",
    );
  }
  return new TextEncoder().encode(secret);
}

// ── Admin / Observer session ────────────────────────────────────────────────

export interface SessionPayload {
  sub: string; // user id
  name: string;
  role: Role;
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ name: payload.name, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(secretKey());
}

export async function verifySession(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub || !payload.role) return null;
    return {
      sub: String(payload.sub),
      name: String(payload.name ?? ""),
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

/** Read the current admin/observer session from cookies (server only). */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

const isProd = process.env.NODE_ENV === "production";

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

// ── Voting ticket (issued after matric verification) ─────────────────────────

export interface BallotTicket {
  matric: string;
  voterId: string;
}

export async function signBallotTicket(t: BallotTicket): Promise<string> {
  return new SignJWT({ matric: t.matric, voterId: t.voterId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(BALLOT_TTL)
    .sign(secretKey());
}

export async function verifyBallotTicket(
  token: string,
): Promise<BallotTicket | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.matric || !payload.voterId) return null;
    return { matric: String(payload.matric), voterId: String(payload.voterId) };
  } catch {
    return null;
  }
}

export async function getBallotTicket(): Promise<BallotTicket | null> {
  const store = await cookies();
  const token = store.get(BALLOT_COOKIE)?.value;
  if (!token) return null;
  return verifyBallotTicket(token);
}

export async function setBallotCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(BALLOT_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 30,
  });
}

export async function clearBallotCookie(): Promise<void> {
  const store = await cookies();
  store.delete(BALLOT_COOKIE);
}
