import { requireRole } from "@/lib/guard";
import { computeResults } from "@/lib/results";
import { getManagedElection, getVoterFacingElection } from "@/lib/elections";

function csvEscape(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: Request) {
  const guard = await requireRole();
  if (!guard.ok) return guard.response;

  const url = new URL(req.url);
  const format = url.searchParams.get("format") ?? "csv";

  const election =
    guard.session.role === "ADMIN"
      ? await getManagedElection()
      : await getVoterFacingElection();

  if (!election) {
    return new Response("No election to export.", { status: 404 });
  }

  const results = await computeResults(election.id);
  const title = election.title;
  const stamp = new Date().toISOString().slice(0, 19).replace("T", " ");

  if (format === "xls") {
    // Excel reads HTML tables natively when served as .xls.
    const rowsHtml = results.positions
      .map(
        (p) => `
        <tr><th colspan="4" style="background:#0e5a37;color:#fff;text-align:left">${p.title} — ${p.total} votes</th></tr>
        <tr><th>Candidate</th><th>Votes</th><th>Percentage</th><th>Status</th></tr>
        ${p.candidates
          .map(
            (c) =>
              `<tr><td>${c.name}</td><td>${c.votes}</td><td>${c.pct}%</td><td>${c.leading ? "Leading" : ""}</td></tr>`,
          )
          .join("")}`,
      )
      .join("");
    const html = `<html><head><meta charset="utf-8"></head><body>
      <table border="1">
        <tr><th colspan="4">${title}</th></tr>
        <tr><td colspan="4">Generated ${stamp} · Votes cast: ${results.votesCast} · Turnout: ${results.turnoutPct}% · Flagged: ${results.flaggedCount}</td></tr>
        ${rowsHtml}
      </table></body></html>`;
    return new Response(html, {
      headers: {
        "Content-Type": "application/vnd.ms-excel",
        "Content-Disposition": `attachment; filename="pasa-results-${Date.now()}.xls"`,
      },
    });
  }

  // Default: CSV
  const lines: string[] = [];
  lines.push([title].map(csvEscape).join(","));
  lines.push([`Generated`, stamp].map(csvEscape).join(","));
  lines.push([`Votes cast`, results.votesCast, `Turnout`, `${results.turnoutPct}%`, `Flagged`, results.flaggedCount].map(csvEscape).join(","));
  lines.push("");
  lines.push(["Position", "Candidate", "Votes", "Percentage", "Leading"].map(csvEscape).join(","));
  for (const p of results.positions) {
    for (const c of p.candidates) {
      lines.push([p.title, c.name, c.votes, `${c.pct}%`, c.leading ? "Yes" : ""].map(csvEscape).join(","));
    }
  }
  const csv = lines.join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pasa-results-${Date.now()}.csv"`,
    },
  });
}
