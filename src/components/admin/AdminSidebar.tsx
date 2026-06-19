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
    <aside className="no-print sticky top-0 m-3 flex min-h-[calc(100vh-1.5rem)] w-60 flex-none flex-col rounded-xl bg-sidebar p-4 text-sidebar-foreground shadow-[0_10px_30px_-20px_rgba(16,40,30,0.6)]">
      <div className="mb-4 flex items-center gap-2.5 border-b border-sidebar-border px-2 pb-4">
        <div className="flex size-9 flex-none items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
          <LayoutDashboard className="size-4.5" />
        </div>
        <div className="leading-tight">
          <div className="font-display text-sm font-bold text-sidebar-foreground">Admin Console</div>
          <div className="truncate text-[10.5px] text-sidebar-foreground/60">{title}</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-[13.5px] font-semibold transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4">
        <Separator className="mb-3 bg-sidebar-border" />
        <div className="px-2 pb-3 text-[11px] leading-relaxed text-sidebar-foreground/60">
          Signed in as
          <br />
          <strong className="font-semibold text-sidebar-foreground">{name}</strong>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          onClick={logout}
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
