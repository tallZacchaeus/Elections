import * as XLSX from "xlsx";
import { requireRole } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { computeResults } from "@/lib/results";
import { classifyLevel } from "@/lib/utils";

function fmt(dt: Date | string | null): string {
  if (!dt) return "";
  try {
    return new Date(dt).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}

/**
 * Master report: a single Excel workbook with one sheet per analysis
 * (Summary, Results, Voter levels, Roster, Flagged attempts).
 */
export async function GET() {
  const guard = await requireRole(["ADMIN"]);
  if (!guard.ok) return guard.response;

  const [results, setting, voters, flagged] = await Promise.all([
    computeResults(),
    prisma.setting.findUnique({ where: { id: 1 } }),
    prisma.voter.findMany({ orderBy: { matricNumber: "asc" } }),
    prisma.flaggedAttempt.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  const wb = XLSX.utils.book_new();
  const stamp = fmt(new Date());

  // 1) Summary
  const summary: (string | number)[][] = [
    [setting?.institution ?? ""],
    [setting?.faculty ?? ""],
    [setting?.department ?? ""],
    [setting?.electionTitle ?? "PASA Election"],
    ["Official Master Report"],
    ["Generated", stamp],
    [],
    ["Eligible voters", results.totalEligible],
    ["Votes cast", results.votesCast],
    ["Turnout (%)", results.turnoutPct],
    [`Win threshold (${results.thresholdPct}% of eligible)`, results.thresholdVotes],
    ["Flagged repeat attempts", flagged.length],
    ["Positions", results.positions.length],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), "Summary");

  // 2) Results (per position / candidate)
  const resultRows: (string | number)[][] = [
    ["Position", "Candidate", "Votes", "% of eligible", "% of cast", "Status", "Declared winner"],
  ];
  for (const p of results.positions) {
    for (const c of [...p.candidates].sort((a, b) => b.votes - a.votes)) {
      resultRows.push([
        p.title,
        c.name,
        c.votes,
        c.pctOfEligible,
        c.pct,
        c.meetsThreshold ? "Meets threshold" : `Below (needs ${c.votesNeeded} more)`,
        p.winnerName === c.name ? "WINNER" : "",
      ]);
    }
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resultRows), "Results");

  // 3) Voter levels (ND / HND)
  const levelRows: (string | number)[][] = [
    ["Level", "Eligible", "Voted", "Not voted", "Turnout (%)"],
  ];
  for (const l of results.levels) {
    levelRows.push([l.level, l.eligible, l.voted, l.eligible - l.voted, l.turnoutPct]);
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(levelRows), "Voter levels");

  // 4) Roster (who voted / who did not — never what they chose)
  const rosterRows: (string | number)[][] = [
    ["Matric number", "Full name", "Level", "Status", "Voted at"],
  ];
  for (const v of voters) {
    rosterRows.push([
      v.matricNumber,
      v.fullName,
      classifyLevel(v.matricNumber),
      v.hasVoted ? "Voted" : "Not voted",
      v.hasVoted ? fmt(v.votedAt) : "",
    ]);
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rosterRows), "Roster");

  // 5) Flagged attempts (aggregated by matric)
  const agg = new Map<string, { count: number; lastAt: Date }>();
  for (const f of flagged) {
    const cur = agg.get(f.matricNumber);
    if (cur) {
      cur.count += 1;
      if (f.createdAt > cur.lastAt) cur.lastAt = f.createdAt;
    } else {
      agg.set(f.matricNumber, { count: 1, lastAt: f.createdAt });
    }
  }
  const flaggedRows: (string | number)[][] = [["Matric number", "Repeat attempts", "Last attempt"]];
  for (const [matric, info] of [...agg.entries()].sort((a, b) => b[1].count - a[1].count)) {
    flaggedRows.push([matric, info.count, fmt(info.lastAt)]);
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(flaggedRows), "Flagged attempts");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const filename = `master-report-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
