import { getVoterFacingElection } from "./elections";

export interface PortalInfo {
  hasElection: boolean;
  title: string;
  faculty: string;
  department: string;
  institution: string;
  votingOpen: boolean;
}

const DEFAULTS = {
  institution: "Oyo State College of Agriculture and Technology",
  faculty: "Faculty of Management & Communication Studies",
  department: "Department of Public Administration",
  title: "PASA Election System",
};

/** Voter-facing election info for the portal; safe defaults if the DB is down. */
export async function getPortalInfo(): Promise<PortalInfo> {
  try {
    const e = await getVoterFacingElection();
    if (!e) {
      return { hasElection: false, ...DEFAULTS, votingOpen: false };
    }
    return {
      hasElection: true,
      title: e.title,
      faculty: e.faculty,
      department: e.department,
      institution: e.institution,
      votingOpen: e.status === "OPEN",
    };
  } catch {
    return { hasElection: false, ...DEFAULTS, votingOpen: false };
  }
}
