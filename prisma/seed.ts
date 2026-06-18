import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateFlagRef } from "../src/lib/utils";

const prisma = new PrismaClient();

// Demo votes populate the results/observer views. Set SEED_DEMO=false for a
// clean election that starts at zero.
const SEED_DEMO = process.env.SEED_DEMO !== "false";

const G1 = "#0e5a37",
  G2 = "#137a49",
  GD = "#0a3d26",
  GOLD = "#9a6b12",
  TEAL = "#1f6e5e",
  OLIVE = "#5c6b1e";

const POSITIONS = [
  {
    title: "President",
    candidates: [
      ["Adeyemi Tunde", "HND II · Public Admin", G1, 96, "A transparent administration with monthly open-book accounts and a student welfare desk in every level."],
      ["Okafor Chidinma", "ND II · Public Admin", GOLD, 78, "Stronger industrial-training placements and a peer mentorship scheme pairing finalists with new intakes."],
      ["Bello Aisha", "HND I · Public Admin", TEAL, 51, "Digitised association records and a 24-hour grievance response charter for every student concern."],
    ],
  },
  {
    title: "Vice President",
    candidates: [
      ["Lawal Ibrahim", "HND I · Public Admin", OLIVE, 102, "Revitalise departmental clubs and host a termly leadership summit with public-sector guests."],
      ["Eze Ngozi", "ND II · Public Admin", G2, 118, "Expand female participation in association leadership and create a study-resource library."],
    ],
  },
  {
    title: "General Secretary",
    candidates: [
      ["Ojo Damilola", "ND II · Public Admin", GD, 88, "Publish minutes within 48 hours of every meeting and maintain a live calendar of events."],
      ["Hassan Fatima", "HND I · Public Admin", GOLD, 131, "A single notice board — physical and online — so no student misses an announcement again."],
    ],
  },
  {
    title: "Financial Secretary",
    candidates: [
      ["Adebayo Seun", "HND II · Public Admin", TEAL, 109, "Itemised dues, quarterly audits read aloud at congress, and zero hidden levies."],
      ["Yusuf Maryam", "ND II · Public Admin", G1, 112, "A digital dues tracker so every student sees exactly where their money goes."],
    ],
  },
  {
    title: "Public Relations Officer",
    candidates: [
      ["Nwosu Emeka", "ND II · Public Admin", OLIVE, 94, "Revamp our social presence and broadcast every event in real time to all members."],
      ["Salami Tobi", "HND I · Public Admin", GOLD, 125, "A weekly bulletin and a rapid-response line connecting students to the executive."],
    ],
  },
] as const;

const NAMED_ROSTER: Record<string, string> = {
  "PUB/22/001": "Adeola Bankole",
  "PUB/22/014": "Chinedu Okeke",
  "PUB/22/027": "Fatima Bello",
  "PUB/22/043": "Grace Adeyinka",
  "PUB/21/008": "Ibrahim Sule",
  "PUB/23/102": "Joy Ekanem",
  "PUB/22/055": "Kunle Ajayi",
  "PUB/23/077": "Halima Yusuf",
};

const FIRST = ["Tunde", "Chioma", "Bola", "Ngozi", "Emeka", "Aisha", "Seun", "Maryam", "Ifeoluwa", "Sade", "Musa", "Blessing", "Tobi", "Zainab", "Daniel", "Funke", "Ahmed", "Peace", "Segun", "Amaka"];
const LAST = ["Adewale", "Okonkwo", "Balogun", "Eze", "Lawal", "Okafor", "Adeyemi", "Yusuf", "Nwosu", "Salami", "Bello", "Ogun", "Hassan", "Ojo", "Adebayo", "Uche", "Ibrahim", "Akpan", "Olamide", "Danjuma"];

function buildRoster(): { matricNumber: string; fullName: string }[] {
  const rows: { matricNumber: string; fullName: string }[] = [];
  for (const [matricNumber, fullName] of Object.entries(NAMED_ROSTER)) {
    rows.push({ matricNumber, fullName });
  }
  let n = 500;
  const years = ["21", "22", "23"];
  while (rows.length < 312) {
    const yr = years[rows.length % years.length];
    const num = String(n++).padStart(3, "0");
    const matricNumber = `PUB/${yr}/${num}`;
    const fullName = `${FIRST[rows.length % FIRST.length]} ${LAST[(rows.length * 7) % LAST.length]}`;
    rows.push({ matricNumber, fullName });
  }
  return rows;
}

async function main() {
  console.log("→ Resetting election tables…");
  await prisma.vote.deleteMany();
  await prisma.flaggedAttempt.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.position.deleteMany();
  await prisma.voter.deleteMany();

  console.log("→ Settings…");
  await prisma.setting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      institution: "Oyo State College of Agriculture and Technology",
      faculty: "Faculty of Management & Communication Studies",
      department: "Department of Public Administration",
      electionTitle: "PASA Executive Election 2026",
      votingOpensAt: new Date("2026-06-18T09:00:00+01:00"),
      votingClosesAt: new Date("2026-06-18T16:00:00+01:00"),
      votingOpen: true,
    },
  });

  console.log("→ Positions & candidates…");
  const candidateVoteCounts: { id: string; votes: number }[] = [];
  for (let pi = 0; pi < POSITIONS.length; pi++) {
    const p = POSITIONS[pi];
    const position = await prisma.position.create({
      data: { title: p.title, order: pi },
    });
    for (let ci = 0; ci < p.candidates.length; ci++) {
      const [name, level, avatarBg, votes, manifesto] = p.candidates[ci];
      const cand = await prisma.candidate.create({
        data: {
          positionId: position.id,
          name: name as string,
          level: level as string,
          avatarBg: avatarBg as string,
          manifesto: manifesto as string,
          order: ci,
        },
      });
      candidateVoteCounts.push({ id: cand.id, votes: votes as number });
    }
  }

  console.log("→ Voter roster (312)…");
  const roster = buildRoster();
  await prisma.voter.createMany({ data: roster });

  if (SEED_DEMO) {
    console.log("→ Demo votes…");
    const voteRows: { positionId: string; candidateId: string }[] = [];
    const cands = await prisma.candidate.findMany();
    const byId = new Map(cands.map((c) => [c.id, c.positionId]));
    for (const { id, votes } of candidateVoteCounts) {
      const positionId = byId.get(id)!;
      for (let i = 0; i < votes; i++) voteRows.push({ positionId, candidateId: id });
    }
    // chunked insert
    for (let i = 0; i < voteRows.length; i += 500) {
      await prisma.vote.createMany({ data: voteRows.slice(i, i + 500) });
    }

    // Mark a consistent number of voters as having voted (max position turnout).
    const turnout = Math.max(
      ...POSITIONS.map((p) => p.candidates.reduce((a, c) => a + (c[3] as number), 0)),
    );
    // Keep the demo matrics votable so the live voting flow can be tested.
    const DEMO_VOTABLE = new Set(["PUB/22/014", "PUB/22/027", "PUB/23/102"]);
    const toMark = roster
      .filter((r) => !DEMO_VOTABLE.has(r.matricNumber))
      .slice(0, turnout)
      .map((r) => r.matricNumber);
    await prisma.voter.updateMany({
      where: { matricNumber: { in: toMark } },
      data: { hasVoted: true, votedAt: new Date() },
    });

    console.log("→ Flagged attempts (demo)…");
    await prisma.flaggedAttempt.createMany({
      data: ["PUB/22/001", "PUB/22/043", "PUB/21/008"].map((m) => ({
        matricNumber: m,
        reference: generateFlagRef(),
      })),
    });
  } else {
    // Keep the duplicate-vote demo working even on a clean election.
    await prisma.voter.update({
      where: { matricNumber: "PUB/22/001" },
      data: { hasVoted: true, votedAt: new Date() },
    });
  }

  console.log("→ Admin & observer accounts…");
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@oyscatech.edu.ng";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "ChangeMe!Admin2026";
  const observerEmail = process.env.OBSERVER_EMAIL ?? "observer@oyscatech.edu.ng";
  const observerPassword = process.env.OBSERVER_PASSWORD ?? "ChangeMe!Observer2026";

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { passwordHash: await bcrypt.hash(adminPassword, 10), role: "ADMIN" },
    create: {
      email: adminEmail,
      name: "Electoral Officer",
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: "ADMIN",
    },
  });
  await prisma.adminUser.upsert({
    where: { email: observerEmail },
    update: { passwordHash: await bcrypt.hash(observerPassword, 10), role: "OBSERVER" },
    create: {
      email: observerEmail,
      name: "Accredited Observer",
      passwordHash: await bcrypt.hash(observerPassword, 10),
      role: "OBSERVER",
    },
  });

  console.log("✔ Seed complete.");
  console.log(`   Admin:    ${adminEmail} / ${adminPassword}`);
  console.log(`   Observer: ${observerEmail} / ${observerPassword}`);
  console.log("   Voter demo matrics: PUB/22/014, PUB/22/027, PUB/23/102");
  console.log("   Already-voted (flag demo): PUB/22/001");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
