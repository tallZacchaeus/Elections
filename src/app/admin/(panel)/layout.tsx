import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getElectionSettings } from "@/lib/settings";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/admin/login");

  const settings = await getElectionSettings();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <AdminSidebar name={session.name} title={settings.electionTitle} />
      <main style={{ flex: 1, minWidth: 0, background: "#F2F0E6", padding: "30px 34px 60px" }}>
        {children}
      </main>
    </div>
  );
}
