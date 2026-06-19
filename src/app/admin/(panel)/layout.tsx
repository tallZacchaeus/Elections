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
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <AdminSidebar name={session.name} title={settings.electionTitle} />
      <main className="min-w-0 flex-1 px-4 pt-6 pb-16 md:px-8 md:pt-8">{children}</main>
    </div>
  );
}
