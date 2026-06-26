import { getPortalInfo } from "@/lib/settings";
import { Portal } from "@/components/portal/Portal";

export const dynamic = "force-dynamic";

export default async function Home() {
  const info = await getPortalInfo();
  return (
    <Portal
      title={info.hasElection ? info.title : "PASA Election System"}
      faculty={info.faculty}
      department={info.department}
      institution={info.institution}
      votingOpen={info.votingOpen}
      hasElection={info.hasElection}
    />
  );
}
