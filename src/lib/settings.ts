import { prisma } from "./db";

export interface ElectionSettings {
  institution: string;
  faculty: string;
  department: string;
  electionTitle: string;
  votingOpen: boolean;
  votingOpensAt: Date | null;
  votingClosesAt: Date | null;
}

const DEFAULTS: ElectionSettings = {
  institution: "Oyo State College of Agriculture and Technology",
  faculty: "Faculty of Management & Communication Studies",
  department: "Department of Public Administration",
  electionTitle: "PASA Executive Election 2026",
  votingOpen: true,
  votingOpensAt: null,
  votingClosesAt: null,
};

/** Reads settings; returns sensible defaults if the DB is unreachable. */
export async function getElectionSettings(): Promise<ElectionSettings> {
  try {
    const s = await prisma.setting.findUnique({ where: { id: 1 } });
    if (!s) return DEFAULTS;
    return {
      institution: s.institution,
      faculty: s.faculty,
      department: s.department,
      electionTitle: s.electionTitle,
      votingOpen: s.votingOpen,
      votingOpensAt: s.votingOpensAt,
      votingClosesAt: s.votingClosesAt,
    };
  } catch {
    return DEFAULTS;
  }
}
