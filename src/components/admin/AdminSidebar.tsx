"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Vote,
  LayoutDashboard,
  Users,
  ClipboardList,
  BarChart3,
  Flag,
  FileSpreadsheet,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin/elections", label: "Elections", icon: Vote },
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/candidates", label: "Candidates", icon: Users },
  { href: "/admin/roster", label: "Voter roster", icon: ClipboardList },
  { href: "/admin/results", label: "Results", icon: BarChart3 },
  { href: "/admin/flagged", label: "Flagged attempts", icon: Flag },
  { href: "/admin/master-report", label: "Master report", icon: FileSpreadsheet },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar({
  name,
  election,
}: {
  name: string;
  election: { title: string; status: string } | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const inner = (
    <>
      <div className="mb-4 flex items-center gap-2.5 border-b border-sidebar-border px-2 pb-4">
        <div className="flex size-9 flex-none items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
          <LayoutDashboard className="size-4.5" />
        </div>
        <div className="leading-tight">
          <div className="font-display text-sm font-bold text-sidebar-foreground">Admin Console</div>
          <div className="truncate text-[10.5px] text-sidebar-foreground/60">PASA Election System</div>
        </div>
      </div>

      {/* Managed-election context */}
      <Link
        href="/admin/elections"
        className="mb-3 block rounded-lg border border-sidebar-border bg-sidebar-accent/40 px-3 py-2.5 transition-colors hover:bg-sidebar-accent"
      >
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
          Managing
        </div>
        {election ? (
          <>
            <div className="mb-1.5 text-[12.5px] font-bold leading-tight text-sidebar-foreground">
              {election.title}
            </div>
            <StatusBadge status={election.status} />
          </>
        ) : (
          <div className="text-[12.5px] text-sidebar-foreground/80">No election — create one →</div>
        )}
      </Link>

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
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
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="no-print sticky top-0 z-30 flex items-center gap-3 bg-sidebar px-4 py-3 text-sidebar-foreground md:hidden">
        <button
          aria-label="Open menu"
          onClick={() => setOpen(true)}
          className="flex size-9 items-center justify-center rounded-md hover:bg-sidebar-accent"
        >
          <Menu className="size-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex size-7 flex-none items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <LayoutDashboard className="size-4" />
          </div>
          <span className="font-display text-sm font-bold">Admin Console</span>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="no-print fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="absolute top-0 left-0 flex h-full w-[78%] max-w-72 flex-col bg-sidebar p-4 text-sidebar-foreground shadow-xl">
            <button
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent"
            >
              <X className="size-4" />
            </button>
            {inner}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="no-print sticky top-0 m-3 hidden min-h-[calc(100vh-1.5rem)] w-60 flex-none flex-col rounded-xl bg-sidebar p-4 text-sidebar-foreground shadow-[0_10px_30px_-20px_rgba(16,40,30,0.6)] md:flex">
        {inner}
      </aside>
    </>
  );
}
