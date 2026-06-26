import { NextResponse } from "next/server";
import { requireRole } from "@/lib/guard";
import { computeResults } from "@/lib/results";
import { getManagedElection, getVoterFacingElection } from "@/lib/elections";

export async function GET() {
  const guard = await requireRole(); // any authenticated role
  if (!guard.ok) return guard.response;

  // Admins view the election they're managing; observers see the live/latest one.
  const election =
    guard.session.role === "ADMIN"
      ? await getManagedElection()
      : await getVoterFacingElection();

  if (!election) {
    return NextResponse.json({
      election: null,
      positions: [],
      votesCast: 0,
      totalEligible: 0,
      turnoutPct: 0,
      flaggedCount: 0,
    });
  }

  const results = await computeResults(election.id);
  return NextResponse.json({
    election: { id: election.id, title: election.title, status: election.status },
    ...results,
  });
}
