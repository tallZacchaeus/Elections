import { NextResponse } from "next/server";
import { requireRole } from "@/lib/guard";
import { computeResults } from "@/lib/results";

export async function GET() {
  const guard = await requireRole(); // any authenticated role
  if (!guard.ok) return guard.response;

  const results = await computeResults();
  return NextResponse.json(results);
}
