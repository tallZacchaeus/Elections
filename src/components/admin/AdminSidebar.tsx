"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, ClipboardList, BarChart3, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/candidates", label: "Candidates", icon: Users },
  { href: "/admin/roster", label: "Voter roster", icon: ClipboardList },
  { href: "/admin/results", label: "Results", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar({ name, title }: { name: string; title: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="no-print sticky top-0 flex min-h-screen w-56 flex-none flex-col bg-card p-3.5">
      <div className="mb-3.5 flex items-center gap-2.5 border-b px-2 pb-4">
        <div className="flex size-9 flex-none items-center justify-center rounded-md bg-primary text-primary-foreground">
          <LayoutDashboard className="size-4.5" />
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold text-foreground">Admin Console</div>
          <div className="truncate text-[10.5px] text-muted-foreground">{title}</div>
        </div>
      </div>

      <nav className="flex flex-col gap-0.5">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors",
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4">
        <Separator className="mb-3" />
        <div className="px-2 pb-3 text-[11px] leading-relaxed text-muted-foreground">
          Signed in as
          <br />
          <strong className="font-semibold text-foreground">{name}</strong>
        </div>
        <Button variant="outline" className="w-full justify-start gap-2" onClick={logout}>
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
