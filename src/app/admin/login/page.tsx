import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/auth/LoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session?.role === "ADMIN") redirect("/admin");

  return (
    <LoginForm
      portal="admin"
      title="Admin Console"
      subtitle="Sign in to manage the PASA Election."
      redirectTo="/admin"
      hint={
        process.env.NODE_ENV !== "production"
          ? "Demo: admin@oyscatech.edu.ng / ChangeMe!Admin2026"
          : undefined
      }
    />
  );
}
