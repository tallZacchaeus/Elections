import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/auth/LoginForm";

export const dynamic = "force-dynamic";

export default async function ObserverLoginPage() {
  const session = await getSession();
  if (session) redirect("/observer");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
      <LoginForm
        portal="observer"
        title="Observer Portal"
        subtitle="Accredited monitors — read-only access to live results."
        redirectTo="/observer"
        hint={
          process.env.NODE_ENV !== "production"
            ? "Demo: observer@oyscatech.edu.ng / ChangeMe!Observer2026"
            : undefined
        }
      />
    </div>
  );
}
