import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Two-letter initials from a full name. */
export function initials(name: string): string {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || name.slice(0, 2).toUpperCase();
}

/** Normalise a matric number for comparison/storage (uppercase, trimmed). */
export function normalizeMatric(raw: string): string {
  return (raw || "").trim().toUpperCase().replace(/\s+/g, "");
}

export type StudentLevel = "ND" | "HND" | "OTHER";

/**
 * Classify a matric number by programme level from its prefix.
 * Handles both slashed (HND/250013) and unslashed (HND250013A) formats.
 * HND is checked before ND because "HND…" must not match the ND branch.
 */
export function classifyLevel(matric: string): StudentLevel {
  const m = (matric || "").trim().toUpperCase();
  if (m.startsWith("HND")) return "HND";
  if (m.startsWith("ND")) return "ND";
  return "OTHER";
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars

function randomToken(len: number): string {
  let out = "";
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

/** A voter-facing receipt, e.g. OYS-7F3K-2Qtoo. */
export function generateReceipt(): string {
  return `OYS-${randomToken(4)}-${randomToken(4)}`;
}

/** Reference shown when a duplicate vote is flagged. */
export function generateFlagRef(): string {
  return `FLG-${randomToken(5)}`;
}

/** Whole-number percentage. */
export function pct(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

/** Public URL for a candidate's photo, with a cache-busting version stamp. */
export function candidatePhotoUrl(
  id: string,
  hasPhoto: boolean,
  updatedAt: Date | string,
): string | null {
  if (!hasPhoto) return null;
  const v = updatedAt instanceof Date ? updatedAt.getTime() : new Date(updatedAt).getTime();
  return `/api/candidates/${id}/photo?v=${v}`;
}
