import { NextResponse } from "next/server";
import Papa from "papaparse";
import { requireAdminElection } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { normalizeMatric } from "@/lib/utils";

export async function GET() {
  const guard = await requireAdminElection();
  if (!guard.ok) return guard.response;
  const { election } = guard;

  const [voters, total, votedCount] = await Promise.all([
    prisma.voter.findMany({
      where: { electionId: election.id },
      orderBy: { matricNumber: "asc" },
    }),
    prisma.voter.count({ where: { electionId: election.id } }),
    prisma.voter.count({ where: { electionId: election.id, hasVoted: true } }),
  ]);

  return NextResponse.json({
    election: { id: election.id, title: election.title, status: election.status },
    total,
    votedCount,
    voters: voters.map((v) => ({
      matricNumber: v.matricNumber,
      fullName: v.fullName,
      hasVoted: v.hasVoted,
      votedAt: v.votedAt,
    })),
  });
}

type RawRow = Record<string, string>;

function pick(row: RawRow, keys: string[]): string {
  for (const k of Object.keys(row)) {
    const norm = k.trim().toLowerCase().replace(/[\s-]+/g, "_");
    if (keys.includes(norm)) return (row[k] ?? "").trim();
  }
  return "";
}

export async function POST(req: Request) {
  const guard = await requireAdminElection();
  if (!guard.ok) return guard.response;
  const { election } = guard;

  const body = await req.json().catch(() => ({}));
  const replace = body.replace !== false; // default replace

  let rows: { matricNumber: string; fullName: string }[] = [];

  if (typeof body.csv === "string" && body.csv.trim()) {
    const parsed = Papa.parse<RawRow>(body.csv, {
      header: true,
      skipEmptyLines: true,
    });
    rows = (parsed.data as RawRow[])
      .map((r) => ({
        matricNumber: normalizeMatric(pick(r, ["matric_number", "matric", "matriculation", "matriculation_number"])),
        fullName: pick(r, ["full_name", "name", "fullname", "student_name"]),
      }))
      .filter((r) => r.matricNumber && r.fullName);
  } else if (Array.isArray(body.rows)) {
    rows = body.rows
      .map((r: RawRow) => ({
        matricNumber: normalizeMatric(r.matricNumber ?? r.matric_number ?? ""),
        fullName: (r.fullName ?? r.full_name ?? "").trim(),
      }))
      .filter((r: { matricNumber: string; fullName: string }) => r.matricNumber && r.fullName);
  }

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No valid rows found. Expected columns: matric_number, full_name." },
      { status: 400 },
    );
  }

  // De-duplicate within the upload (last wins).
  const dedup = new Map(rows.map((r) => [r.matricNumber, r.fullName]));
  const finalRows = [...dedup.entries()].map(([matricNumber, fullName]) => ({
    electionId: election.id,
    matricNumber,
    fullName,
  }));

  if (replace) {
    // A fresh roster also resets this election's ballots, so it starts clean.
    await prisma.$transaction([
      prisma.vote.deleteMany({ where: { electionId: election.id } }),
      prisma.voter.deleteMany({ where: { electionId: election.id } }),
      prisma.voter.createMany({ data: finalRows, skipDuplicates: true }),
    ]);
  } else {
    for (const r of finalRows) {
      await prisma.voter.upsert({
        where: { electionId_matricNumber: { electionId: election.id, matricNumber: r.matricNumber } },
        update: { fullName: r.fullName },
        create: r,
      });
    }
  }

  const total = await prisma.voter.count({ where: { electionId: election.id } });
  return NextResponse.json({ imported: finalRows.length, total });
}

export async function DELETE() {
  const guard = await requireAdminElection();
  if (!guard.ok) return guard.response;
  const { election } = guard;

  await prisma.$transaction([
    prisma.vote.deleteMany({ where: { electionId: election.id } }),
    prisma.voter.deleteMany({ where: { electionId: election.id } }),
  ]);
  return NextResponse.json({ ok: true });
}
