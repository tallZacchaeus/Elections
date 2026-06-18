import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ObserverPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  // Both observers and admins may view the observer portal.
  if (!session) redirect("/observer/login");
  return <>{children}</>;
}
