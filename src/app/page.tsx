import { getElectionSettings } from "@/lib/settings";
import { Portal } from "@/components/portal/Portal";

export const dynamic = "force-dynamic";

export default async function Home() {
  const settings = await getElectionSettings();
  return (
    <Portal
      title={settings.electionTitle}
      faculty={settings.faculty}
      department={settings.department}
      institution={settings.institution}
      votingOpen={settings.votingOpen}
    />
  );
}
